# 使用 npm 库

如果在 yao 应用中能引用 npm 开发库，将大大的提高 yao 应用中 js 脚本扩展性。可以直接利用很多现有的库。

## 前提要求：

package.json 需要使用 npm 安装而不是 pnpm,原因是 pnpm 使用了软链接进行开发包缓存，目前 esbuild 无法正常工作。

yao 内置 esbuild 编译是使用的格式`FormatIIFE`,不是 esm 也不是 commonjs。原因是每一个入口文件都是一个模块，所有导入的模块都会编译入单一文件。

这里的说的操作并不是 yao 官方发布的功能，只是个人研究学习，不保证功能的稳定性。

## 限制条件

- 只能使用 js 纯算法库，如果在库中使用了 nodejs 的内置对象，并不能在 yao 中使用，因为 yao 的 js 引擎并不直接支持这些操作。
- 不要使用异步操作，yao 的 js 引擎使用的是 v8go,是嵌入到 golang 中的对象，只在单线程中运行。
- 脚本中不能判断 windows,process,global,self 对象。yao 中并没有这些对象。
- 如果需要操作文件，网络请求，可以使用 yao 本身的内置对象，比如 FS，http，Store，Process 等等。

演示：

```sh
npm install @zxcvbn-ts/core
npm install dayjs
npm install es-toolkit
npm install lodash-es
npm install radash
```

```js
import { Process } from '@yaoapps/client';
import { default as countBy } from 'lodash-es/countBy.js';
import { default as keyBy } from 'lodash-es/keyBy';

import dayjs from 'dayjs';
import { zxcvbn } from '@zxcvbn-ts/core';

import { keys } from 'radash';

import { sum } from 'es-toolkit';

/**
 * yao run scripts.tests.lodash.test
 */
function test() {
  console.log(countBy([6.1, 4.2, 6.3], Math.floor));
  // => { '4': 1, '6': 2 }
  console.log(countBy(['one', 'two', 'three'], 'length'));
  const data = Process('models.admin.user.get', {});
  console.log(keyBy(data, 'email'));
  console.log(dayjs('2018-08-08'));
  console.log(dayjs().add(1, 'year')); //'2018-08-08'));
  console.log(zxcvbn('12#133%&*3').score);
  console.log(keys(data[0]));
  console.log(sum([1, 2, 3]));
}
```

## 支持导入的工具库

- lodash-es

  ```js
  // import  * as _ from 'lodash-es'
  import { Process } from '@yaoapps/client';
  import _ from 'lodash-es';
  import { default as countBy } from 'lodash-es/countBy.js';
  import { default as keyBy } from 'lodash-es/keyBy';
  //yao run scripts.tests.lodash.main
  function main() {
    console.log(_.countBy([6.1, 4.2, 6.3], Math.floor));
    // => { '4': 1, '6': 2 }
    console.log(_.countBy(['one', 'two', 'three'], 'length'));

    console.log(countBy([6.1, 4.2, 6.3], Math.floor));
    // => { '4': 1, '6': 2 }
    console.log(countBy(['one', 'two', 'three'], 'length'));
    const data = Process('models.admin.user.get', {});
    console.log(keyBy(data, 'email'));
  }
  ```

- underscore,支持

  ```js
  import _ from 'underscore';
  //yao run scripts.tests.underscore.main
  function main() {
    const numbers = [10, 5, 100, 2, 1000];
    const sorted = _.sortBy(numbers);
    console.log(sorted); // [2, 5, 10, 100, 1000]
  }
  ```

- dayjs，支持导入。
- radash，支持导入，radash 同时支持 cjs 与 esm,程序会根据`package.json`配置优先使用`module`配置入口。
- @zxcvbn-ts，支持导入。
- es-toolkit, 支持导入。纯 typescript 项目
- cytoscape, 支持 headless 模式
- mathjs,支持

```js
import * as mathjs from 'mathjs';
import { bigint } from 'mathjs';
/**
 * yao run scripts.tests.danfojs.test
 */
function test() {
  console.log(mathjs.sqrt(4).toString()); // 2
  console.log(mathjs.sqrt(-4).toString()); // NaN

  console.log(bigint(42).toString());
}
```

