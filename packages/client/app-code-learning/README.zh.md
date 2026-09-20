---
description: "在 dsh Apps 目录中，通过持久 AI 导师对话和浏览器保存的六课路径学习 C。"
kind: "package-reference"
---

# @deepseek-ai/dsh-client-app-code-learning

[English](README.md) | 中文

## 概述

本包让学习者在 Web Apps 目录中跟随 AI 导师完成六节 C 语言入门课。导师会讲解概念、展示代码、提出追问，并回应自由形式的回答或粘贴的代码。消息保存在一个专用的持久 DSH Session 中，课程选择和完成状态则由当前浏览器跨页面刷新保存。课程 UI 使用与语言无关的定义，因此其他编程语言可以替换课程与示例并复用同一套对话流程。

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

默认 Web 组合会自动加载该课程。打开**应用**，选择 **C 语言学习**并开始第一课。应用会创建一个专用 DSH Session，向导师介绍当前课程，并把后续回答、问题、课程切换和导师回复保存在该 Session 中。学习者可以标记当前课程已理解后继续，也可以从目录选择任意课程。

要在其他浏览器组合中挂载本包，请在 Apps 外壳之后加载：

```yaml
- id: app-code-learning
  name: '@deepseek-ai/dsh-client-app-code-learning'
```

本包没有配置字段。**开始新的学习对话**会清除浏览器本地课程导航并断开应用与当前导师 Session 的关联；旧 Session 仍可通过正常的 DSH Session 历史访问。

-----

<a id="understand-the-implementation"></a>
## 理解实现

<details>
<summary>实现内部细节 — 点击展开</summary>

该插件注册一个 `apps.item` 条目和一个 root 作用域的持久化 store，并向该条目注入客户端 Session Controller。界面读取 `CourseDefinition`，其中每课携带本地化键和教学示例。它通过 `sessions.create()`、`sessions.retain()` 和 `sessions.using()` 创建或持有一个专用 Session，把已记录的用户与助手文本投影为导师时间线，并通过 Session face 提交 prompt。控制 prompt 会进入日志，使面向模型的课程上下文可以重建，但应用不会在学习者时间线中显示这些消息。

C 课程数据与 React 流程分离；另一种语言可以新增课程定义和注册，同时复用 Session 所有权、对话渲染、导航、手动完成和响应式布局。

**运行时 invariant：** 本包不发布配套模块。浏览器本地状态只包含导航、手动完成状态和引用的 Session id；对话历史由 Session 日志持有。释放或重置应用绝不会删除该 Session。

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

### 导师课程控制

#### 模型看到的内容

一条带有 `DSH_TUTOR_CONTROL` 标记的已记录控制消息会给出编程语言、本地化课程与课名、学习目标、参考讲解和围栏代码示例。它要求模型通过简短对话和开放式问题逐个讲解概念，逐步增强提示，分析粘贴的代码但不得声称已执行代码，不使用工具或修改文件，并匹配学习者的语言。课程切换会把下一课的依据追加到同一个 Session。普通学习者消息会原样进入 Session。

#### Token 影响

第一轮会增加一条包含所选课程依据和示例的控制消息。每次课程切换会再增加一条紧凑控制消息；普通轮次只增加学习者消息，以及组合 profile 持有的正常 Session 上下文。

#### KV Cache 影响

每一轮都会使用已持有 Session 的完整上下文。课程切换会追加一条紧凑控制 prompt，而不是打开另一个 Session，因此 provider 可以复用此前的对话前缀。

## 已知限制与待办工作

<a id="known-limitations-and-deferred-work"></a>

- **没有编译器执行** — 示例是教学文本；本包不会编译或运行学习者编写的 C 代码。
- **浏览器本地进度** — 课程选择和完成状态跟随当前浏览器配置；导师消息本身是持久 Session 数据。
- **一门课程** — 可复用流程当前只随附六课 C 语言基础定义。

<a id="dev-note"></a>
### 开发备注

<details>
<summary>维护者工作上下文 — 点击展开</summary>

无。

</details>
