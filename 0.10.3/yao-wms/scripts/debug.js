function bigint() {
  var stock = Process("flows.stock.count", 2);
  console.log(stock);
}

function test() {
  var i = BigInt(10).toString();
  var map = { key: i, foo: "bar" };
  console.log(map);
}

function save() {
  console.log("now:", now());

  var err = Process("models.stock.Save", {
    uptime: now(),
    sku_id: 10068,
    warehouse_id: 1,
    stock: 0,
  });
  console.log("err:", err);
  return now();
}

function now() {
  const date = new Date();
  const dateWithOffest = new Date(
    date.getTime() - date.getTimezoneOffset() * 60000
  );
  return dateWithOffest.toISOString().slice(0, 19).replace("T", " ");
}
function Onface(payload) {
  var res = Process("scripts.event.OnFace", "进入", {
    device: "FACE.Q8.IN",
    node_id: "1",
    request_id: "a55940b03d142e51bd78837e35464aa2",
    timestamp: "1658237974032",
    uptime: 1658237972000,
    user_sn: "1001",
  });
  return res;
}
