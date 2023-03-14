/**
 * 保存用户: 同步人脸识别信息
 */
function AfterSave(id) {
  Push(id); // 同步人脸信息
  return id;
}

/**
 * 删除用户: 同步删除人脸信息
 */
function AfterDelete(id) {
  console.log("delete");
  Delete(id);
  return id;
}

/**
 * 从边缘节点读取用户资料(包含照片Base64数据)
 * REST: /user/find/:id  @/apis/user.http.json
 * @param {*} id
 */
function Find(id) {
  const user = Process("models.user.Find", id, {
    select: ["id", "name", "user_sn", "photo"],
  });

  if (user && user.code && user.message) {
    return user;
  }

  var photoData = "";
  var photoPath = user.photo.length > 0 ? user.photo[0] : null;
  if (photoPath) {
    const photo = Process("xiang.fs.ReadFile", photoPath, true);
    if (photo.content) {
      photoData = photo.content;
    }
  }
  return { id: id, user_sn: user.user_sn, name: user.name, photo: photoData };
}

/**
 * 接收边缘节点用户信息更新回执
 * REST: /user/update/:id  @/apis/user.http.json
 * @param {*} id
 * @param {*} data
 */
function Update(id, data) {
  var res = Process("models.user.Update", id, data);
  if (res && res.code && res.message) {
    throw new Exception(res.message, res.code);
  }
}

/**
 * 向边缘节点广播: 用户删除消息
 * @param {*} id
 */
function Delete(id) {
  user = GetUser(id);
  // 同步删除数据
  if (user.user_sn) {
    Process("scripts.node.Broadcast", "DeleteUser", {
      id: id,
      user_sn: user.user_sn,
    });
  }
}

/**
 * 向边缘节点广播: 用户更新消息
 * @param {*} id
 */
function Push(id) {
  user = GetUser(id);

  // 停用
  if (user.status == "停用") {
    Delete(id);
    return;
  }

  // 同步人脸识别信息
  if (
    user.user_sn &&
    user.name &&
    user.photo &&
    user.photo.length > 0 &&
    user.status == "启用"
  ) {
    Process("models.User.Save", {
      id: id,
      face_in: "同步中",
      face_out: "同步中",
    });
    Process("scripts.node.Broadcast", "UpdateUser", { id: id });
  }
}

/**
 * 删除所有用户
 */
function Clear() {
  Process("scripts.node.Broadcast", "CleanUsers", {});
}

/**
 * 读取用户信息
 * @param {*} id
 * @returns
 */
function GetUser(id) {
  return Process("models.user.Find", id, {
    select: ["id", "name", "user_sn", "photo", "status"],
  });
}

/**
 * 使用用户 SN 查询用户资料
 * @param {*} user_sn
 * @returns
 */
function GetBySN(user_sn) {
  var users = Process("models.user.Get", {
    select: ["id", "user_sn", "name", "photo", "status"],
    wheres: [{ column: "user_sn", value: user_sn }],
  });

  if (users.code && users.code != 200) {
    throw new Exception(`查询用户失败 ${user_sn} ${users.message}`, 404);
  }

  if (users.length == 0) {
    throw new Exception(`未找到用户 ${user_sn} `, 404);
  }

  var user = users[0] || {};
  return user;
}

/**
 * 使用用户 ID 查询用户资料
 * @param {*} id
 * @returns
 */
function GetByID(id) {
  return Process("models.user.Find", id, {
    select: ["id", "name", "user_sn", "photo", "status"],
  });
}
/**
 * 获取所有用户信息
 * @param {*}
 * @returns
 */
function GetAllUser() {
  return Process("models.user.get", {
    select: ["id", "name"],
  });
}
