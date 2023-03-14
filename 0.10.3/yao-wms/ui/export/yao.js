/**
 * YAO Pure JavaScript SDK
 * @author Max<max@iqka.com>
 * @maintainer https://yaoapps.com
 */

/**
 * Yao Object
 * @param {*} host
 */
function Yao(host) {
  this.host = `${
    host || window.location.protocol + "//" + window.location.host
  }/api`;

  console.log(this.host);
  this.query = {};
  new URLSearchParams(window.location.search).forEach((key, value) => {
    this.query[key] = value;
  });
}

/**
 * Get API
 * @param {*} path
 * @param {*} params
 */
Yao.prototype.Get = async function (path, params, headers) {
  return this.Fetch("GET", path, params, null, headers);
};

/**
 * Post API
 * @param {*} path
 * @param {*} data
 * @param {*} params
 * @param {*} headers
 */
Yao.prototype.Post = async function (path, data, params, headers) {
  return this.Fetch("POST", path, params, data, headers);
};

/**
 * Download API
 * @param {*} path
 * @param {*} params
 */
Yao.prototype.Download = async function (path, params, savefile, headers) {
  try {
    const blob = await this.Fetch("GET", path, params, null, headers, true);

    var objectUrl = window.URL.createObjectURL(blob);
    let anchor = document.createElement("a");
    document.body.appendChild(anchor);
    anchor.href = objectUrl;
    anchor.download = savefile;
    anchor.click();
    window.URL.revokeObjectURL(objectUrl);
  } catch (err) {
    alert("成功创建导出任务!");
  }
};

/**
 * Fetch API
 * @param {*} method
 * @param {*} path
 * @param {*} params
 * @param {*} data
 * @param {*} headers
 */
Yao.prototype.Fetch = async function (
  method,
  path,
  params,
  data,
  headers,
  isblob
) {
  params = params || {};
  headers = headers || {};
  data = data || null;
  var url = `${this.host}${path}`;
  var queryString = this.Serialize(params);
  if (queryString != "") {
    url = url.includes("?") ? `${url}&${queryString}` : `${url}?${queryString}`;
  }

  const token = this.Token();
  if (token != "") {
    headers["authorization"] = `Bearer ${token}`;
  }

  if (!headers["Content-Type"]) {
    headers["Content-Type"] = "application/json";
  }

  var options = {
    method: method,
    mode: "cors", // no-cors, *cors, same-origin
    cache: "no-cache", // *default, no-cache, reload, force-cache, only-if-cached
    credentials: "same-origin", // include, *same-origin, omit
    headers: headers,
    redirect: "follow", // manual, *follow, error
  };

  if (data != null) {
    options["body"] = JSON.stringify(data);
  }

  const resp = await fetch(url, options);
  const type = resp.headers.get("Content-Type") || "";
  if (type.includes("application/json")) {
    return resp.json();
  } else if (isblob) {
    return resp.blob();
  } else if (type.includes("text/html") || type.includes("text/plain")) {
    return resp.text();
  }
  return resp.text();
};

/**
 * Token API
 * @param {*} path
 * @param {*} params
 */
Yao.prototype.Token = function () {
  var token = sessionStorage.getItem("token") || "";
  return token;
};

/**
 * Serialize To Query String
 * @param {*} obj
 * @returns
 */
Yao.prototype.Serialize = function (obj) {
  var str = [];
  for (var p in obj)
    if (obj.hasOwnProperty(p)) {
      str.push(encodeURIComponent(p) + "=" + encodeURIComponent(obj[p]));
    }
  return str.join("&");
};