- crossfilter,支持,https://github.com/square/crossfilter

  ```js
  import * as crossfilter from 'crossfilter';
  import * as d3 from 'd3';

  //yao run scripts.tests.crossfilter.main
  function main() {
    var then, then2;

    // Various generators for our synthetic dataset.
    var firstSize = 9e4,
      secondSize = 1e4,
      totalSize = firstSize + secondSize,
      randomDayOfWeek = randomIndex([0, 0.6, 0.7, 0.75, 0.8, 0.76, 0]),
      randomHourOfDay = randomIndex([
        0, 0, 0, 0, 0, 0, 0, 0.2, 0.5, 0.7, 0.85, 0.9, 0.8, 0.69, 0.72, 0.8,
        0.78, 0.7, 0.3, 0, 0, 0, 0, 0,
      ]),
      randomDate = randomRecentDate(randomDayOfWeek, randomHourOfDay, 13),
      randomAmount = randomLogNormal(2.5, 0.5),
      randomPayment = function () {
        return { date: randomDate(), amount: randomAmount() };
      };

    // Various formatters to show our synthetic distributions.
    var x = d3.scaleLinear().rangeRound([0, 20]),
      dayNames = ['S', 'M', 'T', 'W', 'T', 'F', 'S'],
      formatNumber = d3.format(',.02r'),
      formatInteger = d3.format('8d'),
      formatDate = d3.timeFormat('%x'),
      formatDay = function (i) {
        return dayNames[i];
      };

    // Create the synthetic records.
    then = Date.now();
    var paymentRecords = d3.range(totalSize).map(randomPayment);
    console.log(
      'Synthesizing ' +
        formatNumber(totalSize) +
        ' records: ' +
        formatNumber(Date.now() - then) +
        'ms.',
    );

    // Slice the records into batches so we can measure incremental add.
    var firstBatch = paymentRecords.slice(0, firstSize),
      secondBatch = paymentRecords.slice(firstSize);

    // Create the crossfilter and relevant dimensions and groups.
    then = then2 = Date.now();
    var payments = crossfilter(firstBatch),
      all = payments.groupAll(),
      amount = payments.dimension(function (d) {
        return d.amount;
      }),
      amounts = amount.group(Math.floor),
      date = payments.dimension(function (d) {
        return d.date;
      }),
      dates = date.group(d3.timeDay),
      day = payments.dimension(function (d) {
        return d.date.getDay();
      }),
      days = day.group(),
      hour = payments.dimension(function (d) {
        return d.date.getHours();
      }),
      hours = hour.group();
    console.log(
      'Indexing ' +
        formatNumber(firstSize) +
        ' records: ' +
        formatNumber(Date.now() - then) +
        'ms.',
    );

    // Add the second batch incrementally.
    then = Date.now();
    payments.add(secondBatch);
    console.log(
      'Indexing ' +
        formatNumber(secondSize) +
        ' records: ' +
        formatNumber(Date.now() - then) +
        'ms.',
    );
    console.log(
      'Total indexing time: ' + formatNumber(Date.now() - then2) + 'ms.',
    );
    console.log('');

    // Simulate filtering by dates.
    then = Date.now();
    var today = d3.timeDay(new Date());
    for (var i = 0, n = 90, k = 0; i < n; ++i) {
      var ti = d3.timeDay.offset(today, -i);
      for (var j = 0; j < i; ++j) {
        var tj = d3.timeDay.offset(today, -j);
        date.filterRange([ti, tj]);
        updateDisplay();
      }
    }
    console.log(
      'Filtering by date: ' + formatNumber((Date.now() - then) / k) + 'ms/op.',
    );
    date.filterAll();

    // Simulate filtering by day.
    then = Date.now();
    for (var i = 0, n = 7, k = 0; i < n; ++i) {
      for (var j = i; j < n; ++j) {
        day.filterRange([i, j]);
        updateDisplay();
      }
    }
    console.log(
      'Filtering by day: ' + formatNumber((Date.now() - then) / k) + 'ms/op.',
    );
    day.filterAll();

    // Simulate filtering by hour.
    then = Date.now();
    for (var i = 0, n = 24, k = 0; i < n; ++i) {
      for (var j = i; j < n; ++j) {
        hour.filterRange([i, j]);
        updateDisplay();
      }
    }
    console.log(
      'Filtering by hour: ' + formatNumber((Date.now() - then) / k) + 'ms/op.',
    );
    hour.filterAll();

    // Simulate filtering by amount.
    then = Date.now();
    for (var i = 0, n = 35, k = 0; i < n; ++i) {
      for (var j = i; j < n; ++j) {
        amount.filterRange([i, j]);
        updateDisplay();
      }
    }
    console.log(
      'Filtering by amount: ' +
        formatNumber((Date.now() - then) / k) +
        'ms/op.',
    );
    amount.filterAll();

    console.log('');
    console.log('Day of Week:');
    x.domain([0, days.top(1)[0].value]);
    days.all().forEach(function (g) {
      console.log(
        '       ' +
          formatDay(g.key) +
          ': ' +
          new Array(x(g.value) + 1).join('▇'),
      );
    });
    console.log('');

    console.log('Hour of Day:');
    x.domain([0, hours.top(1)[0].value]);
    hours.all().forEach(function (g) {
      console.log(
        formatInteger(g.key) + ': ' + new Array(x(g.value) + 1).join('▇'),
      );
    });
    console.log('');

    console.log('Date:');
    x.domain([0, dates.top(1)[0].value]);
    dates.all().forEach(function (g) {
      console.log(
        formatDate(g.key) + ': ' + new Array(x(g.value) + 1).join('▇'),
      );
    });
    console.log('');

    console.log('Amount:');
    x.domain([0, amounts.top(1)[0].value]);
    amounts
      .all()
      .filter(function (g) {
        return x(g.value);
      })
      .forEach(function (g) {
        console.log(
          formatInteger(g.key) + ': ' + new Array(x(g.value) + 1).join('▇'),
        );
      });
    console.log('');

    // Simulates updating the display whenever the filters change.
    function updateDisplay() {
      dates.all(); // update the date chart
      days.all(); // update the day-of-week chart
      hours.all(); // update the hour-of-day chart
      amounts.all(); // update the amount histogram
      all.value(); // update the summary totals
      date.top(40); // update the payment list
      ++k; // count frame rate
    }
  }

  // var crossfilter = require("../"),
  //     d3 = require("d3");

  // Returns a function that returns random index in [0, distribution.length -
  // 1], based on the relative values in the specified distribution. Internally,
  // the distribution is converted to a normalized cumulative distribution in
  // [0, 1], and then a uniform random value is used with bisection.
  function randomIndex(distribution) {
    var k = 1 / d3.sum(distribution),
      s = 0;
    for (var i = 0, n = distribution.length; i < n; ++i) {
      s = distribution[i] = distribution[i] * k + s;
    }
    return function () {
      return d3.bisectLeft(distribution, Math.random());
    };
  }

  // Returns a function that returns random values with a log-normal
  // distribution, with the specified mean and deviation.
  function randomLogNormal(µ, σ) {
    var random = d3.randomNormal();
    return function () {
      return Math.exp(µ + σ * random());
    };
  }

  // Returns a function that returns random dates, built on top of the specified
  // random day-of-week and hour-of-day generators. The minutes, seconds, and
  // milliseconds of the return dates are uniform random; as is the week of the
  // returned date, which is between now and some *weeks* ago.
  function randomRecentDate(randomDayOfWeek, randomHourOfDay, weeks) {
    var now = Date.now();
    return function () {
      var d = d3.timeWeek.offset(
        new Date(),
        -Math.floor(Math.random() * weeks),
      );
      d.setDate(d.getDate() + randomDayOfWeek() - d.getDay());
      d.setHours(
        randomHourOfDay(),
        Math.random() * 60,
        Math.random() * 60,
        Math.random() * 1000,
      );
      return d;
    };
  }
  ```

