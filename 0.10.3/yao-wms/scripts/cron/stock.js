/**
 * 修复库存
 *  /usr/local/bin/yao run scripts.cron.stock.Repair
 * @param {*} day
 */
function Repair() {
  now = new Date().toISOString().split("T")[0];
  var data = Process("flows.stat.stock", now);
  var sku_ins = {};
  var sku_outs = {};
  var skus = {};

  // 整理数据
  for (var i in data.入库) {
    var stat = data.入库[i];
    sku_ins[stat.sku_id] = stat;
    skus[stat.sku_id] = {};
  }
  for (var i in data.出库) {
    var stat = data.出库[i];
    sku_outs[stat.sku_id] = stat;
    skus[stat.sku_id] = {};
  }

  // 计算库存
  var columns = ["sku_id", "warehouse_id", "stock", "uptime"];
  var values = [];
  for (var sku_id in skus) {
    var in_cnt = sku_ins[sku_id] ? sku_ins[sku_id].数量 : 0;
    var out_cnt = sku_outs[sku_id] ? sku_outs[sku_id].数量 : 0;
    var stock = in_cnt - out_cnt;
    if (stock < 0) {
      stock = 0;
    }
    values.push([sku_id, 1, stock, now]);
  }

  // 删除历史数据
  Process("models.stock.DestroyWhere", {
    wheres: [{ column: "day", value: now }],
  });

  // 插入新数据
  Process("models.stock.Insert", columns, values);
  return [columns, values];
}
