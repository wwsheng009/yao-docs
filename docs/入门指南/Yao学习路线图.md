# Yao 学习路线图

## 入门与上手

- 到官网上看看 Yao 的介绍，先了解 Yao 的定位与用途=>[官网入口](https://yaoapps.com/)。

- 使用 Yao-Init 初始化工具构建您的第一个 Yao 项目，让自己对 Yao 有一个感性的认识。[初始化项目入口](https://github.com/wwsheng009/yao-init-0.10.3)。

- 创建您的第一个模型文件。在目录/models 下参考 pet.mod.json 创建你的模型，初始阶段模型定义尽可能的简单。如果你的电脑环境可以使用 ChatGPT,可以让参考这里：[使用`ChatGPT`开发`Yao`应用](../ChatGPT/%E4%BD%BF%E7%94%A8ChatGPT%E5%BC%80%E5%8F%91YAO%E5%BA%94%E7%94%A8.md)

- 完成上一步后，你得到系统自动创建的界面配置。你可以尝试手工编写[编写界面](https://yaoapps.com/doc/%E5%9F%BA%E7%A1%80/%E7%BC%96%E5%86%99%E7%95%8C%E9%9D%A2)，进行更复杂的界面功能配置。

- 让数据从外部访问。创建您的第一个 api 配置文件。[编写接口](https://yaoapps.com/doc/%E5%9F%BA%E7%A1%80/%E7%BC%96%E5%86%99%E6%8E%A5%E5%8F%A3)

## 进阶

- 学习使用 Yao 命令[YAO 命令](https://yaoapps.com/doc/%E5%9F%BA%E7%A1%80/YAO%E5%91%BD%E4%BB%A4)。命令提供了很多有用的工具

  - Yao migrate 更新模型数据表结构
  - Yao start 启动服务
  - Yao run 运行处理器

- 更新您的模型定义文件，增加更多的字段，或是调整字段类型，增加模型与模型之间的关系。[数据模型关联](https://yaoapps.com/doc/%E8%BF%9B%E9%98%B6/%E6%95%B0%E6%8D%AE%E6%A8%A1%E5%9E%8B%E5%85%B3%E8%81%94)。创建了新的模型，同样可以使用工具生成界面配置。[Yao 界面生成工具](../Studio/%E8%87%AA%E5%8A%A8%E7%94%9F%E6%88%90table_form%E5%AE%9A%E4%B9%89%E6%96%87%E4%BB%B6.md)

  - 更新模型后，记得运行命令`yao migrate`更新数据库，sqlite 数据库请执行`yao migrate --reset`

- 学习了解[Yao 处理器](https://yaoapps.com/doc/%E5%9F%BA%E7%A1%80/%E4%BD%BF%E7%94%A8%E5%A4%84%E7%90%86%E5%99%A8)，这是 Yao 低代码平台的精华所在。

- 学习并编写 Yao 脚本文件，Yao 使用 js 进行功能扩展，使用 js 脚本可以实现更复杂的功能与逻辑处理。

## 学习资源

- [官网文档](https://yaoapps.com/doc)
- [官网仓库](https://github.com/YaoApp)
- [本项目](https://wwsheng009.github.io/yao-docs/)

## Yao 项目

目前官方正式的版本是 0.10.2。可以在官网的 github 上下载并学习。

- [yao-admin，零代码生成 yao 应用] (https://github.com/YaoApp/yao-admin)
- [yao-wms,仓库管理系统] (https://github.com/YaoApp/yao-wms)

开发版本 0.10.3,以下非官方维护。

- [yao-init](https://github.com/wwsheng009/yao-init-0.10.3),项目初始化模板
- [yao-wms](https://github.com/wwsheng009/yao-wms),比较复杂的示例
- [yao-chatgpt](https://github.com/wwsheng009/yao-chatgpt)，简单的示例
- [yao-admin](https://github.com/wwsheng009/yao-admin)，增强版 yao-admin

## 工具

- [YAO 应用 JSON-SCHEMA](https://github.com/wwsheng009/yao-app-ts-types)

- [YAO 应用调试器](https://github.com/wwsheng009/yao-app-debugger)
