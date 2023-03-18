/**
 * yao run scripts.studio.menu.Menu
 * @returns
 */
function Menu() {
  var meunList = [];
  let res = Process("schemas.default.Tables");
  for (var i in res) {
    let dsl = Process("schemas.default.TableGet", res[i]);
    var name = "";
    if (dsl["name"]) {
      name = dsl["name"] + "(" + res[i] + ")";
    } else {
      name = res[i];
    }

    meunList.push({
      path: "/index.html",
      title: name,
      value: res[i],
      icon: "icon-iconfont1",
    });
  }
  return {
    code: 200,
    meunList: meunList,
  };
}

function Detail(query) {
  var col = [];

  if (query["name"] && query["name"].length) {
    var name = query["name"][0];
    var res = Process("schemas.default.TableGet", name);
    var col = res["columns"];
  }
  return {
    code: 200,
    data: col,
  };
}
