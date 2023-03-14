/**
 * after:search Hook 处理 Spec 标签
 * @param {} data
 * @returns
 */
function AfterSearch(response) {
  var data = response.data || [];
  for (var i in data) {
    var specs = data[i].specs || {};
    var specTags = [];
    for (var k in specs) {
      //   specTags.push({ label: `${k}: ${specs[k]}`, color: "#ff0000" });
      specTags.push(`${k}: ${specs[k]}`);
    }
    data[i]["spec_tags"] = specTags;
  }
  response["data"] = data;
  return response;
}

function WithsAfterSearch(response) {
  var data = response.data || [];
  for (var i in data) {
    var material = data[i].material || {};
    var sku = data[i].sku || {};
    var user = data[i].user || {};
    var specs = sku.specs || {};
    var specTags = [];
    for (var k in specs) {
      //   specTags.push({ label: `${k}: ${specs[k]}`, color: "#ff0000" });
      specTags.push(`${k}: ${specs[k]}`);
    }
    data[i]["spec_tags"] = specTags;
    data[i]["sku_name"] = material.name;
    data[i]["user_name"] = user.name;
    if (specTags.length > 0) {
      var label = specTags.join(", ");
      data[i]["sku_name"] = `${material.name} (${label})`;
    }

    data[i]["day"] = FormatDateTime(new Date(data[i]["uptime"]));
  }
  response["data"] = data;
  return response;
}

function SpecsToTags(specs) {
  var specTags = [];
  specs = specs || {};
  for (var k in specs) {
    specTags.push(`${k}: ${specs[k]}`);
  }
  return specTags;
}

function SpecsToLabel(specs) {
  var tags = SpecsToTags(specs);
  return tags.join(", ");
}

function WithFullName(data, field) {
  data = data || [];
  for (var i in data) {
    var name = data[i][field] || "";
    var specs = data[i]["specs"] || {};
    if (name == "") {
      continue;
    }
    var label = SpecsToLabel(specs);
    if (label != "") {
      data[i][field] = `${name} (${label})`;
    }
  }
  return data;
}

/**
 * after:find Hook 处理 Spec 标签
 * @param {} data
 * @returns
 */
function AfterFind(response) {
  var specs_list = [];
  var specs = response.specs || {};

  // 加载默认值
  var defaults = DefaultSpecs(response.material_id);
  for (var i in defaults) {
    var name = defaults[i].name || "";
    if (name == "") {
      continue;
    }
    if (specs[name] === undefined) {
      specs[name] = null;
    }
  }

  var names = [];
  for (var name in specs) {
    names.push(name);
  }

  names.sort();
  for (var i in names) {
    var name = names[i];
    specs_list.push({ name: name, value: specs[name] || "" });
  }

  response["specs_list"] = specs_list;
  response["spec_defaults"] = defaults;
  return response;
}

function DefaultSpecs(material_id) {
  var specs = Process("models.material.spec.Get", {
    select: ["id", "name", "values"],
    wheres: [{ column: "material_id", value: material_id }],
    limit: 50,
  });
  return specs;
}

/**
 * 保存 Hook, 处理规格, 自动生成标签
 * @param {*} data
 */
function AfterSave(id, payload) {
  if (!payload["specs_list"]) {
    return;
  }

  var specs_list = payload["specs_list"] || {};
  var specs_data = specs_list["data"] || [];
  var specs = {};
  for (var i in specs_data) {
    var spec = specs_data[i] || {};
    if (spec.name) {
      specs[spec.name] = spec.value || "";
      if (payload["material_id"]) {
        Process("models.material.spec.Save", {
          material_id: payload["material_id"],
          name: spec.name,
          type: "文本",
        });
      }
    }
  }

  // 保存默认参数
  SaveDefaultSpecs(id, specs_data);

  var data = { id: id, specs: specs };

  // 生成SKU SN
  var sku_sn = payload["sku_sn"];
  if (payload["material_id"] && !sku_sn) {
    data["sku_sn"] = MakeSN(payload["material_id"], id);
  }

  return Process("models.material.sku.Save", data);
}

/**
 * 保存默认规格
 */
function SaveDefaultSpecs(material_id, specs_data) {
  specs_data = specs_data | [];
  for (var i in specs_data) {
    var spec = specs_data[i] || {};
    var res = Process("models.material.spec.Save", {
      material_id: material_id,
      name: spec.name,
      type: "文本",
    });

    throw res;
  }
}

/**
 * 读取单品详情 & 下一个 RFID 标签
 * @param {*} id
 */
function NextRFID(id) {
  var sku = Process("xiang.table.Find", "material.sku", id, {});

  //
  // "标签: 类目(6)-SKU(8)-计划(6)-Item(9)
  //      10000120000001000000400000001
  var category_sn = sku.category && sku.category.category_sn;
  var sku_sn = sku.sku_sn;
  var plan_sn = "000000";
  var prefix = `${category_sn}${sku_sn}${plan_sn}`;

  // 读取最后一个 ITEM
  rfids = Process("models.rfid.Get", {
    wheres: [{ column: "sn", op: "like", value: `${prefix}%` }],
    orders: [{ column: "sn", option: "desc" }],
    limit: 1,
  });

  var latest = 100000000;
  if (rfids.length > 0) {
    latest = parseInt(rfids[0].sn.substring(20, 29));
    var codes = rfids[0]["s_code"] || "";
  } else {
    var codes = "";
  }

  const next = latest + 1;
  var specs = [];
  for (var i in sku.specs_list || []) {
    specs.push(
      `${sku.specs_list[i].name}:${
        sku.specs_list[i].value ? sku.specs_list[i].value : "-"
      }`
    );
  }

  sku["NAME"] = sku.material ? sku.material.name : sku.id;
  sku["RFID"] = BigInt(`${prefix}${next}`).toString(16).toUpperCase();
  sku["SN"] = BigInt(`${prefix}${next}`).toString(10).toUpperCase();
  sku["SPECS"] = specs.length > 0 ? specs.join(", ") : "-";
  sku["UNIT"] = sku.unit;
  sku["CODE"] = codes;

  // Process("xiang.sys.Sleep", 2000);
  return sku;
}

