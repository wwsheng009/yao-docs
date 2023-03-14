/**
 * 已废弃 @2022年7月20日 -> event.js & node.js
 */

/**
 * 接收通报数据
 * @param {*} payload
 */
function Event(payload) {
  payload = payload || {};
  switch (payload.event) {
    case "进入":
      return onEnter(payload);
    case "离开":
      return onLeave(payload);
    case "入库":
      return onIn(payload);
    case "出库":
      return onOut(payload);
    case "异常":
      return onError(payload);
    case "心跳":
      return onPing(payload);
    case "人脸":
      return onFace(payload);
  }

  Log(`未知事件: ${payload.event}`, payload);
  return { message: "suceess", code: 200 };
}

/**
 * 人员进入事件
 *  {
 *    "data": {
 *      "action": "进入",
 *      "device_sn": "ET63606",
 *      "unique_id": "DL000001|进入|54974964.5",
 *      "uptime": "2022-04-06 20:42:15",
 *      "user_sn": "DL000001"
 *    },
 *    "event": "进入",
 *    "node_id": "1"
 *  }
 * @param {*} data
 */
function onEnter(message) {
  message = message || {};
  message.data = message.data || {};
  var user_id = getUserID(message.data.user_sn);
  var data = {
    warehouse_id: message.node_id,
    user_id: user_id,
    uptime: message.data.uptime,
    type: "进入",
    status: "生效",
  };
  var res = Process("xiang.table.Save", "record.total", data);
  if (res.code) {
    return res;
  }

  // 进入通知
  try {
    Process("scripts.event.Enter", data);
  } catch (e) {}

  return { message: "suceess", code: 200 };
}

/**
 * 人员离开事件
 *  {
 *    "data": {
 *      "action": "离开",
 *      "device_sn": "RLM-00037521",
 *      "unique_id": "DL000001|离开|54974965.233333334",
 *      "uptime": "2022-04-06 20:42:37",
 *      "user_sn": "DL000001"
 *    },
 *    "event": "离开",
 *    "node_id": "1"
 *  }
 * @param {*} message
 */
function onLeave(message) {
  message = message || {};
  message.data = message.data || {};
  var user_id = getUserID(message.data.user_sn);
  var data = {
    warehouse_id: message.node_id,
    user_id: user_id,
    uptime: message.data.uptime,
    type: "离开",
    status: "生效",
  };
  var res = Process("xiang.table.Save", "record.total", data);
  if (res.code) {
    return res;
  }

  // 离开通知
  try {
    Process("scripts.event.Leave", data);
  } catch (e) {}

  return { message: "suceess", code: 200 };
}

/**
 * 物料入库事件
 *  {
 *    "data": {
 *      "data": {
 *        "ids": ["152d02f296721e52b9cd", "152d02f2967250231ebb"],
 *        "ts": "6142a0d"
 *      },
 *      "user": {
 *        "action": "进入",
 *        "device_sn": "ET63606",
 *        "unique_id": "DL000001|进入|54974964.5",
 *        "uptime": "2022-04-06 20:42:15",
 *        "user_sn": "DL000001"
 *      }
 *    },
 *    "event": "入库",
 *    "node_id": "1"
 *  }
 * @param {*} message
 */
function onIn(message) {
  return saveRFIDs("入库", message);
}

/**
 * 物料出库事件
 *  {
 *    "data": {
 *      "data": {
 *        "ids": ["152d02f296721e52b9cd", "152d02f2967250231ebb"],
 *        "ts": "6142c1e"
 *      },
 *      "user": {
 *        "action": "离开",
 *        "device_sn": "RLM-00037521",
 *        "unique_id": "DL000001|离开|54974969.46666667",
 *        "uptime": "2022-04-06 20:44:44",
 *        "user_sn": "DL000001"
 *      }
 *    },
 *    "event": "出库",
 *    "node_id": "1"
 *  }
 * @param {*} message
 */
function onOut(message) {
  return saveRFIDs("出库", message);
}

/**
 * 接收异常事件
 * @param {*} message
 */
function onError(message) {
  // return { message: "suceess", code: 200 };
  return saveRFIDs("异常", message);
}

/**
 * 心跳检查
 * @param {*} message
 */
function onPing(message) {
  message = message || {};
  var data = message.data || {};
  var node_id = message.node_id || null;
  if (node_id == "") {
    return 400;
  }

  if (!data.host || data.host == "" || !data.timestamp) {
    return 400;
  }

  var addrs = data.host.split(":");
  if (addrs.length != 2) {
    return 400;
  }

  // 转换时间
  var uptime = toSqlDatetime(data.timestamp * 1000);
  var res = Process("models.warehouse.Save", {
    id: node_id,
    ip: addrs[0],
    port: addrs[1],
    uptime: uptime,
    status: "在线",
  });

  if (res != parseInt(node_id)) {
    console.log(res);
    return 400;
  }

  return 200;
}

