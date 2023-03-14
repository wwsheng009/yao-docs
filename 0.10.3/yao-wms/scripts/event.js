/**
 * 事件广播服务器 WebSocket
 * Websocket Server event @/apis/event.ws.json
 * @param {*} data
 */
function Message(message) {
  console.log(`event.Message`, message); // 接收客户端消息
}

/**
 * 人员进出事件
 * direction: 进入 or 离开
 * data: {"device":"FACE.Q8.IN","node_id":"1","request_id":"a55940b03d142e51bd78837e35464aa2","timestamp":"1658237974032","uptime":1658237972000,"user_sn":"90002"}
 * debug:
 *  yao run scripts.event.OnFace '进入' '::{"device":"FACE.Q8.IN","node_id":"1","request_id":"a55940b03d142e51bd78837e35464aa2","timestamp":"1658237974032","uptime":1658237972000,"user_sn":"90002"}'
 *
 * @param {*} data
 */
function OnFace(direction, data) {
  data = data || {};
  const node_id = data.node_id;
  const user_sn = data.user_sn;
  const timestamp = data.timestamp;

  if (
    !user_sn ||
    !timestamp ||
    !node_id ||
    (direction != "进入" && direction != "离开")
  ) {
    return;
  }

  user = Process("scripts.user.GetBySN", user_sn);
  if (user && user.code) {
    log.Error(
      `[Event] onFace ${direction} user_sn: ${user_sn} %v %v`,
      user.code,
      user.message
    );
    return;
  }

  const record_id = makeRecord({
    warehouse_id: node_id,
    user_id: user.id,
    uptime: locale(timestamp),
    type: direction, // 进入 or 离开
    status: "生效",
  });

  // 广播事件
  data["user"] = user;
  data["record_id"] = parseInt(record_id);
  Broadcast(direction, data); // 进入 or 离开
}

/**
 * 通道门进出事件
 * direction: 进入 or 离开
 * data: {"data":[{"rfid":"205000FA75D5457497D26103","uptime":1658274989039}],"device":"WYUAN-G10-02","node_id":"1","request_id":"2e7f2e6aa13a02cb4bd220581c3b47d9","timestamp":"1658275016378","uptime":1658274990242,"user_sn":"90002"}
 * debug:
 *  yao run scripts.event.OnGate '进入' '::{"data":[{"rfid":"205000FA75D5457497D26103","uptime":1658274989039}],"device":"WYUAN-G10-02","node_id":"1","request_id":"2e7f2e6aa13a02cb4bd220581c3b47d9","timestamp":"1658275016378","uptime":1658274990242,"user_sn":"90002"}'
 *
 * @param {*} direction
 * @param {*} data
 */
function OnGate(direction, data) {
  data = data || {};
  const request_id = data.request_id ? data.request_id.substr(0, 12) : "";
  const node_id = data.node_id;
  const user_sn = data.user_sn;
  const timestamp = data.timestamp;
  const type = direction == "进入" ? "入库" : "出库";
  const ids = data.data || [];

  if (
    !user_sn ||
    !timestamp ||
    !node_id ||
    ids.length == 0 ||
    (direction != "进入" && direction != "离开")
  ) {
    return;
  }

  user = Process("scripts.user.GetBySN", user_sn);
  if (user && user.code) {
    log.Error(
      `[Event] OnGate ${direction} user_sn: ${user_sn} %v %v`,
      user.code,
      user.message
    );
    return;
  }

  const uptime = locale(timestamp);
  const hmtime = uptime.split("T");
  const name = `${type} | ${user.name} | ${hmtime[0]} | ${hmtime[1]}`;
  const ticket_id = makeTicket({
    name: name,
    warehouse_id: node_id,
    user_id: user.id,
    type: type,
    uptime: uptime,
    records: {},
    status: "生效",
  });

  var records = [];

  ids.forEach((id) => {
    const rfid = id.rfid || "";
    const intRFID = BigInt("0x" + rfid).toString();
    const uptime = locale(id.uptime);
    var sn = Process("scripts.rfid.Explode", intRFID) || {};

    if (!sn.sku) {
      log.Error(
        `[Event] ${uptime} OnGate ${direction} user_sn: ${user_sn} 无效标签 ${rfid} ${intRFID} `
      );
      return;
    }

    var plan = {};
    var sku = getSku(sn.sku);
    if (sku == null) {
      return;
    }
    if (type == "入库") {
      // sn.plan = "000001";
      plan = getPlan(sn.plan);
    }

    var record = {
      warehouse_id: node_id,
      user_id: user.id,
      ticket_id: ticket_id,
      type: type, // 入库 or 出库
      sn: intRFID,
      batch: request_id, // 批次
      plan_id: plan.id,
      sku_id: sku.id,
      uptime: uptime,
      status: "生效",
    };

    try {
      makeRecord(record);
    } catch (err) {
      return;
    }

    record["plan"] = plan;
    record["sku"] = sku;
    records.push(record);
  });

  if (records.length == 0) {
    Process("models.ticket.Destroy", ticket_id);
    return;
  }

  // 广播事件
  data["user"] = user;
  data["records"] = records;
  Broadcast(type, data); // 出库 or 入库
  return true;
}

