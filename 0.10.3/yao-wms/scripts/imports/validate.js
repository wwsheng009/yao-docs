/**
 * 必填项验证
 */
function Require(value, row) {
  if (value) {
    return row;
  } else {
    console.log("必填项");
  }
  return false;
}

/**
 * RFID 状态校验
 * @param {*} value
 * @param {*} row
 */
function StatusRFID(value, row) {
  var allows = { 空闲: true, 入库: true, 异常: true };
  if (allows[value]) {
    return row;
  } else {
    console.log("状态不允许：", value);
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
