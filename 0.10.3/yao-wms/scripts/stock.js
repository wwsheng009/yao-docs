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
      "stock.id",
      "stock.uptime",
      "stock.stock",
      ":DATE_FORMAT(stock.uptime, '%Y年%m月%d日 %H:%i:%s') as day",
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
    var row = {
      sku: {},
      material: {},
      category: {},
      warehouse: {},
      ...res.items[i],
    };
    var replaces = ["sku", "material", "category", "warehouse"];

    for (var key in res.items[i]) {
      var value = res.items[i][key];
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
    row["status"] =
      row.stock < row.sku.stock
        ? [{ color: "#e62965", label: "不足" }]
        : [{ color: "#232326", label: "正常" }];

    data.push(row);
  }

  delete res["items"];
  res["data"] = data;
  return res;
}
