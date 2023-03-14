// RFID数据导入
function RFID(columns, data) {
  var ignore = 0;
  var failure = 0;
  var last = columns.length - 1;
  columns.pop();

  //   逐条导入
  for (var i in data) {
    var row = data[i] || [];
    // 无效数据检查 __effected
    if (!row[last]) {
      ignore++;
      continue;
    }
    columns.push("s_code");

    row.pop();
    var times = String(Date.now());

    var t = times.substring(3);
    row.push(t);

    var res = Process("models.rfid.Insert", columns, [row]);
    if (res != null) {
      failure++;
    }
  }

  return [failure, ignore];
}

/**
 * 导入单品数据
 * @param {*} columns
 * @param {*} data
 * @returns
 */
function SKU(columns, rows) {
  var ignore = 0;
  var failure = 0;
  // console.log(columns, rows);
  for (var i in rows) {
    var row = rows[i];
    if (!row[5]) {
      ignore = ignore + 1;
      continue;
    }
    const category_id = GetSetCategory(row[3]);
    if (category_id === false) {
      continue;
    }
    const material_id = GetSetMaterial(row[0], category_id);
    id = GetSetSku(material_id, row[1], row[2], row[4]);
    if (id === false) {
      console.log(`failure: sku_id: ${id}`, id);
      failure = failure + 1;
    }
  }

  return [failure, ignore];
}

/**
 * 根据名称读取 SKU
 * @param {*} name
 * @param {*} specs
 */
function GetSetSku(material_id, specs, stock, unit) {
  stock = parseInt(stock);
  specs_list = parseSpecs(specs);
  specs = specs_list.data || [];
  var wheres = [{ column: "material_id", value: material_id }];
  specs.forEach((spec) => {
    wheres.push({ column: "specs", op: "match", value: `${spec.name}` });
    wheres.push({ column: "specs", op: "match", value: `${spec.value}` });
  });

  var res = Process("models.material.sku.Get", {
    select: ["id"],
    wheres: wheres,
    limit: 1,
  });

  if (res.code && res.message) {
    return false;
  }

  // Update
  if (res.length > 0) {
    var id = Process("xiang.table.Save", "material.sku", {
      id: res[0].id,
      material_id: material_id,
      stock: stock,
      unit: unit,
    });

    if (id && id.code) {
      return false;
    }
    return res[0].id;
  }

  // Insert
  var id = Process("xiang.table.Save", "material.sku", {
    material_id: material_id,
    stock: stock,
    unit: unit,
    specs_list: specs_list,
  });

  if (id && id.code) {
    return false;
  }

  return id;
}

function parseSpecs(value) {
  if (!value || value == "") {
    return { data: [], delete: [], query: { sort: "$index" } };
  }

  value = value.replaceAll("，", ",").replaceAll("：", ":");
  var specsList = [];
  var specs = value.split(",");

  specs.forEach((spec) => {
    const arrs = spec.split(":");
    const name = arrs[0].trim();
    const value = arrs.length > 1 ? arrs[1].trim() : "";
    specsList.push({ name: name, value: value });
  });

  return { data: specsList, delete: [], query: { sort: "$index" } };
}

/**
 * 读取或设定类目
 * @param {*} category
 */
function GetSetCategory(name) {
  const store = new Store("cache");
  var id = store.Get(`imports/category/${name}`);
  if (id) {
    return id;
  }

  var res = Process("models.material.category.Get", {
    select: ["id"],
    wheres: [{ column: "name", value: name }],
    limit: 1,
  });

  if (res.code && res.message) {
    return false;
  }

  if (res.length > 0) {
    store.Set(`imports/category/${name}`, res[0].id);
    return res[0].id;
  }

  // 新建分类
  id = Process("xiang.table.save", "material.category", { name: name });
  if (id.code) {
    return false;
  }

  store.Set(`imports/category/${name}`, id);
  return id;
}

/**
 * 读取或设定物料
 * @param {*} category
 */
function GetSetMaterial(name, category_id) {
  const store = new Store("cache");
  var id = store.Get(`imports/material/${name}`);
  if (id) {
    return id;
  }

  var res = Process("models.material.Get", {
    select: ["id"],
    wheres: [{ column: "name", value: name }],
    limit: 1,
  });

  if (res.code && res.message) {
    return false;
  }

  if (res.length > 0) {
    store.Set(`imports/material/${name}`, res[0].id);
    return res[0].id;
  }

  // 新建物料
  id = Process("xiang.table.save", "material", {
    name: name,
    category_id: category_id,
  });
  if (id.code) {
    return false;
  }

  store.Set(`imports/material/${name}`, id);
  return id;
}