/**
 * 设备信息更新
 * @param {*} devices
 */
function OnDevices(devices) {
  const store = new Store("cache");
  store.Set("devices", devices);
  // console.log(`OnDevices:`, devices);
}

/**
 * 向所有事件服务 订阅者广播消息
 * @param {*} name
 * @param {*} payload
 */
function Broadcast(name, payload) {
  Process("websocket.Broadcast", "event", Command(name, payload));
}

/**
 * 请求指令
 * @param {*} name
 * @param {*} data
 * @param {*} id
 */
function Command(name, payload, client) {
  payload = payload || {};
  client = client || null;
  return JSON.stringify({
    cmd: name,
    payload: payload,
    client: client,
    uptime: Date.now(),
  });
}

/**
 * 创建进出记录
 * @param {*} record
 * @returns
 */
function makeRecord(record) {
  record = record || {};
  if (
    !record.user_id ||
    !record.uptime ||
    !record.warehouse_id ||
    (record.type != "进入" &&
      record.type != "离开" &&
      record.type != "入库" &&
      record.type != "出库")
  ) {
    log.Error(`[Event] makeRecord 参数错误 %v`, JSON.stringify(data));
    throw new Exception(`[Event] makeRecord 参数错误`, 400);
  }

  var resp = Process("xiang.table.Save", "record.total", record);
  if (resp.code) {
    log.Error(
      `[Event] makeRecord ${record.type} user: ${record.user_id} %v %v`,
      resp.code,
      resp.message
    );
    throw new Exception(resp.message, resp.code);
  }

  return resp;
}

/**
 * 创建进出凭据
 * @param {*} ticket
 */
function makeTicket(ticket) {
  ticket = ticket || {};
  if (
    !ticket.name ||
    !ticket.user_id ||
    !ticket.uptime ||
    !ticket.warehouse_id ||
    (ticket.type != "入库" && ticket.type != "出库")
  ) {
    log.Error(`[Event] makeTicket 参数错误 %v`, JSON.stringify(data));
    throw new Exception(`[Event] makeTicket 参数错误`, 400);
  }

  var resp = Process("xiang.table.Save", "ticket.total", ticket);
  if (resp.code) {
    log.Error(
      `[Event] makeTicket ${ticket.type} user: ${ticket.user_id} %v %v`,
      resp.code,
      resp.message
    );
    throw new Exception(resp.message, resp.code);
  }

  return resp;
}

/**
 * 读取入库计划
 * @param {*} plan_sn
 * @returns
 */
function getPlan(plan_sn) {
  var plans = Process("models.plan.Get", {
    select: ["id", "plan_sn", "name", "start", "end"],
    wheres: [{ column: "plan_sn", value: plan_sn }],
    limit: 1,
  });

  if (plans.code && plans.code != 200) {
    log.Error(
      `[Event] getPlanID 未找到计划信息数据 ${plan_sn}  %v %v`,
      plans.code,
      plans.message
    );
    return {};
  }

  if (plans.length == 0) {
    return { id: null };
  }

  var plan = plans[0] || {};
  return plan;
}

