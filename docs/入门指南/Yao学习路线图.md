# Yao 学习路线图

## 入门与上手

- 到官网上看看 Yao 的介绍，先了解 Yao 的定位与用途=>[官网入口](https://yaoapps.com/)。

- 下载安装 Yao。

- 使用 Yao-Init 初始化工具构建您的第一个 Yao 项目，让自己对 Yao 有一个感性的认识。[初始化项目入口](https://github.com/wwsheng009/yao-init)。

- 创建您的第一个模型文件。在目录/models 下参考 pet.mod.json 创建你的模型，初始阶段模型定义尽可能的简单。如果你的电脑环境可以使用 ChatGPT,可以让参考这里：[使用`ChatGPT`开发`Yao`应用](../AI/ChatGPT/%E4%BD%BF%E7%94%A8ChatGPT%E5%BC%80%E5%8F%91YAO%E5%BA%94%E7%94%A8.md)

- 完成上一步后，你得到系统自动创建的界面配置。你可以尝试手工编写，进行更复杂的界面功能配置。

- 让数据从外部访问。创建您的第一个 api 配置文件。

## 进阶

- 学习使用 Yao 命令。命令提供了很多有用的工具

  - Yao migrate 更新模型数据表结构
  - Yao start 启动服务
  - Yao run 运行处理器

- 更新您的模型定义文件，增加更多的字段，或是调整字段类型，增加模型与模型之间的关系。创建了新的模型，同样可以使用工具生成界面配置。

  > 更新模型后，记得运行命令`yao migrate`更新数据库，sqlite 数据库请执行`yao migrate --reset`

- 学习并编写 Yao 脚本文件，Yao 使用 js 进行功能扩展，使用 js 脚本可以实现更复杂的功能与逻辑处理。

## 学习资源

- [官网文档](https://yaoapps.com/doc)
- [官网仓库](https://github.com/YaoApp)
- [本项目](https://wwsheng009.github.io/yao-docs/)

## Yao 项目

目前官方正式的版本是 0.10.3。可以在官网的 github 上下载并学习。

- [yao-admin，零代码生成 yao 应用] (https://github.com/YaoApp/yao-admin)
- [yao-wms，仓库管理系统] (https://github.com/YaoApp/yao-wms)

开发版本 0.10.3,以下非官方维护。

- [yao-init](https://github.com/wwsheng009/yao-init)，项目初始化模板
- [yao-wms](https://github.com/wwsheng009/yao-wms)，比较复杂的示例
- [yao-chatgpt](https://github.com/wwsheng009/yao-chatgpt)，简单的示例
- [yao-admin](https://github.com/wwsheng009/yao-admin)，增强版 yao-admin

## 工具

- [YAO 应用 JSON-SCHEMA](https://github.com/wwsheng009/yao-app-ts-types)
