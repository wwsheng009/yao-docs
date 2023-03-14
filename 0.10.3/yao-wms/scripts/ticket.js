/**
 * 搜索 Hook, 处理日期条件
 */
function BeforeSearch(query, page, pagesize) {
  query = query || {};
  wheres = query.wheres || [];
  for (var i in wheres) {
    var where = wheres[i] || {};
    if (where.column == "uptime" && where.value) {
      var value = new Date(where.value).toISOString().split("T")[0];
      query.wheres[i]["value"] = value;
    }
  }
  return [query, page, pagesize];
}

/**
 * 查询 Hooks, 关联凭证相关记录
 * @param {*} ticket
 */
function AfterFind(ticket, ticket_id) {
  ticket["records"] = Records(ticket_id);
  if (!ticket.ticket_sn) {
    ticket.ticket_sn = genTicketSN();
  }

  return ticket;
}

/**
 * 查询 Hooks, 关联凭证相关记录
 * @param {*} ticket
 */
function AfterFindView(ticket, ticket_id) {
  ticket["records"] = RecordsMerge(ticket_id);
  if (ticket.type == "入库") {
    ticket.title = "发料单";
  } else if (ticket.type == "出库") {
    ticket.title = "点收单";
    ticket.outdoor = true;
  }

  ticket.total = 0.0;
  ticket.fin_total = 0.0;
  ticket.tax_total = 0.0;
  ticket.tax = 0.0;
  for (var i in ticket["records"]) {
    var record = ticket["records"][i];
    ticket.total = ticket.total + parseFloat(record.sku.total);
    ticket.tax_total = ticket.tax_total + parseFloat(record.sku.tax_total);
    ticket.fin_total = ticket.fin_total + parseFloat(record.sku.fin_total);
    ticket.tax = ticket.tax + parseFloat(record.sku.tax);
  }

  ticket.total = ticket.total.toFixed(2);
  ticket.fin_total = ticket.fin_total.toFixed(2);
  ticket.tax_total = ticket.tax_total.toFixed(2);
  ticket.tax = ticket.tax.toFixed(2);
  ticket.uptime = new Date(ticket.uptime).toISOString().split("T")[0];
  return ticket;
}

/**
 * 保存前逻辑: 如果没有单号添加一个单号
 * @param {*} payload
 * @returns
 */
function BeforeSave(payload) {
  if (!payload.ticket_sn) {
    payload.ticket_sn = genTicketSN();
  }
  return [payload];
}

/**
 * 修改 Hook, 处理凭证相关记录请求
 * yao run scripts.ticket.AfterSave 32 '::{"name":"入库 | SP000001 | 2022-04-11 | 15:31:46","warehouse_id":1,"type":"入库","plan_id":null,"uptime":"2022-04-11T15:31:46+08:00","status":"生效","user_id":1,"records":{"data":[{"name":[11]},{"id":122,"name":"[入库 王伟平 2022-04-11] 梯子(高度:250) 坚朗 2022年1月物资采购 #10000120000001000000400000002"},{"id":124,"name":"[入库 王伟平 2022-04-11] 梯子(高度:250) 坚朗 2022年1月物资采购 #10000120000001000000400000001"}],"delete":[123],"query":{"sort":"$index"}},"remark":null,"id":"32"}'
 * @param {*} ticket_id
 * @param {*} payload
 */
function AfterSave(ticket_id, payload) {
  // console.log("AfterSave:", ticket_id, payload);
  var records = payload.records || {};

  // 数据未发生变更，忽略处理
  if (!records.data) {
    return ticket_id;
  }

  var record_ids = ExtraRecordIds(records);
  var effect = { delete: 0, update: 0 };
  // 删除记录
  if (record_ids.delete.length > 0) {
    effect.delete = Process(
      "models.record.UpdateWhere",
      { wheres: [{ column: "id", op: "in", value: record_ids.delete }] },
      { ticket_id: null }
    );
  }

  // 更新记录
  if (record_ids.update.length > 0) {
    effect.update = Process(
      "models.record.UpdateWhere",
      { wheres: [{ column: "id", op: "in", value: record_ids.update }] },
      { ticket_id: ticket_id }
    );
  }

  // debug
  console.log(effect);
  return ticket_id;
}

