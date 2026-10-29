<p align="center"><img src="docs/hero.svg" alt="dsh-project-guide" width="100%"></p>

<p align="center">
  <a href="README.en.md">English</a> · <b>简体中文</b>
</p>

<p align="center">
  <img alt="version" src="https://img.shields.io/badge/version-0.1.0-5b8cff?style=flat-square">
  <img alt="license" src="https://img.shields.io/badge/license-MIT-3fb950?style=flat-square">
  <img alt="platform" src="https://img.shields.io/badge/DSH-Desktop%20%2B%20Web-6b5cff?style=flat-square">
  <img alt="ai" src="https://img.shields.io/badge/%E4%BA%BA%E8%AF%9D-%E7%94%B1%E6%A8%A1%E5%9E%8B%E5%86%99-d29922?style=flat-square">
</p>

# 你在 dsh 里大概遇到过这三件事

- **开盲盒**：AI 说「做完了」，可你没有独立判断的标准，只能再抽一次。
- **只会说「继续」**：不是不想说清楚，而是描述问题需要先有词汇——你只有「哪里怪怪的」，它说的是「state 没同步」。
- **做完一个项目，自己没学到东西**：它讲的那一遍随对话流走了，没沉淀到你身上。

`dsh-project-guide` 给项目加一层**导览**：把目录翻成人话，把「敢不敢动」标出来，把每一步都做成能回看的卡片。

## 它做三件事

**1. 项目导览** —— 打开就告诉你：这个项目是干什么的、由哪几块组成、先从哪三个文件看起、哪些文件你根本不用管。

**2. 文件夹卡片** —— 点一块，一屏讲完：它是什么、改了会怎样、跟谁有关系。标 **放心改 / 要小心 / 别乱碰**。同一张卡可以切三档深度：`讲给我听` / `讲清结构` / `看到代码`。

**3. 点到代码** —— 卡片里列出这个文件夹的文件，点一个，只读那一个：它在做什么、按什么顺序干活、需要什么、产出什么、改坏了会出现什么症状。

## 长什么样

![项目导览](docs/overview.png)

![文件卡片：这段代码在干什么](docs/file-card.png)

这三个文件夹名会告诉你它到底是什么：`后台请求中转`、`浏览器外挂`、`判断的规矩`——不是 `background.js`、`extension`、`core`。

## 装上

```bash
git clone https://github.com/yxyusage/dsh-project-guide.git
```

然后在 dsh 的插件页里**从这个目录安装**（Plugin Manager → 安装 → 选择文件夹）。装完左侧栏会多一个「导览」。

> 需要 dsh 支持安装本地目录 bundle。装不上就把环境版本发我，我看看。

## 怎么工作

分两层，**事实和解释永远分开放**：

| 层 | 来源 | 会不会编 |
| --- | --- | --- |
| 事实层 | 直接读文件系统：目录树、文件数、谁引用谁 | 不会 |
| 解释层 | 常见文件夹名用内置词典（秒出、零成本），其余交给你的默认模型 | 可能，所以标出来 |

所以卡片上会同时出现「事实：这个文件夹里 16 个文件」和「判断：这是最容易连锁出错的地方」——前者能信，后者是理解。

几个刻意的设计：

- **点开才算**。不预生成整个仓库的解释，那是烧钱；文件解释只在你点开时生成一次，按修改时间缓存。
- **只发该看的**。解释一个文件时，只把开头注释、用到的模块名、里面定义的名字和前面 140 行发给模型，不整份上传。
- **模型挂了也能用**。JSON 被说断会先抢救（补括号、去尾逗号），救不回来就退成只讲顶层重试一次；再不行就只给结构，并明确告诉你「这次没有用模型」。

## 设置

右上角 ⚙：

- **用模型写解释** —— 关掉后几秒出结果，但每块只剩结构，没有人话。
- **一次讲多少块** —— 少 6 / 标准 12 / 多 18。

启动时不偷读任何项目，要不要花模型的钱由这两项决定。

## 能力边界

- 引用关系只解析 JS / TS / JSX / Vue / Svelte / Astro 的**相对引用**；其它语言只统计文件。
- 目录只展开两层、节点上限 26 个——铺开两百个文件夹等于没有地图。
- 文件解释针对**单个文件**，不顺调用链往上追。想回答「改这个函数会影响谁」，需要另建一张引用索引，还没做。
- 单文件 400KB 上限；二进制和图片会直接说读不了。
- 「讲错了」的更正存在本机浏览器，显示在卡片顶部，暂不参与生成。

## 开发

```
index.js          Host 半：扫目录、算引用、调模型、三条只读 API
client.js         浏览器半：侧栏入口 + 导览页（无构建步骤，纯 JS + createElement）
cordis.patch.yml  bundle 声明
locale/           Plugin Manager 里显示的名字和描述
dev/probe.mjs     开发用探针：直接打 API 看真实项目的解释质量
docs/             README 用图
prototype/        早期界面原型，保留参考
```

调 API（dsh 正在跑的时候）：

```bash
node dev/probe.mjs "E:\你的项目"
```

改了 `index.js` 需要重装 bundle 才生效；只改 `client.js` 刷新页面即可。

## 一起做

欢迎开 issue 和 PR。动手之前先看一眼 [CONTRIBUTING.md](CONTRIBUTING.md)，里面的约定很短。

## License

MIT © yxynbglass
