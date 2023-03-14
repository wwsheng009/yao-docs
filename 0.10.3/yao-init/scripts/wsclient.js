/**
 * yao js web socket client
 * 发送通知
 * @param {*} data
 */
function Notify(data) {
  var socket = new WebSocket(
    "ws://localhost:5099/websocket/message",
    "yao-message-01"
  );
  socket.push(JSON.stringify(data));
}
