/**
 * 事件广播服务器 WebSocket
 * Websocket Server event @/apis/message.ws.json
 * @param {*} data
 */
function Message(message, client) {
  console.log(`client:${client},message:${message}`); // 接收客户端消息

  console.log(`clients:`, Process("websocket.Clients", "message"));
  console.log(`Online:`, Process("websocket.Online", "message"));

  if (message == "Hello") {
    console.log("reply");
    return "World";
  }
  if (message == "Happy") {
    Process("websocket.Broadcast", "message", "Happy New Year");
  }
}