/**
 * 读取SKU
 * @param {*} sku_sn
 * @returns
 */
function getSku(sku_sn) {
  var skus = Process("models.material.sku.Get", {
    select: ["id", "sku_sn", "material_id"],
    withs: {
      material: {
        query: {
          select: ["id", "name", "category_id", "images", "icon"],
          withs: { category: { query: { select: ["id", "name"] } } },
        },
      },
    },
    wheres: [{ column: "sku_sn", value: sku_sn }],
    limit: 1,
  });

  if (skus.code && skus.code != 200) {
    log.Error(
      `[Event] getSku 未找到单品数据 ${sku_sn}  %v %v`,
      skus.code,
      skus.message
    );
    return skus;
  }

  if (skus.length == 0) {
    return null;
  }

  return skus[0];
}

// dateTime to locale
function locale(datetimeTz) {
  return Process("scripts.time.Locale", datetimeTz);
}

// ==========
/**
 * 进入通知
 * {"warehouse_id":"1","user_id":1,"uptime":"2022-04-11 12:43:01","type":"进入","status":"生效"}
 * yao run scripts.event.Enter '::{"warehouse_id":"1","user_id":1,"uptime":"2022-04-11 12:43:01","type":"进入","status":"生效"}'
 * @param {*} message
 */
function Enter(message) {
  message = message || {};
  if (!message.user_id) {
    return;
  }
  user = getUser(message.user_id);
  if (user.code) {
    return;
  }
  message["user"] = user;
  Notify(message);
}

/**
 * 离开通知
 * {"warehouse_id":"1","user_id":1,"uptime":"2022-04-11 13:16:04","type":"离开","status":"生效"}
 * yao run scripts.event.Leave '::{"warehouse_id":"1","user_id":1,"uptime":"2022-04-11 13:16:04","type":"离开","status":"生效"}'
 * @param {*} message
 */
function Leave(message) {
  message = message || {};
  if (!message.user_id) {
    return;
  }
  user = getUser(message.user_id);
  if (user.code) {
    return;
  }
  message["user"] = user;
  Notify(message);
}

/**
 * 入库通知
 * [{"type":"入库","plan_id":2,"sku_id":3,"warehouse_id":"1","user_id":1,"ticket_id":14,"sn":"10000120000003000000400000001","batch":"A7F0AD99E3B5B7A20BAB7DF13E336380","uptime":"2022-04-11 13:17:37","status":"生效"},{"ticket_id":14,"type":"入库","plan_id":2,"status":"生效","warehouse_id":"1","user_id":1,"sn":"10000120000001000000400000001","batch":"A7F0AD99E3B5B7A20BAB7DF13E336380","sku_id":1,"uptime":"2022-04-11 13:17:37"}]
 * yao run scripts.event.In '::[{"type":"入库","plan_id":2,"sku_id":3,"warehouse_id":"1","user_id":1,"ticket_id":14,"sn":"10000120000003000000400000001","batch":"A7F0AD99E3B5B7A20BAB7DF13E336380","uptime":"2022-04-11 13:17:37","status":"生效"},{"ticket_id":14,"type":"入库","plan_id":2,"status":"生效","warehouse_id":"1","user_id":1,"sn":"10000120000001000000400000001","batch":"A7F0AD99E3B5B7A20BAB7DF13E336380","sku_id":1,"uptime":"2022-04-11 13:17:37"}]'
 * @param {*} message
 */
function In(message) {
  message = message || [];
  message = getItems(message);
  Notify(message);
}

