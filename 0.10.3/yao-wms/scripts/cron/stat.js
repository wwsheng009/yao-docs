/**
 * 统计上一日库存快照
 * CRON: 1 0 * * * /usr/local/bin/yao run scripts.cron.stat.Stock $(date '+%Y-%m-%d')
 * 修复历史数据: /usr/local/bin/yao run scripts.cron.stat.Stock
 */
function Stock(day) {
  if (day) {
    const date = new Date(day);
    var now = new Date(date.getTime() - date.getTimezoneOffset() * 60000);
    now.setDate(now.getDate() - 1);
    day = now.toISOString().split("T")[0];
    console.log(`Stock: ${day}`);
    stockSnap(day);
    return;
  }

  // 生成最近30天的数据
  const date = new Date();
  var now = new Date(date.getTime() - date.getTimezoneOffset() * 60000);
  for (var i = 0; i < 30; i++) {
    now.setDate(now.getDate() - 1);
    var day = now.toISOString().split("T")[0];
    console.log(`Stock: ${day}`);
    stockSnap(day);
  }
}

/**
 * 统计上一日人员进出
 * CRON: 1 0 * * * /usr/local/bin/yao run scripts.cron.stat.User $(date '+%Y-%m-%d')
 * 修复历史数据: /usr/local/bin/yao run scripts.cron.stat.User
 */
function User(day) {
  if (day) {
    const date = new Date(day);
    var now = new Date(date.getTime() - date.getTimezoneOffset() * 60000);
    now.setDate(now.getDate() - 1);
    day = now.toISOString().split("T")[0];
    console.log(`User: ${day}`);
    userSnap(day);
    return;
  }

  // 生成最近30天的数据
  const date = new Date();
  var now = new Date(date.getTime() - date.getTimezoneOffset() * 60000);
  for (var i = 0; i < 30; i++) {
    now.setDate(now.getDate() - 1);
    var day = now.toISOString().split("T")[0];
    console.log(`User: ${day}`);
    userSnap(day);
  }
}

/**
 * 用户进出快照
 * @param {*} day
 */
function userSnap(day) {
  var now = Process("scripts.time.Ago", 1);
  if (day) {
    now = new Date(day).toISOString().split("T")[0];
  }

  var data = Process("flows.stat.user", now);
  var users = {};

  // 整理数据
  for (var i in data) {
    var stat = data[i];
    var user_id = stat.user_id;
    users[user_id] = users[user_id] ? users[user_id] : {};
    if (stat.type == "离开") {
      users[user_id]["离开"] = stat.数量;
    } else {
      users[user_id]["进入"] = stat.数量;
    }
  }

  // 生成快照
  var columns = ["day", "user_id", "enter", "leave"];
  var values = [];
  for (var user_id in users) {
    values.push([
      now,
      user_id,
      users[user_id].进入 ? users[user_id].进入 : 0,
      users[user_id].离开 ? users[user_id].离开 : 0,
    ]);
  }

  // 删除历史数据
  Process("models.stat.user.DestroyWhere", {
    wheres: [{ column: "day", value: now }],
  });

  // 插入新数据
  Process("models.stat.user.Insert", columns, values);
  return [columns, values];
}

/**
 * 日库存快照
 * @param {*} day
 */
function stockSnap(day) {
  var now = Process("scripts.time.Ago", 1);
  if (day) {
    now = new Date(day).toISOString().split("T")[0];
  }

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
  var columns = ["day", "sku_id", "stock", "stock_alert"];
  var values = [];
  for (var sku_id in skus) {
    var in_cnt = sku_ins[sku_id] ? sku_ins[sku_id].数量 : 0;
    var out_cnt = sku_outs[sku_id] ? sku_outs[sku_id].数量 : 0;
    var stock = in_cnt - out_cnt;
    if (stock < 0) {
      stock = 0;
    }
    var sku = sku_ins[sku_id] ? sku_ins[sku_id] : sku_outs[sku_id];
    values.push([now, sku_id, stock, sku.预警]);
  }

  // 删除历史数据
  Process("models.stat.stock.DestroyWhere", {
    wheres: [{ column: "day", value: now }],
  });

  // 插入新数据
  Process("models.stat.stock.Insert", columns, values);
  return [columns, values];
}
