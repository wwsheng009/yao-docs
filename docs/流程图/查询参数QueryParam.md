# 查询参数`QueryParam`

[流程图在线查看](https://viewer.diagrams.net/?tags=%7B%7D&highlight=0000ff&edit=_blank&layers=1&nav=1&title=yao_app.drawio#Uhttps%3A%2F%2Fraw.githubusercontent.com%2Fwwsheng009%2Fyao-docs%2Fmain%2Fdocs%2F%25E6%25B5%2581%25E7%25A8%258B%25E5%259B%25BE%2Fdrawio%2Fyao_app.drawio)

## QueryParam 概述

QueryParam 是 Yao 中用于构建数据查询条件的重要组件，它可以将结构化的查询参数转换为数据库可执行的查询语句。主要应用在以下场景：

1. URL 查询参数转换：将 API 请求 URL 中的查询字符串解析为标准的查询参数
2. 模型处理器参数：在调用数据模型处理器时，用于构建复杂的查询条件

## 查询参数处理流程

### 1. 参数输入

查询参数可以来自两个主要来源：

- URL 查询字符串：通过 API 请求中的查询参数传入
- 直接构造：在处理器中直接构造 QueryParam 对象

### 2. 参数解析

系统会对输入的参数进行解析和转换，主要包括：

- parseIn：解析输入参数
- 参数验证：确保参数格式正确
- 转换成表查询参数：将解析后的参数转换为标准的 QueryParam 格式

### 3. 查询执行

转换后的 QueryParam 会被用于执行实际的数据库查询：

1. 根据 QueryParam 构建 SQL 查询语句
2. 执行查询操作
3. 返回查询结果

## QueryParam 支持的查询条件

QueryParam 支持多种查询条件和操作：

1. 基础查询条件：

   - 等于（eq）
   - 不等于（neq）
   - 大于（gt）
   - 小于（lt）
   - 大于等于（gte）
   - 小于等于（lte）

2. 高级查询条件：

   - 模糊匹配（match）
   - 范围查询（between）
   - 空值查询（null）
   - 非空查询（notnull）
   - 包含查询（in）
   - 不包含查询（notin）

3. 查询参数配置：
   - 字段选择（select）
   - 关联查询（withs）
   - 排序（order）
   - 分页（page、pagesize）

## 使用示例

1. URL 查询示例：

```bash
GET /api/user/paginate?withs=manu,mother,addresses&where.status.eq=enabled&select=id,name,mobile,status,extra&page=1&pagesize=2
```

2. 直接构造示例：

```json
{
  "select": ["id", "name", "mobile", "status", "extra"],
  "withs": { "manu": {}, "mother": {}, "addresses": {} },
  "wheres": [{ "column": "status", "value": "enabled" }],
  "page": 1,
  "pagesize": 2
}
```

通过这种方式，QueryParam 提供了一个灵活且强大的查询参数处理机制，使得数据查询既简单又高效。
