const name_map = {
  stock: "库存数据",
  "ticket.total": "台账",
  "material.sku": "单品",
  rfid: "RFID标签",
};

function exports(name) {
  var zh_name = name_map[name];
  if (!zh_name) {
    zh_name = "导出" + name;
  }
  Process("models.exports.save", {
    name: zh_name,
    table_name: name,
    url: "",
    status: "未完成",
  });

  return {
    code: 200,
    message: "导出任务创建成功",
  };
}

function TaskHandle() {
  var data = Process("models.exports.get", {
    wheres: [{ column: "status", value: "未完成", op: "=" }],
    limit: 1,
  });
  if (data && data.length > 0) {
    var url = Process("flows.utils.export", data[0].table_name);
    if (url) {
      Process("models.exports.save", {
        id: data[0].id,
        url: url,
        status: "已完成",
      });
    }
  }
  return "success";
}

function download(id, name, num) {
  var data = Process("models.exports.find", id, {});

  //var res = Process("xiang.fs.ReadFile", data.url, false);

  return data.url;
}
