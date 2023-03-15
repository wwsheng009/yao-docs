var timming = null;
var live = 10000;

// 进入或离开
// {
//   "cmd":"进入",
//   "payload":{
//       "device":"FACE.Q8.IN",
//       "request_id":"d1fecf10fcf0a088abeb961c77a63c1f",
//       "node_id":"1",
//       "timestamp":"1658330021755",
//       "uptime":1658358820000,
//       "user_sn":"90002",
//       "user":{
//           "status":"启用",
//           "id":2,
//           "user_sn":"90002",
//           "name":"王伟平",
//           "photo":[
//               "20220705/0EF5DDBDDC339862AEE24431C1D8CA64.jpg"
//           ]
//       },
//       "record_id":1548
//   },
//   "client":null,
//   "uptime":1658330021540
// }
function SetUser(data) {
  // console.log("SetUser", data);
  data = data || {};
  const yao = new Yao();
  const token = yao.Token();
  const payload = data.payload || {};
  const user = payload.user || {};
  var action = data.cmd;
  var name = `${user.name} ( ${action} )`;
  $("#user_name").html(name);
  $("#user_photo").html(
    `<img src="/api/user/photo?file=${user.photo}&token=${token}">`
  );

  // 10秒钟后清空
  clearInterval(timming);
  timming = setInterval(() => {
    Clear();
  }, live);
}

/**
 * 入库或出库
 * @param {*} data
 */
//  {
//   "cmd":"入库",
//   "payload":{
//       "device":"WYUAN-G10-02",
//       "data":[
//           {
//               "rfid":"2050093CA787A39C38A56102",
//               "uptime":1658330682286
//           },
//           {
//               "uptime":1658330682028,
//               "rfid":"205000FA75D5457497D26102"
//           }
//       ],
//       "uptime":1658330683016,
//       "request_id":"f1474e5c0e8f7c20d70487624b3f43b4",
//       "node_id":"1",
//       "timestamp":"1658330709025",
//       "user_sn":"90002",
//       "user":{
//           "id":2,
//           "user_sn":"90002",
//           "name":"王伟平",
//           "photo":[
//               "20220705/0EF5DDBDDC339862AEE24431C1D8CA64.jpg"
//           ],
//           "status":"启用"
//       },
//       "records":[
//           {
//               "warehouse_id":"1",
//               "user_id":2,
//               "ticket_id":125,
//               "type":"入库",
//               "sn":"10000278000027000000100000002",
//               "batch":"f1474e5c0e8f",
//               "plan_id":null,
//               "sku_id":27,
//               "uptime":"2022-07-20T23:24:42",
//               "status":"生效",
//               "plan":{
//                   "id":null
//               },
//               "sku":{
//                   "id":27,
//                   "material_id":78,
//                   "category":{
//                       "name":"电器电料",
//                       "id":2
//                   },
//                   "sku_sn":"78000027",
//                   "material":{
//                       "name":"控制变压器",
//                       "icon":null,
//                       "id":78,
//                       "images":null,
//                       "category_id":2
//                   }
//               }
//           },
//           {
//               "warehouse_id":"1",
//               "user_id":2,
//               "ticket_id":125,
//               "type":"入库",
//               "sn":"10000239000029000000100000002",
//               "batch":"f1474e5c0e8f",
//               "plan_id":null,
//               "sku_id":29,
//               "uptime":"2022-07-20T23:24:42",
//               "status":"生效",
//               "plan":{
//                   "id":null
//               },
//               "sku":{
//                   "sku_sn":"39000029",
//                   "category":{
//                       "id":2,
//                       "name":"电器电料"
//                   },
//                   "id":29,
//                   "material_id":39,
//                   "material":{
//                       "icon":null,
//                       "name":"铜铝接线端子",
//                       "category_id":2,
//                       "id":39,
//                       "images":null
//                   }
//               }
//           }
//       ]
//   },
//   "client":null,
//   "uptime":1658330708960
// }
function SetData(data) {
  data = data || {};
  const payload = data.payload || {};
  const records = payload.records || [];

  var rows = [];
  for (var i = 0; i < 5; i++) {
    var item = records[i] || null;
    var style = i == 4 ? 'class="last-td"' : "";
    if (item == null) {
      rows.push(
        `<tr><td ${style}></td><td ${style}></td><td ${style}></td><td ${style}></td></tr>`
      );
      continue;
    }

    const sku = item.sku || {};
    const plan = item.plan || {};
    const material = sku.material || {};

    // 100002390000290000001 00000002
    var sn = item.sn
      ? `#${item.sn.substr(item.sn.length - 8, item.sn.length)}`
      : "-";
    var planName = plan.name ? plan.name : "-";
    var name = material.name ? material.name : "-";
    var action = item.type;
    rows.push(
      `<tr>
        <td ${style}>${action}</td>  
        <td ${style}>${sn}</td>
        <td ${style}> ${name}</td>  
        <td ${style}>${planName}</td>  
      </tr>`
    );
  }

  $("#items-list").html(rows.join("\n"));

  // 清理
  clearInterval(timming);
  timming = setInterval(() => {
    Clear();
  }, live);
}

