/**
 * 保存数据后: 更新库存等
 * @param {*} id
 * @param {*} payload
 */
function AfterSave(id, payload) {
  var status = payload.status || "";
  var type = payload.type || "";

  // 忽略处理录入信息
  if (status == "录入") {
    return id;
  }

  switch (type) {
    case "入库":
      return Put(id, payload);
    case "出库":
      return Out(id, payload);
  }
  return id;
}

/**
 * 构建唯一字段
 * @param {}} payload
 */
function BeforeSave(payload) {
  payload = payload || {};
  var now = payload.uptime ? new Date(payload.uptime) : new Date();
  var time = (now.getTime() / 1000 / 60).toFixed(0);
  payload["unique_id"] = `${time} || ${payload.warehouse_id || ""}|${
    payload.type || ""
  }|${payload.plan_id || ""}|${payload.sku_id || ""}|${payload.sn || ""}|${
    payload.user_id || ""
  }`;
  return [payload];
}

// 物资入库
// yao run scripts.record.Put 2 '::{"id":"2","plan_id":1,"remark":null,"sku_id":1,"sn":"100000012021123642243533","status":"生效","type":"入库","uptime":"2021-12-15T10:38:25+08:00","user_id":1,"warehouse_id":1}'
// yao run scripts.record.Put 2 '::{"id":"2","plan_id":1,"remark":null,"sku_id":1,"sn":"100000023642243533","status":"生效","type":"入库","uptime":"2021-12-15T10:38:25+08:00","user_id":1,"warehouse_id":1}'
function Put(id, payload) {
  var sn = payload.sn || "";
  if (payload.sn == "") {
    throw new Error("未找到标签编码数据");
  }

  if (sn.length != 29) {
    throw new Error(`标签数据不合法: ${sn}`);
  }

  UpdateRFID(payload.sn, "入库", payload.warehouse_id);
  UpdateStock(payload.warehouse_id, payload.sku_id);
  UpdatePlanAmount(payload.plan_id, payload.sku_id);
  return id;
}

// 物资出库
function Out(id, payload) {
  var sn = payload.sn || "";
  if (payload.sn == "") {
    throw new Error("未找到标签编码数据");
  }

  if (sn.length != 29) {
    throw new Error(`标签数据不合法: ${sn}`);
  }

  UpdateRFID(payload.sn, "空闲", payload.warehouse_id);
  ArchiveItem(payload.sn, payload.status);
  UpdateStock(payload.warehouse_id, payload.sku_id);
  return id;
}

// 当物品出库，归档对应入库信息
function ArchiveItem(sn, status) {
  if (status != "生效" && status != "归档") {
    return;
  }

  if (sn == undefined) {
    throw new Error("缺少物资数据编码");
  }

  var effect = Process(
    "models.record.UpdateWhere",
    {
      wheres: [{ column: "sn", value: sn }],
    },
    { status: "归档" }
  );

  if (effect == 0) {
    throw new Error(`归档入库资料失败 sn=${sn}`);
  }
}

// 更新计划单品
function UpdatePlanAmount(plan_id, sku_id) {
  if (sku_id == undefined) {
    throw new Error("缺少单品数据ID");
  }

  if (plan_id == undefined) {
    return;
    // throw new Error("缺少计划数据ID");
  }

  // 查询库存
  var stock = Process("flows.plan.stock", plan_id, sku_id);
  stock = parseInt(stock);

  // 更新已入库数量
  var effect = Process(
    "models.plan.item.UpdateWhere",
    {
      wheres: [
        { column: "sku_id", value: sku_id },
        { column: "plan_id", value: plan_id },
      ],
    },
    { amount: stock, uptime: now() }
  );

  if (effect == 0) {
    throw new Error(
      `更新计划已完成数量失败 plan_id=${plan_id} sku_id=${sku_id} amount=${stock}`
    );
  }
}

// 更新库存
function UpdateStock(warehouse_id, sku_id) {
  if (sku_id == undefined) {
    throw new Error("缺少单品数据ID");
  }

  if (warehouse_id == undefined) {
    throw new Error("缺少所在仓库数据ID");
  }

  // 查询库存
  var stock = Process("flows.stock.count", sku_id); // 新版引擎数值为零处理
  stock = parseInt(stock);

  // 更新单品库存
  var effect = Process(
    "models.stock.UpdateWhere",
    {
      wheres: [
        { column: "sku_id", value: sku_id },
        { column: "warehouse_id", value: warehouse_id },
      ],
    },
    { stock: stock, uptime: now() }
  );

  // 无效更新，插入单品库存
  if (effect == 0) {
    stock_id = Process("models.stock.Create", {
      warehouse_id: warehouse_id,
      sku_id: sku_id,
      stock: stock,
      uptime: now(),
    });
    if (stock_id < 1) {
      throw new Error(
        `更新库存失败 warehouse_id=${warehouse_id} sku_id=${sku_id} stock=${stock}`
      );
    }
  }
}

/**
 * 更新标签状态
 * @param {*} sn     RFID 标签
 * @param {*} status 入库 | 空闲
 */
function UpdateRFID(sn, status, node_id) {
  node_id = node_id || null;
  // console.log(`DEBUG UpdateRFID: ${node_id}, ${sn}, ${status}`);
  var effect = Process(
    "models.rfid.UpdateWhere",
    {
      wheres: [{ column: "sn", value: sn }],
    },
    { status: status, node_id: node_id }
  );

  if (effect == 0) {
    throw new Error(`更新标签状态失败 sn=${sn}`);
  }
}

/**
 * 更新库存
 * @returns
 */
function now() {
  const date = new Date();
  const dateWithOffest = new Date(
    date.getTime() - date.getTimezoneOffset() * 60000
  );
  return dateWithOffest.toISOString().slice(0, 19).replace("T", " ");
}