/**
 * 通过标签
 * @param {*} sn
 */
function GetByRFID(sn) {
  sn = sn || "";
  if (sn.length < 15) {
    throw new Exception("未识别标签信息", 400);
  }

  const sku_sn = sn.substring(6, 14);
  skus = Process("models.material.sku.Get", {
    select: ["id"],
    wheres: [{ column: "sku_sn", value: sku_sn }],
  });
  if (skus.code) {
    throw new Exception(skus.message, skus.code);
  }
  if (skus.length == 0) {
    throw new Exception("标签无单品信息", 404);
  }

  console.log(skus);

  data = NextRFID(skus[0].id);
  data["RFID"] = BigInt(sn).toString(16).toUpperCase();
  data["SN"] = BigInt(sn).toString(10).toUpperCase();
  return data;
}

/**
 * 生成单品标签 (1+id)
 * 标签: 类目(6)-**SKU(8)**-计划(6)-Item(9)
 */
function MakeSN(material_id, id) {
  var sn = material_id.toString();
  sn = (parseInt(sn.padEnd(8, "0")) + parseInt(id)).toString();
  return sn;
}

/**
 * 生成RFID
 * @param {*} args
 */
function RFID(res) {
  if (res.total != 1) {
    return {
      data: [{ item: "1", sku: "1", plan: "1", category: "1" }],
      next: -1,
      page: 1,
      pagesize: 10,
      prev: -1,
      total: 1,
    };
  }

  var sku = res.data[0] || {};
  //
  // "标签: 类目(6)-SKU(8)-计划(6)-Item(9)
  //      10000120000001000000400000001
  var category_sn = sku.category && sku.category.category_sn;
  var sku_sn = sku.sku_sn;
  var plan_sn = "000000";
  var prefix = `${category_sn}${sku_sn}${plan_sn}`;

  // 读取最后一个 ITEM
  rfids = Process("models.rfid.Get", {
    wheres: [{ column: "sn", op: "like", value: `${prefix}%` }],
    orders: [{ column: "sn", option: "desc" }],
    limit: 1,
  });

  var latest = 100000000;
  if (rfids.length > 0) {
    latest = parseInt(rfids[0].sn.substring(20, 29));
  }

  var specs = sku.specs || {};
  var specs_list = [];
  for (var key in specs) {
    specs_list.push(`${key}:${specs[key]}`);
  }

  var items = [];
  next = latest;
  for (var i = 0; i < 100; i++) {
    next = next + 1;
    items.push({
      sku: `${specs_list.join(", ")} ${sku_sn}`,
      plan: `${plan_sn}`,
      category: `${sku.category.name} ${category_sn}`,
      item: `${prefix}${next}`,
      rfid: BigInt(`${prefix}${next}`).toString(16).toUpperCase(),
      node_id: 1,
      status: "空闲",
    });
  }

  return {
    data: items,
    next: -1,
    page: 1,
    pagesize: 100,
    prev: -1,
    total: 100,
  };
}

function FormatDateTime(date) {
  var year = date.getFullYear();
  var month = date.getMonth() + 1;
  var day = date.getDate();
  var hours = date.getHours();
  var mins = date.getMinutes();
  var secs = date.getSeconds();
  if (month < 10) {
    month = "0" + month;
  }
  if (day < 10) {
    day = "0" + day;
  }

  if (hours < 10) {
    hours = "0" + hours;
  }

  if (mins < 10) {
    mins = "0" + mins;
  }

  if (secs < 10) {
    secs = "0" + secs;
  }

  return `${year}年${month}月${day}日 ${hours}:${mins}:${secs}`;
}

//根据标签获取一个产品
function GetOne(payload, headers) {
  var code = payload.code;
  var datas = payload.data;
  for (var i in datas) {
    if (code == datas[i]["params"]["code"]) {
      return 1;
    }
  }
  // console.log(headers);
  // console.log(code);
  if (!code || code == "") {
    return "";
  }
  var find = Process("models.rfid.get", {
    wheres: [{ column: "s_code", value: code }],
    limit: 1,
  });
  if (!find.length) {
    return "";
  }
  code = find[0]["sn"];

  var res = Explode(code);
  var sku = res.sku;
  if (sku != "") {
    var product = Process("models.material.sku.get", {
      withs: { material: {} },
      wheres: [{ column: "sku_sn", value: sku }],
      limit: 1,
    });
    if (product.length) {
      if (
        product[0].material &&
        product[0].material.icon &&
        product[0].material.icon.length
      ) {
        var token = headers["Authorization"][0].replace("Bearer ", "");
        product[0].material.icon =
          "/api/xiang/storage/url?name=" +
          product[0].material.icon[0] +
          "&token=" +
          token;
      } else {
        product[0].material.icon = "";
      }
      return product[0];
    }
  }
  return "";
}
function Explode(sn) {
  sn = sn || "";
  var res = { category: "", sku: "", plan: "", item: "", sn: sn };

  // 无效标签
  if (sn.length != 29) {
    return res;
  }

  res.category = sn.substring(0, 6);
  res.sku = sn.substring(6, 14);
  res.plan = sn.substring(14, 20);
  res.item = sn.substring(20, 29);
  return res;
}
