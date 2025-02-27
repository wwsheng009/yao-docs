# AI生成模型模板

## 概述

AI生成模型模板是YAO平台提供的一种强大工具，它能够帮助开发者快速生成符合YAO DSL规范的模型定义。本文将介绍如何有效使用这些模板，以提高开发效率。

## 模板类型

### 1. 基础模型模板

- [没有模型关联关系的模板](./Prompts/model_without_relations.md)
  - 适用于独立模型的定义
  - 包含基本的字段定义和验证规则
  - 简单直观，适合入门使用

### 2. 高级模型模板

- [带模型关联关系的模板](./Prompts/model_with_relations.md)
  - 支持复杂的模型关联关系
  - 包含一对一、一对多、多对多等关系定义
  - 适用于复杂业务场景

## 使用指南

### 1. 模板选择

- 根据业务需求的复杂度选择合适的模板
- 考虑模型之间的关联关系
- 评估数据结构的复杂性

### 2. 模板使用步骤

1. 选择适合的模板类型
2. 根据实际需求修改模板参数
3. 使用AI工具生成模型定义
4. 检查和优化生成的代码

### 3. 最佳实践

- 先从简单模板开始，逐步过渡到复杂模板
- 保持模型结构的清晰和合理
- 注意字段命名的规范性
- 适当添加注释和文档

## 模板示例

### 基础模型示例

```json
{
  "name": "user",
  "table": { "name": "users", "comment": "用户表" },
  "columns": [
    { "name": "id", "type": "ID" },
    { "name": "name", "type": "string", "comment": "用户名" },
    { "name": "email", "type": "string", "comment": "邮箱" }
  ]
}
```

### 关联模型示例

```json
{
  "name": "post",
  "table": { "name": "posts", "comment": "文章表" },
  "columns": [
    { "name": "id", "type": "ID" },
    { "name": "title", "type": "string", "comment": "标题" },
    { "name": "user_id", "type": "integer", "comment": "作者ID" }
  ],
  "relations": {
    "user": {
      "type": "belongsTo",
      "model": "user",
      "key": "user_id"
    }
  }
}
```
