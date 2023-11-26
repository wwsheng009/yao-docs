# amis 需要注意的地方

## api 接口规范

如果不是使用动态列，不要在接口中返回 columns 字段，这个`columns`字段是可以作为 crud 控件的动态配置项。

crud 的数据接口同时返回 items 与 columns 数组，可以快速实现动态列,colunns 是列配置。
