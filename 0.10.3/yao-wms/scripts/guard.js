/**
 * HTTP 服务守卫(用于边缘节点对接)
 */
function Node(path, params, query, payload, headers) {
  return;
}

/**
 * 刷新Token
 */
function TokenRefresh() {
  const user = Process("session.Get", "user");
  const id = user.id;
  const sid = Process("session.ID");
  const jwt = Process(
    "xiang.helper.JWTMake",
    id,
    {},
    { timeout: 3600, sid: sid }
  );

  // 更新 Session
  Process("session.Set", "user_id", id);
  Process("session.Set", "user", "user");

  return jwt;
}
