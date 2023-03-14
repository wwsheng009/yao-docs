/**
 * 接收边缘节点消息
 * RESTFul API Edge -> Cloud
 * REST: node  @/apis/node.http.json
 */
function HttpMessage(event, payload) {
  log.Info("[NODE] HttpMessage %s %v", event, JSON.stringify(payload));
  switch (event) {
    case "facein": // 人员进入
      Process("scripts.event.OnFace", "进入", payload);
      break;
    case "faceout": // 人员离开
      Process("scripts.event.OnFace", "离开", payload);
      break;
    case "gatein": // 物资入库
      Process("scripts.event.OnGate", "进入", payload);
      break;
    case "gateout": // 物资出库
      Process("scripts.event.OnGate", "离开", payload);
      break;
    case "devices": // 在线设备
      Process("scripts.event.OnDevices", payload);
      break;
    default:
      console.log(`HttpMessage: ${event}`, payload);
  }
}

/**
 * 接收边缘节点消息
 * 边缘节点消息通道 Edge <-> Cloud
 * WebSocekt Server: node  @/apis/node.ws.json
 */
function Message(message, id) {
  var data = JSON.parse(message) || {};
  const cmd = data.cmd || "";
  const uptime = data.uptime || 0;
  switch (cmd) {
    case "SyncTime":
      SyncTime(id, uptime);
      break;
  }
}

/**
 * 通报服务时间(用于服务端校准)
 */
function SyncTime(id, uptime) {
  var data = getTime();
  data["delay"] = data.timestamp - uptime;
  send(id, Command("SyncTime", data, id));
}

/**
 * 向所有边缘节点发送广播消息
 * @param {*} name
 * @param {*} payload
 */
function Broadcast(name, payload) {
  Process("websocket.Broadcast", "node", Command(name, payload));
}

/**
 * 请求指令
 * @param {*} name
 * @param {*} data
 * @param {*} id
 */
function Command(name, payload, id) {
  payload = payload || {};
  return JSON.stringify({
    cmd: name,
    payload: payload,
    client: id,
    uptime: Date.now(),
  });
}

/**
 * 向边缘节点客户端发送消息
 * @param {*} id
 * @param {*} data
 */
function send(id, message) {
  Process("websocket.Direct", "node", id, message);
}

// dateTime to locale
function getTime(datetimeTz) {
  var date = datetimeTz ? new Date(datetimeTz) : new Date();
  if (date == "Invalid Date") {
    date = new Date(parseInt(datetimeTz));
  }

  const ms = date.getMilliseconds().toString().padStart(3, "0");
  const tzOffset = -date.getTimezoneOffset();
  const diff = tzOffset >= 0 ? "+" : "-";
  const pad = (n) => `${Math.floor(Math.abs(n))}`.padStart(2, "0");
  const locale =
    date.getFullYear() +
    "-" +
    pad(date.getMonth() + 1) +
    "-" +
    pad(date.getDate()) +
    " " +
    pad(date.getHours()) +
    ":" +
    pad(date.getMinutes()) +
    ":" +
    pad(date.getSeconds()) +
    "." +
    ms +
    " " +
    diff +
    pad(tzOffset / 60) +
    ":" +
    pad(tzOffset % 60);

  timezone = `${diff}${locale.split(diff)[1]}`;

  return {
    locale: locale.replace("T", " "),
    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
    timestamp: date.getTime(),
  };
}

// Get timestamp
function timestamp() {
  return new Date().getTime();
}

// 测试
// function test(cmd) {
//   cmd = cmd || "";
//   switch (cmd) {
//     case "UpdateUser":
//       Broadcast("UpdateUser", { id: 1 });
//       return;
//     case "DeleteUser":
//       Broadcast("DeleteUser", { id: 1, user_sn: "90001" });
//       return;
//     case "CleanUsers":
//       Broadcast("CleanUsers", { foo: 4096 });
//       return;
//     case "SyncDevices": // 同步设备信息指令
//       Broadcast("SyncDevices", {});
//       return;
//   }
//   console.log(cmd);
// }
