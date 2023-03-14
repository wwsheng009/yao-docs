function Save(payload) {
  var node_id = Process("models.warehouse.get", {
    limit: 1,
  });
  var data = payload.data.data || [];
  if (!data.length) {
    return {
      code: 400,
      message: "扫码数据不能为空",
    };
  }
  if (!node_id.length) {
    return {
      code: 400,
      message: "系统未添加仓库",
    };
  }

  var success = 0;
  var fail = 0;
  var msg = "";
  for (var i in data) {
    var temp_status = data[i]["params"]["status"] == "进入" ? "入库" : "出库";
    var rfid_id = Process("models.rfid.get", {
      wheres: [{ column: "s_code", value: data[i]["params"]["code"] }],
    });
    if (rfid_id.length) {
      data[i]["params"]["code"] = rfid_id[0]["sn"];
    }

    // var exists = Process("models.record.get", {
    //   wheres: [
    //     { column: "sn", value: data[i]["params"]["code"] },
    //     { column: "type", value: temp_status },
    //   ],
    //   limit: 1,
    // });

    // if (exists.length) {
    //   console.log("存在");
    //   fail++;
    //   msg = "编号已经录入";
    //   continue;
    // }
    var par = {};
    par.request_id = randomString(15);
    par.node_id = node_id[0].id;
    var user = Process("models.user.find", data[i]["params"]["user_id"], {});
    if (user.code) {
      msg = "用户不存在，";
      fail++;
      continue;
    }
    par.user_sn = user.user_sn;
    par.timestamp = parseInt(Date.now() / 1000);
    var ids = [];
    var rfid = BigInt(data[i]["params"]["code"]).toString(16);
    ids.push({
      rfid: rfid,
      uptime: par.timestamp * 1000,
    });
    par.data = ids;
    var response = Process(
      "scripts.event.OnGate",
      data[i]["params"]["status"],
      par
    );
    if (response) {
      success++;
    } else {
      msg = "保存进出记录失败，";
      fail++;
    }
  }

  if (success > 0) {
    return {
      code: 200,
      message: "成功录入" + success + "条数据！",
    };
  } else {
    return {
      code: 400,
      message: msg + "失败" + fail + "条数据！",
    };
  }
}

function randomString(len) {
  var $chars =
    "ABCDEFGHJKMNPQRSTWXYZabcdefhijkmnprstwxyz2345678"; /****默认去掉了容易混淆的字符oOLl,9gq,Vv,Uu,I1****/
  var maxPos = $chars.length;
  var pwd = "";
  for (i = 0; i < len; i++) {
    pwd += $chars.charAt(Math.floor(Math.random() * maxPos));
  }
  return pwd.toUpperCase();
}