- d3,支持

  ```js
  // d3 使用是export * from xxx;
  import * as d3 from 'd3';
  // yao run scripts.tests.d3.main
  function main() {
    const data = [30, 86, 168, 281, 303, 365];
    const scaled = d3.scaleLinear().domain([0, 365]).range([0, 100]);
    const result = data.map((d) => scaled(d));
    console.log(result); // [8.22, 23.56, 46.03, 76.99, 82.98, 100]
  }
  ```

- pandas-js，支持

## 不支持的

- crypto-js, 不支持导入。这是一个 cjs 项目，里面需要引用浏览器或是 nodejs 的本地功能，也有，无法导入。
- danfojs/danfojs-node,不支持导入，里面判断了全局对象
- dataframe-js，无法导入，无法解析 child_process/fs/url/http/https 对象
- papaparse,无法导入，使用 stream 对象。

## 建议

不要使用功能库 lodash，而是使用它的替代库`lodash-es`，只导入有需要的库，减少编译文件的大小。

## yao 源代码调整

https://github.com/wwsheng009/gou/commit/0ec6d9f57b7a168f1699878d378112479065acd3

## 原理

调整 Yao 内部 esbuild 编译器的处理逻辑，增加加载`node_modules`目录的代码的功能。

通过 esbuild on-load 事件加载其它的引用的代码：https://esbuild.github.io/plugins/#on-load
