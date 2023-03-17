/**
 * 生成 demo 数据
 */
function Import() {
  var data = Process("scripts.tools.data.History");
  CreateCategory(data);
  const suppliers = GetSuppliers();
  for (var i in data) {
    var record = data[i];
    var sku_id = Sku(record, suppliers);
    if (sku_id !== null) {
      Records(sku_id, record);
    }
  }
}
function GetSuppliers() {
  const list = Process("models.supplier.Get", { select: ["id"] });
  // let list2 = [];
  // list.map((item) => list2.push(item.id));

  const newArray = list.reduce(
    (previousValue, currentValue) => previousValue.concat(currentValue.id),
    []
  );
  return newArray;
}
function CreateCategory(data) {
  let category = {};
  for (const key in data) {
    const row = data[key];
    var name = row["大项"];
    if (!name) {
      continue;
    }
    category[name] = name;
  }
  for (const key in category) {
    const name = category[key];

    var cate = Process("models.material.category.Get", {
      select: ["id"],
      wheres: [{ column: "name", value: name }],
    });

    if (cate.length < 1) {
      // 保存分类,使用yao.table.save会自动的触发after:save
      id = Process("yao.table.Save", "material.category", {
        name: name,
      });
    }
  }
}

function Stat() {
  var from = new Date("2023-03-11");
  var now = new Date();
  while (from.getTime() < now.getTime()) {
    from.setDate(from.getDate() + 1);
    // console.log(`Stat ${from.toISOString().split("%")[0]}`);
    // Process("scripts.cron.stat.Stock", from.toISOString().split("%")[0]);
    Process("scripts.cron.stat.User", from.toISOString().split("%")[0]);
  }
}

/**
 * 创建SKU
 * @param {*} row
 */
function Sku(row, suppliers) {
  material_id = Material(row, suppliers);
  if (material_id == -1) {
    return -1;
  }

  var name = row["物资名称"];
  var specs = row["规格型号"] || "";

  // 查询单品
  var sku = Process("models.material.sku.Get", {
    select: ["id", "specs"],
    withs: { material: {} },
    wheres: [
      { column: "name", value: name, rel: "material" },
      { column: "specs", value: specs, op: "match" },
    ],
  });

  if (sku.length > 0) {
    return sku[0].id;
  }

  var data = {
    material_id: material_id,
    unit: row["单位"],
    stock: 1,
  };

  data["specs"] = {};
  data["specs_list"] = { data: [], delete: [], query: { sort: "$index" } };
  if (specs != "") {
    data["specs_list"] = {
      data: [{ name: "型号", value: row["规格型号"] }],
      delete: [],
      query: { sort: "$index" },
    };
    data["specs"] = { 型号: row["规格型号"] };
  }

  // 保存单品
  const id = Process("yao.table.Save", "material.sku", data);
  if (id === null) {
    throw new Error("保存单品失败");
  }
  return id;
}

/**
 * 创建物料
 * @param {*} row
 */
function Material(row, suppliers) {
  var name = row["物资名称"];
  if (!name) {
    return -1;
  }

  const category_id = Category(row);
  if (category_id == -1) {
    return -1;
  }

  // 查询物资
  var material = Process("models.material.Get", {
    select: ["id"],
    wheres: [{ column: "name", value: name }],
  });

  if (material.length > 0) {
    return material[0].id;
  }

  let supplier_id = null;
  // Generate a random index
  if (suppliers.length > 0) {
    const randomIndex = Math.floor(Math.random() * suppliers.length);
    supplier_id = suppliers[randomIndex];
  }

  // 保存物资
  id = Process("yao.table.Save", "material", {
    name: name,
    supplier_id: supplier_id,
    category_id: category_id,
  });

  return id;
}

/**
 * 创建SKU
 * @param {*} row
 */
function Category(row) {
  var name = row["大项"];
  if (!name) {
    return -1;
  }

  var cate = Process("models.material.category.Get", {
    select: ["id"],
    wheres: [{ column: "name", value: name }],
  });

  if (cate.length < 1) {
    return -1;
  }

  return cate[0].id;
}

var user_in_id = 1;
var user_out_id = 2;
/**
 * 导入入库记录
 * @param {*} sku_id
 * @param {*} row
 */
function Records(sku_id, row) {
  var amount = parseInt(row["发放数量"]);
  if (amount == 0) {
    return;
  }

  if (user_in_id == 14) {
    user_in_id = 1;
  }

  if (user_out_id == 14) {
    user_out_id = 1;
  }

  var outtime = getDateTime(row["日期"]);
  var intime = getDateTime(row["日期"]);
  intime.setDate(intime.getDate() - 1);

  // 生成进入记录
  var err = Process("yao.table.Save", "record.total", {
    warehouse_id: 1,
    type: "进入",
    uptime: intime.toISOString(),
    status: "生效",
    user_id: 1,
    created_at: outtime.toISOString(),
  });

  console.log(`进入: ${intime.toISOString()} `, err);

  // 生成离开记录
  Process("yao.table.Save", "record.total", {
    warehouse_id: 1,
    type: "离开",
    uptime: outtime.toISOString(),
    status: "生效",
    user_id: 1,
    created_at: outtime.toISOString(),
  });

  for (var i = 0; i < amount; i++) {
    var sn = rfid(sku_id);
    console.log(`导入SKU #${sku_id} ${sn} ${i + 1}`);
    // 生成入库记录
    Process("yao.table.Save", "record.total", {
      warehouse_id: 1,
      type: "入库",
      sn: sn,
      uptime: intime.toISOString(),
      status: "生效",
      sku_id: sku_id,
      user_id: 1,
    });
    // 生成出库记录
    Process("yao.table.Save", "record.total", {
      warehouse_id: 1,
      type: "出库",
      sn: sn,
      uptime: outtime.toISOString(),
      status: "生效",
      sku_id: sku_id,
      user_id: 1,
    });
  }

  // 修复库存时间
  Process(
    "models.stock.UpdateWhere",
    { wheres: [{ column: "sku_id", value: sku_id, op: "=" }] },
    { uptime: outtime.toISOString() }
  );

  // 更新统计记录
  Process("scripts.cron.stat.Stock", outtime.toISOString().split("T")[0]);
  Process("scripts.cron.stat.User", outtime.toISOString().split("T")[0]);
  user_in_id++;
  user_out_id++;
}

function rfid(sku_id) {
  //通过视图计算出rfid,视图又从hook after:search中计算出rfid
  //material.sku.rfid 只能一条一条的读取处理
  var rfids = Process(
    "yao.table.Search",
    "material.sku.rfid",
    { wheres: [{ column: "id", value: sku_id }] },
    1,
    1
  );
  var rfid = rfids.data[0];
  Process("yao.table.Save", "rfid", { sn: rfid.item, status: "入库" });
  return rfid.item;
}

function getDateTime(day) {
  day = day || "";
  day = day.replace("月", "-");
  day = day.replace("日", "");
  day = `2023-${day} ${getRandomInt(9, 20)}:${getRandomInt(
    1,
    59
  )}:${getRandomInt(1, 59)}`;

  var datetime = new Date(day);
  var datetimeOffset = new Date(
    datetime.getTime() - new Date(day).getTimezoneOffset() * 60000
  );

  return datetimeOffset;
}

function getRandomInt(min, max) {
  min = Math.ceil(min);
  max = Math.floor(max);
  return Math.floor(Math.random() * (max - min + 1)) + min;
}
