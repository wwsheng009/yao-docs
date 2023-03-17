/**
 * 搜索 Hook, 处理日期条件
 */
function BeforeSearch(query, page, pagesize) {
  //   console.log("old search:", query.wheres);
  query = query || {};
  wheres = query.wheres || [];
  for (var i in wheres) {
    var where = wheres[i] || {};
    if (where.column == "day" && where.value) {
      //url的查询
      where.value = where.value.replaceAll(`"`, "");
      var value = new Date(where.value).toISOString().split("T")[0];
      query.wheres[i]["value"] = value + " 00:00:00";
    }
  }
  return [query, page, pagesize];
}
