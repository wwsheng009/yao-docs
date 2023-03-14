/**
 * 根据名称读取节点ID
 */
function Node(value, row) {
  if (value) {
    var cache = new Store("cache");
    var key = `warehouse/${value}`;
    var id = cache.GetSet(key, function (key) {
      var value = key.split("/")[1];
      var warehouses = Process("models.warehouse.Get", {
        limit: 1,
        select: ["id"],
        wheres: [
          { column: "name", value: value },
          { method: "orWhere", column: "id", value: value },
          { method: "orWhere", column: "node_id", value: value },
        ],
      });

      if (warehouses.length == 0) {
        return null;
      }
      return warehouses[0].id;
    });

    row[1] = id; // node_id
    return row;
  }

  row[1] = null; // node_id
  return row;
}

/**
 * 根据传入参数解析 RFID
 */
function RFID(value, row) {
  if (!value) {
    return false;
  }

  // 十进制 10000120000001000000400000003
  if (value.length == 29) {
    return row;
  } else if (value.length == 24) {
    // 十六进制 204fe7c774b204a0279e0403 转换为10进制
    row[0] = BigInt("0x" + value.toUpperCase()).toString(); // sn
    return row;
  }

  return false;
}

/**
 * 校验传入参数长度
 * @param {*} value
 * @param {*} row
 */
function Len(value, row) {
  if (value && value.length < 2) {
    return false;
  }
  return row;
}

/**
 * 校验传入参数数值
 * @param {*} value
 * @param {*} row
 */
function Int(value, row) {
  if (parseInt(value) > 0) {
    return row;
  }
  return false;
}

/**
 * 规格型号校验
 * @param {*} value
 * @param {*} row
 */
function Specs(value, row) {
  return row;
  row[1] = {};
  if (value) {
    value = value.replaceAll("，", ",").replaceAll("：", ":");
    var specsMap = [];
    var specs = value.split(",");
    specs.forEach((spec) => {
      const arrs = spec.split(":");
      const name = arrs[0].trim();
      const value = arrs.length > 1 ? arrs[1].trim() : "";
      specsMap[name] = value;
    });
    row[1] = specsMap; // specs 规格型号
  }
  return row;
}
