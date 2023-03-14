var times = 0;

/**
 * 监听事件
 * @param {*} onEnter 人员进入
 * @param {*} onLeave 人员离开
 * @param {*} onIn 物料入库
 * @param {*} onOut 物料出库
 */
function Start(host, onEnter, onLeave, onIn, onOut) {
  const protcol = window.location.protocol == "https:" ? "wss" : "ws";
  host = host || `${window.location.hostname}:${window.location.port}`;
  onEnter = onEnter ? onEnter : () => {};
  onLeave = onLeave ? onLeave : () => {};
  onIn = onIn ? onIn : () => {};
  onOut = onOut ? onOut : () => {};

  let socket = new WebSocket(
    `${protcol}://${host}/websocket/event`,
    "yao-event-01"
  );

  socket.onopen = function (e) {
    times = 0;
    console.log("socket open");
  };

  socket.onmessage = function (event) {
    var data = {};
    try {
      data = JSON.parse(event.data);
    } catch (e) {
      console.log("parse error:", e, event.data);
      return;
    }

    // console.log("cmd:", type, data.cmd);
    switch (data.cmd) {
      case "进入":
        onEnter(data);
        break;
      case "离开":
        onLeave(data);
        break;
    }
  };

  socket.onclose = function (event) {
    if (event.wasClean) {
      console.log(
        `[close] Connection closed cleanly, code=${event.code} reason=${event.reason}`
      );
    } else {
      // e.g. server process killed or network down
      // event.code is usually 1006 in this case
      console.log("[close] Connection died");
    }
    times = times + 1;
    waitting = times * 60 * 1000; // 等待N分钟后重连

    // 超过5次快速返回
    if (times > 5) {
      times = 0;
    }

    try {
      socket.close();
    } catch (e) {}

    // 5s重连
    window.setTimeout(() => {
      socket = null;
      Start(host, onEnter, onLeave, onIn, onOut);
    }, waitting);
  };

  socket.onerror = function (error) {
    console.log(`[error] ${error.message}`);
    socket.close();
  };
}

// RENEW
// 进入
// {"cmd":"进入","payload":{"device":"FACE.Q8.IN","request_id":"d1fecf10fcf0a088abeb961c77a63c1f","node_id":"1","timestamp":"1658330021755","uptime":1658358820000,"user_sn":"90002","user":{"status":"启用","id":2,"user_sn":"90002","name":"王伟平","photo":["20220705/0EF5DDBDDC339862AEE24431C1D8CA64.jpg"]},"record_id":1548},"client":null,"uptime":1658330021540}

// 入库
// {"cmd":"入库","payload":{"device":"WYUAN-G10-02","data":[{"rfid":"2050093CA787A39C38A56102","uptime":1658330682286},{"uptime":1658330682028,"rfid":"205000FA75D5457497D26102"}],"uptime":1658330683016,"request_id":"f1474e5c0e8f7c20d70487624b3f43b4","node_id":"1","timestamp":"1658330709025","user_sn":"90002","user":{"id":2,"user_sn":"90002","name":"王伟平","photo":["20220705/0EF5DDBDDC339862AEE24431C1D8CA64.jpg"],"status":"启用"},"records":[{"warehouse_id":"1","user_id":2,"ticket_id":125,"type":"入库","sn":"10000278000027000000100000002","batch":"f1474e5c0e8f","plan_id":null,"sku_id":27,"uptime":"2022-07-20T23:24:42","status":"生效","plan":{"id":null},"sku":{"id":27,"material_id":78,"category":{"name":"电器电料","id":2},"sku_sn":"78000027","material":{"name":"控制变压器","icon":null,"id":78,"images":null,"category_id":2}}},{"warehouse_id":"1","user_id":2,"ticket_id":125,"type":"入库","sn":"10000239000029000000100000002","batch":"f1474e5c0e8f","plan_id":null,"sku_id":29,"uptime":"2022-07-20T23:24:42","status":"生效","plan":{"id":null},"sku":{"sku_sn":"39000029","category":{"id":2,"name":"电器电料"},"id":29,"material_id":39,"material":{"icon":null,"name":"铜铝接线端子","category_id":2,"id":39,"images":null}}}]},"client":null,"uptime":1658330708960}

// 出库
// [{"plan_id":null,"sku_id":3,"user_id":1,"uptime":"2022-04-11 13:17:37","status":"在产","type":"出库","warehouse_id":"1","ticket_id":14,"sn":"10000120000003000000400000001","batch":"A7F0AD99E3B5B7A20BAB7DF13E336380","user":{"type":"供应商","photo":["20220410/69EB7370527A6F95573FD8DD1120FFF5.jpeg"],"supplier":{"id":1,"short":"坚朗","name":"广东坚朗五金制品股份有限公司"},"name":"SP000001","id":1,"supplier_id":1,"status":"启用"},"plan":{},"unit":"件","material":{"supplier_id":1,"category_id":1,"id":1,"name":"梯子"},"supplier":{"id":1,"name":"广东坚朗五金制品股份有限公司","short":"坚朗"},"category":{"name":"五金","id":1,"parent_id":null}},{"ticket_id":14,"warehouse_id":"1","user_id":1,"sku_id":1,"uptime":"2022-04-11 13:17:37","type":"出库","plan_id":null,"status":"在产","sn":"10000120000001000000400000001","batch":"A7F0AD99E3B5B7A20BAB7DF13E336380","user":{"type":"供应商","photo":["20220410/69EB7370527A6F95573FD8DD1120FFF5.jpeg"],"supplier":{"id":1,"short":"坚朗","name":"广东坚朗五金制品股份有限公司"},"name":"SP000001","id":1,"supplier_id":1,"status":"启用"},"plan":{},"unit":"件","material":{"category_id":1,"supplier_id":1,"name":"梯子","id":1},"supplier":{"name":"广东坚朗五金制品股份有限公司","short":"坚朗","id":1},"category":{"parent_id":null,"id":1,"name":"五金"}}]

// 进入
// {"status":"生效","warehouse_id":"1","user_id":1,"uptime":"2022-04-11 13:38:19","type":"进入","user":{"supplier_id":1,"status":"启用","id":1,"type":"供应商","name":"SP000001","photo":"20220410/69EB7370527A6F95573FD8DD1120FFF5.jpeg","supplier":{"short":"坚朗","name":"广东坚朗五金制品股份有限公司","id":1}}}

// 离开
// {"warehouse_id":"1","user_id":1,"uptime":"2022-04-11 13:38:40","type":"离开","status":"生效","user":{"supplier_id":1,"photo":"20220410/69EB7370527A6F95573FD8DD1120FFF5.jpeg","name":"SP000001","id":1,"supplier":{"name":"广东坚朗五金制品股份有限公司","short":"坚朗","id":1},"status":"启用","type":"供应商"}}


