/**
 * 更新 Items
 */
function AfterSave(id) {
  var payload = Process("models.plan.Find", id, {});

  // console.log(id, payload);
  // console.log("payload:", payload);
  var items = payload.items || {};
  var deletes = items.delete || [];
  //当有删除项目时,数据保存在items.data里
  //如果没有删除项目,项目items
  var data = items.data || items || [];

  if (data.length > 0 || deletes.length > 0) {
    // 忽略实际数据 ( 通过 record 计算获取)
    for (var i in data) {
      delete data[i].amount;
      if (typeof data[i].id === "string" && data[i].id.startsWith("_")) {
        //it's a number
        //新增项目，在前端会生成唯一字符串,
        //由于后台使用的自增长ID，不需要生成的唯一字符串，由数据库生成索引
        delete data[i].id;
        // console.log("data[i]:", data[i]);
      }
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

/**
 * 关联表删除
 * before Delete Plan
 * @param {number} id Plan id
 */
function BeforeDeletePlan(id) {
  // console.log("delete Plan with id:", id);
  let rows = Process("models.plan.item.DeleteWhere", {
    wheres: [{ column: "plan_id", value: id }],
  });

  // console.log(`${rows} rows deleted`);
  //remembe to return the id in array format
  return [id];
}

/**
 * 关联表批量删除
 * before Delete Plan Batch
 * @param {array} param0 Plan object
 */
function BeforeDeletePlanIn({ wheres }) {
  let array = wheres[0].value || [];
  array.forEach((element) => {
    BeforeDeletePlan(element);
  });

  return array;
}
