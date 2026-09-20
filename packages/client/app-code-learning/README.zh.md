---
description: "在 dsh Apps 目录中，通过可保存进度的六课学习路径、讲解、可运行风格的示例和即时知识检查来学习 C。"
kind: "package-reference"
---

# @deepseek-ai/dsh-client-app-code-learning

[English](README.md) | 中文

## 概述

本包让学习者在 Web Apps 目录中完成六节 C 语言入门课。每课包含一个目标、简明讲解、代码示例和即时知识检查。当前浏览器会跨页面刷新保留学习进度。课程 UI 使用与语言无关的课程定义，因此其他编程语言可以替换课程和示例并复用同一套流程。

## 目录

- [使用本包](#use-this-package)
- [理解实现](#understand-the-implementation)
- [延伸阅读](#further-exploration)
- [模型体验](#model-experience)
- [已知限制与待办工作](#known-limitations-and-deferred-work)
- [开发备注](#dev-note)

-----

<a id="use-this-package"></a>
## 使用本包

默认 Web 组合会自动加载该课程。打开**应用**，选择 **C 语言学习**，然后选择任意课程或按顺序学习；回答正确会完成当前课程并启用下一课。

要在其他浏览器组合中挂载本包，请在 Apps 外壳之后加载：

```yaml
- id: app-code-learning
  name: '@deepseek-ai/dsh-client-app-code-learning'
```

本包没有配置字段。**重置进度**会清除浏览器本地课程状态并返回第一课。

-----

<a id="understand-the-implementation"></a>
## 理解实现

<details>
<summary>实现内部细节 — 点击展开</summary>

该插件注册一个 `apps.item` 条目和一个 root 作用域的持久化 store。界面读取 `CourseDefinition`，其中每课携带本地化键、示例源码、答案选项和正确选项。C 课程数据与 React 流程分离；另一种语言可以新增课程定义和注册，同时复用导航、进度、答题反馈和响应式布局。

**运行时 invariant：** 本包不发布配套模块。课程只拥有浏览器本地状态，包测试覆盖其 Slot 注册和持久化。

</details>

-----

<a id="further-exploration"></a>
## 延伸阅读

- [Apps 外壳](../ui-apps/README.zh.md) — 目录注册和 App 展示模式。
- [客户端 store](../store/README.zh.md) — root 作用域持久化和 action 所有权。
- [Web 客户端 Slots](../../../docs/subsystems/slots.zh.md) — 组件组合与生命周期。

-----

<a id="model-experience"></a>
## 模型体验

无，因为这个浏览器侧课程不注册任何面向模型的输入。

#### KV Cache 影响

无；本包既不组装也不发送 provider 请求。

## 已知限制与待办工作

<a id="known-limitations-and-deferred-work"></a>

- **没有编译器执行** — 示例是教学文本；本包不会编译或运行学习者编写的 C 代码。
- **浏览器本地进度** — 进度跟随当前浏览器配置，不通过 dsh Workspace 或 Session 同步。
- **一门课程** — 可复用流程当前只随附六课 C 语言基础定义。

<a id="dev-note"></a>
### 开发备注

<details>
<summary>维护者工作上下文 — 点击展开</summary>

无。

</details>
