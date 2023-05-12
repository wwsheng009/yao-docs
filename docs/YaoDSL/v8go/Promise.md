# Promise

## 在 Yao 中使用 js Promise

```sh
git clone https://github.com/YaoApp/gou-dev-app.git
```

`/gou-dev-app/scripts/runtime/promise.js`

```js
/**
 * test promise all
 * yao run scripts.runtime.promise.All
 */
function All() {
  const func_a = new Promise(async (resolve, reject) => {
    console.log('func_a start');
    for (var i = 0; i < 10; i++) {
      await sleep(100);
    }
    console.log('func_a end');
    resolve('func_a');
  });

  const func_b = new Promise(async (resolve, reject) => {
    console.log('func_b start');
    for (var i = 0; i < 5; i++) {
      await sleep(100);
    }
    console.log('func_b end');
    resolve('func_b');
  });

  Promise.all([func_a, func_b]).then((values) => {
    console.log(`result: ${values}`);
  });
}

/**
 * test promise race
 * yao run scripts.runtime.promise.Race
 */
function Race() {
  let done = false;

  const func_a = new Promise(async (resolve, reject) => {
    console.log('func_a start');
    for (var i = 0; i < 10; i++) {
      if (done) {
        return resolve('func_a');
      }
      await sleep(100);
    }
    console.log('func_a end');
    done = true;
    resolve('func_a');
  });

  const func_b = new Promise(async (resolve, reject) => {
    console.log('func_b start');
    for (var i = 0; i < 5; i++) {
      if (done) {
        return resolve('func_a');
      }
      await sleep(100);
    }
    console.log('func_b end');
    done = true;
    resolve('func_b');
  });

  Promise.race([func_a, func_b]).then((value) => {
    console.log(`result: ${value}`);
  });
}

/**
 * test promise any
 * yao run scripts.runtime.promise.Any
 */
function Any() {
  let done = false;

  const func_a = new Promise(async (resolve, reject) => {
    console.log('func_a start');
    for (var i = 0; i < 10; i++) {
      if (done) {
        return resolve('func_a');
      }
      await sleep(100);
    }
    console.log('func_a end');
    done = true;
    resolve('func_a');
  });

  const func_b = new Promise(async (resolve, reject) => {
    console.log('func_b start');
    for (var i = 0; i < 5; i++) {
      if (done) {
        return resolve('func_b');
      }
      await sleep(100);
    }
    console.log('func_b end');
    done = true;
    resolve('func_b');
  });

  Promise.any([func_a, func_b]).then((value) => {
    console.log(`result: ${value}`);
  });
}

function sleep(ms) {
  return new Promise((resolve) => {
    time.Sleep(ms);
    resolve();
  });
}
```
