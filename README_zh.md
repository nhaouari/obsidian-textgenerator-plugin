<h1 align="center">obsidian-textgenerator-plugin</h1>

<div align="center">
  <a href="README.md">English</a>
  <span>&nbsp;&nbsp;•&nbsp;&nbsp;</span>
  <a href="README_zh.md">中文</a>
  <br />
  <br />
  <a href="https://bit.ly/tg_docs">文档</a>
  <span>&nbsp;&nbsp;•&nbsp;&nbsp;</span>
  <a href="https://discord.gg/mEhvhkRfq5">Discord</a>
  <span>&nbsp;&nbsp;•&nbsp;&nbsp;</span>
  <a href="https://twitter.com/intent/follow?screen_name=TextGenPlugin">Twitter</a>
  <br />
  <br />
  <br />
</div>

## Text Generator 是什么？

**Text Generator** 是一款开源的 AI 助手工具，将生成式人工智能的能力带入 Obsidian，帮助你更高效地创建和组织知识。

例如，你可以用 Text Generator 基于已有的知识库来生成想法、撰写标题、制作摘要、列出大纲，甚至生成完整的段落。

可能性无限！

如果你想讨论这个插件的使用场景或分享经验，欢迎加入我们的 [**Discord 服务器**](https://discord.gg/BRYqetyjag) 或 [GitHub Discussions](https://github.com/nhaouari/obsidian-textgenerator-plugin/discussions/categories/use-cases)。在那里你可以找到一群志同道合的用户，帮助你充分发挥这个工具的潜力。

## 功能特性

Text Generator 插件的主要优势包括：

- **免费开源**：Text Generator 插件完全免费且开源，你无需担心任何许可费用。

- **与 Obsidian 深度集成**：Obsidian 是一款功能强大、可扩展的个人知识管理软件，Text Generator 可以与之无缝配合，构建更强大的知识管理系统。

- **灵活的提示词**：通过「上下文选项」（Considered Context）中的各种可用设置，提示词的上下文配置简单直观，为你提供高度的灵活性。

- **模板引擎**：你可以创建模板，让重复性任务变得更加轻松。

- **社区模板**：通过社区模板功能，你可以发现生成式 AI 的更多使用场景，也可以方便地分享你自己的用法。

- **高度灵活的配置**：通过 Frontmatter 配置，你可以使用不同的 AI 服务提供商，如 Google Generative AI（含 `Gemini-Pro`）、OpenAI、HuggingFace 等。

## 演示

[![YouTube 演示视频](https://img.youtube.com/vi/OergqWCdFKc/0.jpg)](https://www.youtube.com/watch?v=OergqWCdFKc)

## 安装

### 方法一：从 Obsidian 社区插件市场安装

1. 打开 Obsidian
2. 进入 设置 > 第三方插件
3. 如果「安全模式」处于开启状态，请将其关闭
4. 点击「浏览」并搜索 "Text Generator"
5. 点击「安装」，然后点击「启用」

### 方法二：手动安装

如果你更喜欢手动安装，或者想使用最新的开发版本：

1. 将此仓库克隆到你的 Obsidian 仓库的 plugins 文件夹：
   ```bash
   git clone https://github.com/nhaouari/obsidian-textgenerator-plugin.git
   ```

2. 进入插件目录：
   ```bash
   cd obsidian-textgenerator-plugin
   ```

3. 安装依赖：
   ```bash
   pnpm install
   ```

4. 构建插件：
   ```bash
   pnpm run build
   ```

   如果用于开发，可以使用：
   ```bash
   pnpm run dev
   ```

5. 重启 Obsidian，并在 设置 > 第三方插件 中启用该插件

   你也可以使用 [Hot-Reload 插件](https://github.com/pjeby/hot-reload) 来实现免重启加载

### 疑难排查

如果你在安装过程中遇到问题，请：
- 查阅我们的[文档](https://bit.ly/tg_docs)
- 加入 [Discord 服务器](https://discord.gg/mEhvhkRfq5)获取社区支持
- 在 [GitHub 仓库](https://github.com/nhaouari/obsidian-textgenerator-plugin/issues)中提交 Issue

## 贡献者

<a href="https://github.com/nhaouari/obsidian-textgenerator-plugin/graphs/contributors">
  <img src="https://contrib.rocks/image?repo=nhaouari/obsidian-textgenerator-plugin" />
</a>

由 [contrib.rocks](https://contrib.rocks) 生成。
