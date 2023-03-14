/**
 * 解析标签编码
 * @param {*} data
 * @returns
 */
function AfterSearch(response) {
  response = response || {};
  var data = response.data || [];
  for (var i in data) {
    data[i] = data[i] || {};
    data[i].detail = Explode(data[i].sn);
  }
  response["data"] = data;
  return response;
}

// "标签: 类目(6)-SKU(8)-计划(6)-Item(9)"
//      10000120000001000000400000001
function Explode(sn) {
  sn = sn || "";
  var res = { category: "", sku: "", plan: "", item: "", sn: sn };

  // 无效标签
  if (sn.length != 29) {
    return res;
  }

  res.category = sn.substring(0, 6);
  res.sku = sn.substring(6, 14);
  res.plan = sn.substring(14, 20);
  res.item = sn.substring(20, 29);
  return res;
}
function BeforeSave(payload) {
  var times = String(Date.now());
  if (!payload.s_code || payload.s_code == "") {
    payload.s_code = times.substring(3);
  }
  return [payload];
}
