# 欢迎参与贡献，提 PR

## 贡献指南

可在 [github](https://github.com/wwsheng009/yao-docs) 页 fork 一份仓库代码，然后基于 fork 后的提 PR 过来。

推荐使用 pnpm 安装：

```bash
pnpm install
```

本地环境开发：

```bash
pnpm dev
```

## github pages 配置

fork 项目后，需要在项目中配置环境变量。

在项目访问地址`yao-docs/settings/secrets/actions`增加以下两个变量后，发布到 github-page 的流程才不会失败。

ALGOLIA_API_KEY=f3f332389d40f82741dc99678e577e5d

ALGOLIA_APPLICATION_ID=Z0GOIBJSIG

## 文章贡献

对于文章贡献，分两种情况：

- 如果你是原创作者，请在 `author` 字段填写自己的 GitHub 账号名，会自动在文章末尾进行声明。

- 如果你是修正某篇文章，请在 `contributors` 字段增加自己的 GitHub 账号名，也会有贡献者头像，并不会修改原作者信息。

```md
---
author: Vincent Wang
contributors: [HearLing]
---
```

## 代码格式

对于代码格式，本仓库使用 `prettier` 与 `git-hooks`，在你提交代码的时候会进行格式化以及修复一些问题。

也可以手动执行一下：

```bash
pnpm prettier:fix
```

提交之前需要`build`检查有没有错误。

```bash
pnpm run build && pnpm run serve
```

重建所有的`index.md`文件

```bash
pnpm run build:index
```

## 贡献者列表

推荐大家自行填写相关信息，只需要在 `docs/index.md` 文件内添加自己的相关信息即可，无需修改 `contributors.json` 文件，该文件会自动生成。

## 文字排版

笔记内容按照 [中文文案排版指北](https://mazhuang.org/wiki/chinese-copywriting-guidelines/)进行排版，即尽量保证中英文之间的空格，也可以使用 VSCode 相关格式化工具。

`md`的文档格使用`pritter`配合`vscode`的插件[`esbenp.prettier-vscode`](https://marketplace.visualstudio.com/items?itemName=esbenp.prettier-vscode)

## 感谢参与

非常感谢你对于 [ChoDocs](https://github.com/chodocs/chodocs) 的参与贡献，我们会在首页 [chodocs.cn](https://chodocs.cn/) 展示各位贡献者的头像！
