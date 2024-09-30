# js 后台异步执行作业

当在 js 脚本需要执行一个很耗时的作业时，需要在不打断这个作业的情况下，异步检查它的执行状态。

js 后台异步执行作业对象`Job`，它有三个方法：

- Pending 状态检查回调函数
- Data 读取作业完成后的数据
- Cancel 取消作业

## 对象定义

```js
// 定义新的后台作业，参数1是处理器的名称，剩余的是处理器的参数。
// 作业会使用golang 的协程进行调用执行
let job = new Job('scripts.image.Post', url, payload, headers);

// 作业状态检查器。
//当作业在执行过程中会不断的检查作业状态，如果作业还没完成，就会不断的调用回调函数。
//作业的状态回调方法Pending,方法的参数1必须是函数
job.Pending(function () {});

//可以在回调函数中使用 return false 打断状态检查。
job.Pending(function () {
  return false;
});

//读取作业完成后返回的数据，成功后删除作业
//比如在这里是取的处理器`scripts.image.Post`的返回数量
let image = job.Data();

//取消作业
job.Cancle();
```

示例代码：

```sh
git clone https://github.com/YaoApp/yao-dev-app
```

`yao-dev-app\scripts\image.js`，使用 job 调用耗时的 ai 生成图片 api。

```js
/**
 * yao run scripts.image.PostAsync /sdapi/v1/txt2img '::{"width":512,"height":512,"steps":5,"prompt":"maltese puppy"}'
 * @param {*} api
 * @param {*} payload
 * @param {*} cb
 */
function PostAsync(api, payload, cb) {
  let cfg = setting();
  let headers = { Authorization: `Basic ${btoa(cfg.user + ':' + cfg.pass)}` };
  let url = `${cfg.host}${api}`;
  let job = new Job('scripts.image.Post', url, payload, headers);
  cb =
    cb ||
    function (progress, err) {
      if (err) {
        console.log(`Error: ${err}`);
        return false;
      }
      console.log(progress);
    };

  url = `${cfg.host}/sdapi/v1/progress`;
  job.Pending(() => {
    time.Sleep(200);
    let response = http.Get(url, null, headers);
    if (response.code != 200) {
      let err = newException(response.data, response.code);
      cb(null, err.message);
      return false;
    }
    cb(response.data.progress);
  });

  let image = job.Data();
  return image;
}

/**
 * scripts.image.Post
 */
function Post(url, payload, headers) {
  let response = http.Post(url, payload, null, null, headers);
  if (response.code != 200) {
    throw newException(response.data, response.code);
  }

  let images = response.data.images || [];
  if (images.length == 0) {
    log.Error(`SD API response error`);
    throw new Exception(`SD API response error`, response.code || 500);
  }

  return images[0];
}
```
