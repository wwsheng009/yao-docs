/**
 * 必填项验证
 */
function Require(value, row) {
  if (value) {
    return row;
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
  }
  return false;
}
