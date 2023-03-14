/**
 * 查询系统信息
 */
function Info() {
  const inspect = Process("xiang.main.inspect");
  const datetime = Process("scripts.node.getTime");

  return [
    { name: "系统版本", value: inspect.version || "1.0.0" },
    { name: "系统名称", value: inspect.name || "智慧仓库" },
    { name: "服务器时间", value: datetime.locale },
    { name: "服务器时区", value: datetime.timezone },
  ];
}

/**
 * 系统重置
 * @returns
 */
function Reset() {
  return { code: 403, message: "系统重置功能暂未开通" };
}