/**
 * 清空数据
 */
function Clear() {
  clearInterval(timming);

  $("#user_name").html("--");
  $("#user_photo").html("");

  var rows = [];
  for (var i = 0; i < 5; i++) {
    var style = i == 4 ? 'class="last-td"' : "";
    rows.push(
      `<tr><td ${style}></td><td ${style}></td><td ${style}></td><td ${style}></td></tr>`
    );
  }

  $("#items-list").html(rows.join("\n"));

  try {
    UpdateWarehouse();
  } catch (err) {}
}

/**
 * 更新仓库信息
 */
async function UpdateWarehouse() {
  const yao = new Yao();
  const data = await yao.Get("/screen/warehouse");
  const records = data.库存 || [];

  try {
    $("#warehouse_name").html(data.仓库[0].name);
    $("#warehouse_skucnt").html(data.数量);
  } catch (err) {}

  var rows = [];
  for (var i = 0; i < 3; i++) {
    var item = records[i] || null;
    // var style = i == 3 ? 'class="last-td"' : "";
    var style = "";
    if (item == null) {
      rows.push(
        `<tr><td ${style}></td><td ${style}></td><td ${style}></td><td ${style}></td></tr>`
      );
      continue;
    }

    rows.push(
      `<tr>
        <td ${style}>#${item.id} ${item.sku_name} </td>  
        <td ${style}>${item.stock}</td>
        <td ${style}>${item.sku.stock}</td>  
      </tr>`
    );
  }
  rows.push("<tr><td></td><td></td><td></td></tr>");
  $("#alert-list").html(rows.join("\n"));
}

/**
 * 读取大屏配置
 */
async function Setting() {
  const yao = new Yao();
  return new Promise(async (resolve, reject) => {
    var setting = {};
    try {
      setting = await yao.Get("/screen/setting");
    } catch (err) {}

    if (setting.名称) {
      $("#screen_name").html(setting.名称);
    }

    try {
      if (setting.监控 && setting.监控 == "ON") {
        $(".alert-block").hide();
        $(".video-block").show();
        StartWebcam(); // 启动监控
      } else {
        $(".video-block").hide();
        $(".alert-block").show();
      }
    } catch (err) {
      console.log("err", err);
    }

    resolve(setting);
  });
}

/**
 * 启动视频监控
 */
async function StartWebcam() {
  const host = `${window.location.protocol}//${window.location.hostname}:8000`;
  var subfix = "";
  if (host.includes("139.199.30.36")) {
    subfix = "-debug";
  } else if (host.includes("192.168.1.99")) {
    subfix = "-inner";
  }

  console.log(`==== WebCam Host ====:${host} subfix: ${subfix}`);

  var camera1 = null;
  var camera2 = null;
  var camera3 = null;

  try {
    console.log("OPEN Webcam 01");
    camera1 = new WebRtcStreamer("camera1", host);
    camera1.connect(`cam01${subfix}`);
  } catch (err) {
    console.log("Webcam 01 errror:", err);
  }

  try {
    console.log("OPEN Webcam 02");
    camera2 = new WebRtcStreamer("camera2", host);
    camera2.connect(`cam02${subfix}`);
  } catch (err) {
    console.log("Webcam 02 errror:", err);
  }

  // camera3 = new WebRtcStreamer("camera3", host);
  // camera3.connect(`cam03${subfix}`);
}