/**
 * 处理提交参数, 解析记录ID
 * yao run scripts.ticket.ExtraRecordIds '::{"data":[{"name":[11]},{"id":122,"name":"[入库 王伟平 2022-04-11] 梯子(高度:250) 坚朗 2022年1月物资采购 #10000120000001000000400000002"},{"id":124,"name":"[入库 王伟平 2022-04-11] 梯子(高度:250) 坚朗 2022年1月物资采购 #10000120000001000000400000001"}],"delete":[123],"query":{"sort":"$index"}}'
 * @param {*} data
 */
function ExtraRecordIds(records) {
  records = records || { data: [], delete: [] };
  records.data = records.data || [];
  var res = { update: [], delete: records.delete };
  for (var i in records.data) {
    var record = records.data[i] || {};
    if (record.id) {
      res.update.push(record.id);
      continue;
    }
    if (record.name && Array.isArray(record.name) && record.name > 0) {
      res.update.push(record.name[0]);
    }
  }
  return res;
}

/**
 * 读取凭据已关联的记录
 * @param {*} id
 */
function Records(ticket_id) {
  if (!ticket_id) {
    return [];
  }
  var option = [];
  var records = getRecords([{ column: "ticket_id", value: ticket_id }]);
  for (var i in records) {
    option.push({ id: records[i].id, name: computeRecordName(records[i]) });
  }
  return option;
}

/**
 * 读取凭据已关联的记录(用于呈现)
 * @param {*} ticket_id
 */
function RecordsMerge(ticket_id) {
  if (!ticket_id) {
    return [];
  }
  var records = getRecords([{ column: "ticket_id", value: ticket_id }]);
  var merged = {};
  var result = [];

  for (var i in records) {
    var record = records[i];
    var sku_id = record.sku_id;
    if (!sku_id) {
      continue;
    }

    if (merged[sku_id]) {
      merged[sku_id].amount++;
      continue;
    }

    var specs = record.sku.specs || {};
    var specsArr = [];
    for (var name in specs) {
      specsArr.push(`${name}:${specs[name]}`);
    }
    var specsStr = specsArr.join(" ");
    record.amount = 1;
    record.name = `${record.material.name} (${specsStr})`;
    record.specs = `${specsStr}`;
    merged[sku_id] = record;
  }

  var i = 1;
  for (var sku_id in merged) {
    merged[sku_id]["index"] = i;
    computePrice(merged[sku_id]);
    result.push(merged[sku_id]);
    i++;
  }

  return result;
}

/**
 * 计算各种金额
 * 含税金额	= 含税单价 * 数量
 * 无税金额	= 无税单价 * 数量
 * 列账金额	= 列账金额 * 数量
 * 税额	 = 无税金额 - 含税金额
 * @param {*} record
 */
function computePrice(record) {
  record = record || {};
  sku = record.sku || {};
  amount = record.amount || 0;
  sku.fin_total = (parseFloat(sku.fin_price) * amount).toFixed(2);
  sku.tax_total = (parseFloat(sku.tax_price) * amount).toFixed(2);
  sku.total = (parseFloat(sku.price) * amount).toFixed(2);
  sku.tax = (parseFloat(sku.tax_total) - parseFloat(sku.total)).toFixed(2);
  record.sku = sku;
}

/**
 * 读取凭据关联记录清单全量 (FOR 选择器)
 *
 * @param {*} ticket_id
 */
function Select(ticket_id) {
  var records = RecordsWithExtra(ticket_id);
  var option = [];
  for (var i in records) {
    option.push({
      value: records[i].id,
      label: computeRecordName(records[i]),
      children: [],
    });
  }
  return option;
}

/**
 * 凭据绑定的 Records 和可选记录
 * @param {*} ticket_id
 * @param {*} keyword
 */