/**
 * 指令下发
 *
 * {
 *  "data": {
 *      "cmd": "to_client",
 *      "data": {
 *          "cmd": "addUserRet",
 *          "code": 0,
 *          "msg": "下发成功",
 *          "user_id": "1001"
 *      },
 *      "form": "ET63606",
 *      "to": "face.UserUpload"
 *  },
 *  "event": "人脸",
 *  "node_id": "1",
 *  "request_id": "6F71FB370CDD0EB040A9C46DEEBA66E5"
 *}
 * @param {*} message
 * @returns
 */
function onFace(message) {
  message = message || {};
  var data = message.data || {};
  var from = data.form || "";
  var resp = data.data || {};
  var cmd = resp.cmd || "";
  // 应该加入配置
  var field = "";
  if (from == "ET63606") {
    field = "face_in";
  } else if (from == "RLM-00037521") {
    field = "face_out";
  } else {
    return 400;
  }

  switch (cmd) {
    // 下发用户
    case "addUserRet":
      var user_sn = resp.user_id;
      var status = resp.msg == "下发成功" ? "已同步" : "同步失败";
      if (!user_sn) {
        return 400;
      }

      var payload = {};
      payload[field] = status;
      console.log(payload, { column: "user_sn", value: user_sn });
      var res = Process(
        "models.user.UpdateWhere",
        {
          wheres: [{ column: "user_sn", value: user_sn }],
        },
        payload
      );

      break;

    // 删除用户
    case "delUserRet":
      var user_sn = resp.user_id;
      var status = resp.msg == "删除成功" ? "已同步" : "同步失败";
      if (!user_sn) {
        return 400;
      }
      var payload = {};
      payload[field] = status;
      console.log(payload, { column: "user_sn", value: user_sn });
      var res = Process(
        "models.user.UpdateWhere",
        {
          wheres: [{ column: "user_sn", value: user_sn }],
        },
        payload
      );
      break;
  }

  return 200;
}

/**
 * 保存标签数据
 * @param {*} type 类型: 入库 | 出库 | 异常
 * @param {*} message 事件通报数据
 */
function saveRFIDs(type, message) {
  message = message || {};
  var data = message.data || {};
  var user = data.user || {};
  var rfids = data.data || {};
  var ids = rfids.ids || [];
  var node_id = message.node_id;
  var request_id = message.request_id;

  // 数据校验
  if (!user.user_sn || user.user_sn == "") {
    throw new Exception("缺少用户编码", 400);
  }

  if (ids.length == 0) {
    throw new Exception("缺少标签信息", 400);
  }

  var uptime =
    user.uptime ||
    new Date(dateTime)
      .toISOString()
      .replace(/T/g, " ")
      .replace(/\.[\d]{3}Z/, "");

  var hmtime = uptime.split(" ");
  if (hmtime.length != 2) {
    hmtime = ["1970-01-01", "00:00:00"];
  }

  user = getUser(user.user_sn);
  var user_id = user.id;
  var record_ids = [];
  var ticket_id = null;
  var name = `${type} | ${user.name} | ${hmtime[0]} | ${hmtime[1]}`;

  // 新增凭据
  if (type == "入库" || type == "出库") {
    ticket_id = Process("xiang.table.Save", "ticket.total", {
      name: name,
      warehouse_id: node_id,
      user_id: user_id,
      type: type, // 入库 | 出库
      records: {},
      // plan_id: plan_id,
      uptime: uptime,
      status: "生效",
    }); // 更新记录

    // 保存出错了
    if (typeof ticket_id == "object" && ticket_id.code) {
      console.log(`添加凭据: #${request_id}`, ticket_id);
    }
  }

  // 保存到记录表(record)
  var records = [];
  for (var i in ids) {
    var sn = Process("scripts.rfid.Explode", ids[i]) || {};
    if (!sn.sku) {
      console.log(sn);
      throw new Exception("非法的标签信息", 400);
    }
    var plan_id = null;
    var sku_id = getSkuID(sn.sku);
    if (type == "入库") {
      plan_id = getPlanID(sn.plan);
    }

    var record = {
      warehouse_id: node_id,
      user_id: user_id,
      ticket_id: ticket_id,
      type: type, // 入库 | 出库 | 异常
      sn: ids[i],
      batch: request_id, // 批次
      plan_id: plan_id,
      sku_id: sku_id,
      uptime: uptime,
      status: "生效",
    };

    var record_id = Process("xiang.table.Save", "record.total", record); // 更新记录

    // 保存出错了
    if (typeof record_id == "object" && record_id.code) {
      console.log(`添加标签: #${ids[i]}`, record_id);
    }

    // 保存历史数据
    record_ids.push(record_id);
    records.push(record);
  }

  // 发送通知
  try {
    if (type == "入库") {
      Process("scripts.event.In", records);
    } else if (type == "出库") {
      Process("scripts.event.Out", records);
    }
  } catch (e) {}

  return { message: "suceess", code: 200 };
}

