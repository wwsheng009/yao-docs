/**form查找第一条数据 */
function Find(stockid) {
  var wheres = [{ ":stock.id": "仓库ID", "=": stockid }];

  const qb = new Query();
  var res = qb.Get({
    debug: true,
    select: [
      "stock.id as id",
      "stock.uptime",
      "stock.stock",
      ":datetime(stock.uptime) as day", //":DATE_FORMAT(stock.uptime, '%Y年%m月%d日 %H:%i:%s') as day",
      "sku.id as sku_id",
      "sku.specs$ as sku_specs",
      "sku.stock as sku_stock",
      "material.id as material_id",
      "material.name as material_name",
      "category.id as category_id",
      "category.name as category_name",
      "warehouse.id as warehouse_id",
      "warehouse.name as warehouse_name",
    ],
    from: "stock",
    joins: [
      { left: true, from: "sku", key: "sku.id", foreign: "stock.sku_id" },
      {
        left: true,
        from: "warehouse",
        key: "warehouse.id",
        foreign: "stock.warehouse_id",
      },
      {
        left: true,
        from: "material",
        key: "material.id",
        foreign: "sku.material_id",
      },
      {
        left: true,
        from: "category",
        key: "category.id",
        foreign: "material.category_id",
      },
    ],
    wheres: wheres,
  });

  // 格式化数据
  var data = [];
  for (var i in res) {
    row = convertRow(res[i]);
    data.push(row);
  }
  if (data && data.length) {
    return data[0];
  }
  return data;
}

/**
 * 库存信息查询
 * @param {*} query
 * @param {*} page
 * @param {*} pagesize
 */
function Search(query, page, pagesize) {
  query = query || {};
  page = page || 1;
  pagesize = pagesize || 10;
  var keywords = "";
  var status = "";
  if (query.wheres && query.wheres.length > 0) {
    query.wheres.forEach((where) => {
      switch (where.column) {
        case "name":
          keywords = where.value || "";
          break;
        case "status":
          status = where.value || "";
          break;
      }
    });
  }

  var wheres = [];
  if (keywords != "") {
    wheres = [{ ":material.name": "物料名称", match: keywords }];
  }

  switch (status) {
    case "不足":
      wheres.push({ ":stock.stock": "库存", "<": "{sku.stock}" });
      break;
    case "正常":
      wheres.push({ ":stock.stock": "库存", ">=": "{sku.stock}" });
      break;
  }

  const qb = new Query();
  var res = qb.Paginate({
    debug: true,
    select: [
      "stock.id as id",
      "stock.uptime",
      "stock.stock",
      ":datetime(stock.uptime) as day", //":DATE_FORMAT(stock.uptime, '%Y年%m月%d日 %H:%i:%s') as day",
      "sku.id as sku_id",
      "sku.specs$ as sku_specs",
      "sku.stock as sku_stock",
      "material.id as material_id",
      "material.name as material_name",
      "category.id as category_id",
      "category.name as category_name",
      "warehouse.id as warehouse_id",
      "warehouse.name as warehouse_name",
    ],
    from: "stock",
    joins: [
      { left: true, from: "sku", key: "sku.id", foreign: "stock.sku_id" },
      {
        left: true,
        from: "warehouse",
        key: "warehouse.id",
        foreign: "stock.warehouse_id",
      },
      {
        left: true,
        from: "material",
        key: "material.id",
        foreign: "sku.material_id",
      },
      {
        left: true,
        from: "category",
        key: "category.id",
        foreign: "material.category_id",
      },
    ],
    wheres: wheres,
    orders: "stock.uptime desc",
    pagesize: pagesize,
    page: page,
  });

  // 格式化数据
  var data = [];
  for (var i in res.items) {
    row = convertRow(res.items[i]);
    data.push(row);
  }

  delete res["items"];
  res["data"] = data;
  return res;
}

// [
//   {
//       "category_id": null,
//       "category_name": null,
//       "day": "2023-03-15 09:45:16",
//       "id": 1,
//       "material_id": null,
//       "material_name": null,
//       "sku_id": null,
//       "sku_specs": {},
//       "sku_stock": null,
//       "stock": 12,
//       "uptime": "2023-03-15 09:45:16",
//       "warehouse_id": null,
//       "warehouse_name": null
//   }
// ]
// [
//   {
//       "category": {
//           "id": null,
//           "name": null
//       },
//       "day": "2023-03-15 09:45:16",
//       "id": 1,
//       "material": {
//           "id": null,
//           "name": null
//       },
//       "sku": {
//           "id": null,
//           "specs": {},
//           "stock": null
//       },
//       "sku_id": null,
//       "sku_name": "",
//       "status": "正常",
//       "stock": 12,
//       "uptime": "2023-03-15 09:45:16",
//       "warehouse": {
//           "id": null,
//           "name": null
//       },
//       "warehouse_id": null
//   }
// ]

/**扁平结构转换成对象 */
function convertRow(old_row) {
  var row = {
    sku: {},
    material: {},
    category: {},
    warehouse: {},
    ...old_row,
  };

  var replaces = ["sku", "material", "category", "warehouse"];

  //替换字段名
  for (var key in old_row) {
    var value = old_row[key];
    replaces.forEach((k) => {
      if (key.startsWith(`${k}_`)) {
        row[k][key.replace(`${k}_`, "")] = value;
        delete row[key];
      }
    });
  }

  row["sku_id"] = row.sku.id;
  row["sku_name"] = row.material.name || "";
  row["warehouse_id"] = row.warehouse.id;
  var specs = [];
  Object.keys(row["sku"].specs).forEach((name) => {
    const val = row["sku"].specs[name];
    specs.push(`${name}:${val}`);
  });

  if (specs.length > 0) {
    row["sku_name"] = `${row["sku_name"]} (${specs.join(", ")})`;
  }

  // 库存状态显示
  row["status"] = row.stock < row.sku.stock ? "不足" : "正常";
  return row;
}