function RecordsWithExtra(ticket_id, keyword) {
  var records = [];
  var type = ["入库", "出库"];
  var endDate = new Date();
  var startDate = new Date(new Date().setDate(endDate.getDate() - 30));
  var start = startDate.toISOString().split("T")[0];
  var end = endDate.toISOString().split("T")[0];
  var notIn = [];

  if (ticket_id) {
    records = getRecords([{ column: "ticket_id", value: ticket_id }]);
    ticket = Find(ticket_id);
    type = [ticket.type];
    notIn = [
      { column: "ticket_id", op: "gt", value: ticket_id },
      { column: "ticket_id", op: "lt", value: ticket_id },
    ];
  }

  // 符合条件记录
  extra_records = getRecords([
    ...notIn,
    { column: "uptime", op: "ge", value: start },
    { column: "uptime", op: "le", value: end },
    { column: "type", op: "in", value: type },
  ]);

  for (var i in extra_records) {
    records.push(extra_records[i]);
  }

  return records;
}

/**
 * 生成记录名称
 * @param {*} record
 * @returns
 */
function computeRecordName(record) {
  record = record || {};
  var specs = record.sku.specs || {};
  var plan = record.plan.name || "";
  var user = record.user.name || "";
  var uptime = new Date(record.uptime).toISOString().split("T");
  var supplier =
    record.supplier.short == "" ? record.supplier.name : record.supplier.short;
  var specsArr = [];
  for (var name in specs) {
    specsArr.push(`${name}:${specs[name]}`);
  }
  var specsStr = specsArr.join(" ");
  return `[${record.type} ${user} ${uptime[0]}] ${record.material.name}(${specsStr}) ${supplier} ${plan} #${record.sn}`;
}

/**
 * 读取 ticket 详情
 * @param {*} ticket_id
 * @returns
 */
function Find(ticket_id) {
  var ticket = Process("models.ticket.find", ticket_id, {
    // select: ["id", "name", "status", "type", "user_id", "warehouse_id", ""],
    withs: {
      user: {
        query: {
          select: ["id", "name", "type", "user_sn", "status"],
          withs: { supplier: {} },
        },
      },
    },
  });
  return ticket;
}

/**
 * 读取数据记录
 * @param {*} wheres
 * @returns
 */
function getRecords(wheres) {
  wheres = wheres || [];
  var records = Process("models.record.Get", {
    select: [
      "id",
      "plan_id",
      "sku_id",
      "status",
      "type",
      "uptime",
      "sn",
      "user_id",
    ],
    wheres: wheres,
    withs: {
      sku: {
        query: {
          select: [
            "id",
            "fin_price",
            "material_id",
            "price",
            "specs",
            "status",
            "tax_price",
            "tax_rate",
            "unit",
          ],
          withs: {
            material: {
              query: {
                select: ["id", "name", "supplier_id"],
                withs: { supplier: {} },
              },
            },
          },
        },
      },
      user: { query: { select: ["name", "id", "type"] } },
      plan: {
        query: {
          select: ["id", "name", "start", "end", "status"],
        },
      },
    },
  });

  return records;
}

/**
 * 生成订单号
 * @returns
 */
function genTicketSN() {
  const currentDate = new Date();
  const currentDayOfMonth = currentDate.getDate();
  const currentMonth = currentDate.getMonth() + 1; // Be careful! January is 0, not 1
  const currentYear = currentDate.getFullYear();
  var month = currentMonth < 10 ? `0${currentMonth}` : `${currentMonth}`;
  const num = new Date().valueOf();
  return `${currentYear}${month}${currentDayOfMonth}${num}`;
}

function makeSN() {
  tickets = Process("models.ticket.Get", { limit: 200 });
  for (var i in tickets) {
    if (tickets[i].ticket_sn) {
      continue;
    }

    tickets[i].ticket_sn = genTicketSN();
    Process("models.ticket.Save", tickets[i]);
  }
}
