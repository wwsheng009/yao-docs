/**
 * 更新 Items
 */
function AfterSave(id, payload) {
  console.log(id, payload);
  var items = payload.items || {};
  var deletes = items.delete || [];
  var data = items.data || [];

  if (data.length > 0 || deletes.length > 0) {
    // 忽略实际数据 ( 通过 record 计算获取)
    for (var i in data) {
      delete data[i].amount;
    }

    // 保存物品清单
    var res = Process("models.plan.item.EachSaveAfterDelete", deletes, data, {
      plan_id: id,
    });
    if (res.code && res.code > 300) {
      console.log("Plan:AfterSave Error:", res);
      return id;
    }
  }

  // 生成计划标签
  var plan_sn = payload["plan_sn"];
  if (!plan_sn) {
    return Process("models.plan.Save", { id: id, plan_sn: MakeSN(id) });
  }

  return id;
}

/**
 * 生成计划标签 (1+id)
 * 标签: 类目(6)-SKU(8)-**计划(6)**-Item(9)
 *      100001 20000001 000000 400000001
 */
function MakeSN(id) {
  var sn = id.toString();
  return sn.padStart(6, "0");
}
