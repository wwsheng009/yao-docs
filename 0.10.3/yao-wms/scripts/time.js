/**
 * 当日
 * @returns
 */
function Today() {
  var date = new Date();
  var d = new Date(date.getTime() - date.getTimezoneOffset() * 60000);
  return d.toISOString().split("T")[0];
}

/**
 * 次日
 * @returns
 */
function Nextday(day) {
  var date = new Date();
  if (day) {
    date = new Date(day);
  }

  var now = new Date(date.getTime() - date.getTimezoneOffset() * 60000);
  now.setDate(now.getDate() + 1);
  return now.toISOString().split("T")[0];
}

/**
 * n 天以前
 * @param {*} days
 * @returns
 */
function Ago(days) {
  var date = new Date();
  var d = new Date(date.getTime() - date.getTimezoneOffset() * 60000);
  d.setDate(d.getDate() - days);
  return d.toISOString().split("T")[0];
}

/**
 * n 天前到当日
 * @param {*} days
 * @returns
 */
function Range(days) {
  return { from: Ago(days), to: Today() };
}

/**
 * n 天前到当日
 * @param {*} days
 * @returns
 */
function RangeYesterdayTime(days) {
  return { from: `${Ago(days)} 00:00:00`, to: `${Ago(1)} 23:59:59` };
}

/**
 * n 天前到上一日
 * @param {*} days
 * @returns
 */
function RangeYesterday(days) {
  return { from: Ago(days), to: Ago(1) };
}

/**
 * 补全日期范围数值
 * @param {*} range
 * @param {*} records
 * @param {*} defaults
 * @returns
 */
function Defaults(range, records, defaults) {
  records = records || [];
  defaults = defaults || {};
  mapping = {};
  for (var i in records) {
    var day = records[i].day;
    mapping[day] = records[i];
  }

  var from = new Date(range.from);
  var to = new Date(range.to);

  var result = [];
  while (from.getTime() <= to.getTime()) {
    var curr = new Date(from);
    var day = Format(curr);
    if (!mapping[day]) {
      result.push({ day: day, ...defaults });
    } else {
      result.push(mapping[day]);
    }
    from.setDate(from.getDate() + 1);
  }

  return result;
}

function Format(date) {
  var year = date.getFullYear();
  var month = date.getMonth() + 1;
  var day = date.getDate();
  if (month < 10) {
    month = "0" + month;
  }
  if (day < 10) {
    day = "0" + day;
  }

  return `${year}年${month}月${day}日`;
}

function Locale(datetimeTz) {
  const locale = LocaleTz(datetimeTz);
  const datetime = locale.split(" ");
  return `${datetime[0]}T${datetime[1]}`.split(".")[0];
}

// dateTime to locale
function LocaleTz(datetimeTz) {
  var date = datetimeTz ? new Date(datetimeTz) : new Date();
  if (date == "Invalid Date") {
    date = new Date(parseInt(datetimeTz));
  }

  const ms = date.getMilliseconds().toString().padStart(3, "0");
  const tzOffset = -date.getTimezoneOffset();
  const diff = tzOffset >= 0 ? "+" : "-";
  const pad = (n) => `${Math.floor(Math.abs(n))}`.padStart(2, "0");
  const locale =
    date.getFullYear() +
    "-" +
    pad(date.getMonth() + 1) +
    "-" +
    pad(date.getDate()) +
    " " +
    pad(date.getHours()) +
    ":" +
    pad(date.getMinutes()) +
    ":" +
    pad(date.getSeconds()) +
    "." +
    ms +
    " " +
    diff +
    pad(tzOffset / 60) +
    ":" +
    pad(tzOffset % 60);

  return locale;
}