/**
 * 出库通知
 * [{"type":"出库","plan_id":null,"sku_id":3,"warehouse_id":"1","user_id":1,"ticket_id":14,"sn":"10000120000003000000400000001","batch":"A7F0AD99E3B5B7A20BAB7DF13E336380","uptime":"2022-04-11 13:17:37","status":"生效"},{"ticket_id":14,"type":"入库","plan_id":null,"status":"出库","warehouse_id":"1","user_id":1,"sn":"10000120000001000000400000001","batch":"A7F0AD99E3B5B7A20BAB7DF13E336380","sku_id":1,"uptime":"2022-04-11 13:17:37"}]
 * yao run scripts.event.Out '::[{"type":"出库","plan_id":null,"sku_id":3,"warehouse_id":"1","user_id":1,"ticket_id":14,"sn":"10000120000003000000400000001","batch":"A7F0AD99E3B5B7A20BAB7DF13E336380","uptime":"2022-04-11 13:17:37","status":"生效"},{"ticket_id":14,"type":"出库","plan_id":null,"status":"生效","warehouse_id":"1","user_id":1,"sn":"10000120000001000000400000001","batch":"A7F0AD99E3B5B7A20BAB7DF13E336380","sku_id":1,"uptime":"2022-04-11 13:17:37"}]'
 * @param {*} message
 */
function Out(message) {
  message = message || [];
  message = getItems(message);
  Notify(message);
}

/**
 * 发送通知
 * @param {*} data
 */
function Notify(data) {
  var ws = new WebSocket(
    "ws://192.168.1.99:5099/websocket/event",
    "yao-event-01"
  );
  ws.push(JSON.stringify(data));
}

function getUser(user_id) {
  var user = Process("models.user.Find", user_id, {
    select: ["id", "supplier_id", "status", "name", "type", "photo"],
    withs: { supplier: {} },
  });
  var photo = user.photo || [];
  if (photo.length < 1) {
    return { code: 400, message: "缺少头像" };
  }

  user.photo = photo[0];
  return user;
}

/**
 * 读取物料详情
 * yao run scripts.event.getItems '::[{"type":"入库","plan_id":2,"sku_id":3,"warehouse_id":"1","user_id":1,"ticket_id":14,"sn":"10000120000003000000400000001","batch":"A7F0AD99E3B5B7A20BAB7DF13E336380","uptime":"2022-04-11 13:17:37","status":"生效"},{"ticket_id":14,"type":"入库","plan_id":2,"status":"生效","warehouse_id":"1","user_id":1,"sn":"10000120000001000000400000001","batch":"A7F0AD99E3B5B7A20BAB7DF13E336380","sku_id":1,"uptime":"2022-04-11 13:17:37"}]'
 * @param {*} data
 */
function getItems(data) {
  data = data || [];
  var user_ids = [];
  var sku_ids = [];
  var plan_ids = [];
  for (var i in data) {
    if (!data[i].user_id || !data[i].sku_id) {
      return { code: 400, message: "缺少用户ID或SKU_id" };
    }
    user_ids.push(data[i].user_id);
    sku_ids.push(data[i].sku_id);

    if (data[i].plan_id) {
      plan_ids.push(data[i].plan_id);
    }
  }

  var users = Process("models.user.Get", {
    select: ["id", "supplier_id", "status", "name", "type", "photo"],
    withs: { supplier: {} },
    wheres: [{ column: "id", op: "in", value: user_ids }],
  });

  var plans = Process("models.plan.Get", {
    select: ["id", "name", "status", "start", "end"],
    wheres: [{ column: "id", op: "in", value: plan_ids }],
  });

  var skus = Process("models.material.sku.Get", {
    select: ["id", "unit", "status", "material_id"],
    withs: {
      material: {
        query: {
          select: ["id", "name", "category_id", "supplier_id"],
          withs: { category: {}, supplier: {} },
        },
      },
    },
    wheres: [{ column: "id", op: "in", value: sku_ids }],
  });

  // Mapping
  var user_map = {};
  var sku_map = {};
  var plan_map = {};
  for (var i in users) {
    user_map[users[i].id] = users[i];
  }
  for (var i in skus) {
    sku_map[skus[i].id] = skus[i];
  }
  for (var i in plans) {
    plan_map[plans[i].id] = plans[i];
  }

  // 合并数据
  for (var i in data) {
    data[i]["user"] = user_map[data[i].user_id] || {};
    data[i]["plan"] = plan_map[data[i].plan_id] || {};

    var sku = sku_map[data[i].sku_id] || {};
    data[i]["unit"] = sku.unit;
    data[i]["material"] = sku.material;
    data[i]["supplier"] = sku.supplier;
    data[i]["status"] = sku.status;
    data[i]["category"] = sku.category;
  }

  return data;
}
