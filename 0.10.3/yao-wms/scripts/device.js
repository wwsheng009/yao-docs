/**
 * 查询设备状态
 */
function Status() {
  // 请求上报状态
  Process("scripts.node.Broadcast", "SyncDevices", {});
  Process("xiang.sys.Sleep", 200);
  const store = new Store("cache");
  const data = store.Get("devices") || {};
  const devices = data.devices || [];
  var mapping = {
    数据通道: {
      id: 1,
      name: "数据通道",
      host: `离线`,
      status: "grey",
      picture: "/device/images/edge.svg",
    },
    入口门禁: {
      id: 3,
      name: "入口门禁",
      host: `离线`,
      status: "grey",
      picture: "/device/images/face.svg",
    },
    出口门禁: {
      id: 4,
      name: "出口门禁",
      host: `离线`,
      status: "grey",
      picture: "/device/images/face.svg",
    },
    RFID通道门: {
      id: 2,
      name: "RFID通道门",
      host: `离线`,
      status: "grey",
      picture: "/device/images/gate.svg",
    },
  };

  devices.forEach((device) => {
    switch (device.type) {
      case "Cloud":
        mapping["数据通道"] = {
          id: 1,
          name: "数据通道",
          host:
            device.status == "CONNECTED"
              ? `${device.ip}:${device.port}`
              : "离线",
          status: device.status == "CONNECTED" ? "green" : "grey",
          picture: "/device/images/edge.svg",
        };
        break;
      case "FaceIn":
        mapping["入口门禁"] = {
          id: 3,
          name: "入口门禁",
          host: device.status == "CONNECTED" ? `${device.ip}` : "离线",
          status: device.status == "CONNECTED" ? "green" : "grey",
          picture: "/device/images/face.svg",
        };
        break;
      case "FaceOut":
        mapping["出口门禁"] = {
          id: 4,
          name: "出口门禁",
          host: device.status == "CONNECTED" ? `${device.ip}` : "离线",
          status: device.status == "CONNECTED" ? "green" : "grey",
          picture: "/device/images/face.svg",
        };
        break;
      case "Gate":
        mapping["RFID通道门"] = {
          id: 2,
          name: "RFID通道门",
          host:
            device.status == "CONNECTED"
              ? `${device.ip}:${device.port}`
              : "离线",
          status: device.status == "CONNECTED" ? "green" : "grey",
          picture: "/device/images/gate.svg",
        };
        break;
    }
  });

  return Object.values(mapping).sort((a, b) => a.id - b.id);

  return [
    {
      id: 1,
      picture: "/device/images/server.svg",
      status: "green",
      name: "主服务器",
      host: "192.168.31.33:5099",
    },
    {
      id: 2,
      picture: "/device/images/edge.svg",
      status: "grey",
      name: "节点服务器",
      host: "离线",
    },
    {
      id: 3,
      picture: "/device/images/gate.svg",
      status: "green",
      name: "通道门",
      host: "192.168.31.192:6000",
    },
    {
      id: 4,
      picture: "/device/images/face.svg",
      status: "green",
      name: "人脸识别(入口)",
      host: "192.168.31.93",
    },
    {
      id: 5,
      picture: "/device/images/face.svg",
      status: "green",
      name: "人脸识别(离开)",
      host: "192.168.31.93",
    },
    {
      id: 6,
      picture: "/device/images/webcam.svg",
      status: "grey",
      name: "1号摄像头",
      host: "离线",
    },
    {
      id: 7,
      picture: "/device/images/webcam.svg",
      status: "grey",
      name: "2号摄像头",
      host: "离线",
    },
    {
      id: 8,
      picture: "/device/images/webcam.svg",
      status: "grey",
      name: "3号摄像头",
      host: "离线",
    },
  ];
}
