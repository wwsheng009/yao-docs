# log 打印调试信息

Log 打印调试信息，方便定位问题。

## 示例

log 打印位置 `logs/application.log` 打印日志:

```javascript
log.Error('%v', foo);
log.Info('foo');
```

输出以下信息:

```
time="2022-08-25T10:00:28Z" level=error msg=foo
time="2022-08-25T10:00:28Z" level=info msg=foo

```