function getUser(user_sn) {
  var users = Process("models.user.Get", {
    select: ["id", "user_sn", "name"],
    wheres: [{ column: "user_sn", value: user_sn }],
  });
  if (users.code && users.code != 200) {
    console.log(`未找到用户 ${user_sn} ${users.message}`);
    throw new Error(`未找到用户 ${user_sn} ${users.message}`);
  }

  if (users.length == 0) {
    console.log(`未找到用户 ${user_sn}`);
    throw new Error(`未找到用户 ${user_sn}`);
  }

  var user = users[0] || {};
  return user;
}

function getUserID(user_sn) {
  var users = Process("models.user.Get", {
    select: ["id", "user_sn"],
    wheres: [{ column: "user_sn", value: user_sn }],
  });
  if (users.code && users.code != 200) {
    console.log(`未找到用户 ${user_sn} ${users.message}`);
    throw new Error(`未找到用户 ${user_sn} ${users.message}`);
  }

  if (users.length == 0) {
    console.log(`未找到用户 ${user_sn}`);
    throw new Error(`未找到用户 ${user_sn}`);
  }

  var user = users[0] || {};
  return user.id;
}

function getPlanID(plan_sn) {
  var plans = Process("models.plan.Get", {
    select: ["id", "plan_sn"],
    wheres: [{ column: "plan_sn", value: plan_sn }],
  });

  if (plans.code && plans.code != 200) {
    console.log(`未找到计划信息数据 ${sku_sn} ${plans.message}`);
    throw new Error(`未找到计划信息数据 ${sku_sn}  ${plans.message}`);
  }

  if (plans.length == 0) {
    return null;
  }

  var plan = plans[0] || {};

  return plan.id;
}

function getSkuID(sku_sn) {
  var skus = Process("models.material.sku.Get", {
    select: ["id", "sku_sn"],
    wheres: [{ column: "sku_sn", value: sku_sn }],
  });

  if (skus.code && skus.code != 200) {
    console.log(`未找到单品数据 ${sku_sn} ${skus.message}`);
    throw new Error(`未找到单品数据 ${sku_sn}  ${skus.message}`);
  }
  return skus[0].id;
}

/**
 * 大屏幕展示数据
 */
function Live() {
  var now = new Date();
  now.setSeconds(now.getSeconds() - 60); // 1分钟内的数据
  var timeAgo = now.toISOString().slice(0, 19).replace("T", " ");
  records = Process(
    "xiang.table.Search",
    "record.total",
    {
      select: ["id", "user_id", "uptime", "type"],
      wheres: [
        { column: "type", value: ["进入", "离开"], op: "in" },
        { column: "uptime", value: timeAgo, op: "ge" },
      ],
      orders: [{ column: "uptime", option: "desc" }],
    },
    1,
    1
  );

  var data = { user: {}, items: [] };
  if (records.total == 0) {
    return data;
  }

  var user = records.data[0].user || {};

  // 处理照片
  if (user.photo != null && user.photo.length > 0) {
    user.photo = `/api/user/photo?file=${user.photo[0]}`;
  }
  user.action = records.data[0].type;
  data.user = user;

  items = Process(
    "xiang.table.Search",
    "record.total",
    {
      select: ["id", "uptime", "type", "sn"],
      wheres: [
        { column: "user_id", value: user.id },
        { column: "type", value: ["入库", "出库"], op: "in" },
        { column: "uptime", value: timeAgo, op: "ge" },
      ],
      orders: [{ column: "uptime", option: "desc" }],
    },
    1,
    5
  );

  for (var i = 0; i < items.data.length; i++) {
    var item = items.data[i] || {};
    var warehouse = item.warehouse || {};
    var plan = item.plan || {};
    var sn = Process("scripts.rfid.Explode", item.sn) || {};
    data.items.push({
      sn: sn.item_sn,
      name: item.sku_name,
      type: item.type,
      warehouse: warehouse.name,
      plan: plan.name,
    });
  }

  return data;
}

/**
 * 记录日志 (文件)
 * @param {*} data
 */
function Log(message, data) {
  var now = toSqlDatetime(new Date());
  console.log(`[${now}] ${message}`);
  if (data) {
    console.log(data);
  }
}

function toSqlDatetime(inputDate) {
  const date = new Date(inputDate);
  const dateWithOffest = new Date(
    date.getTime() - date.getTimezoneOffset() * 60000
  );
  return dateWithOffest.toISOString().slice(0, 19).replace("T", " ");
}
