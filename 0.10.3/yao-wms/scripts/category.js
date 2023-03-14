function AfterSave(id, payload) {
  var category_sn = payload["category_sn"];
  if (!category_sn) {
    return Process("models.material.category.Save", {
      id: id,
      category_sn: MakeSN(id),
    });
  }
  return id;
}

/**
 * 生成类目标签 (1+id)
 * 标签: **类目(6)**-SKU(8)-计划(6)-Item(9)
 *      100001 20000001 000000 400000001
 */
function MakeSN(id) {
  var sn = id.toString();
  return sn.padEnd(6, "0");
}
