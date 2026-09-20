---
description: "在 dsh Apps 目录中，通过持久 AI 导师对话和浏览器保存的微课程路径学习 C。"
kind: "package-reference"
---

# @deepseek-ai/dsh-client-app-code-learning

[English](README.md) | 中文

## 概述

本包在 Web Apps 目录中提供由 AI 导师讲授的 22 节 C 语言入门微课程，每课只引入一个知识点。导师会讲清知识点的含义、语法、用法和一个最小例子；学习者准备好之后，导师再给一道练习、点评答案、总结，并可按需补充扩展。它会回应自由形式的回答和粘贴的代码。消息保存在专用的持久 DSH Session 中，课程进度保存在浏览器中。与语言无关的课程定义允许其他语言替换课程内容并复用对话流程。

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

默认 Web 组合会自动加载该课程。打开**应用**，选择 **C 语言学习**并开始第一课。在桌面宽度下，应用把课程概览和课程目录固定在左栏，导师对话则铺满右栏；窄屏会把相同区域改为上下排列。应用会创建一个专用 DSH Session，向导师介绍当前课程，并把后续回答、问题、课程切换和导师回复保存在该 Session 中。学习者可以标记当前课程已理解后继续，也可以从目录选择任意课程。

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

该插件注册一个 `apps.item` 条目和一个 root 作用域的持久化 store，并向该条目注入客户端 Session Controller。界面读取 `CourseDefinition`，其中每课携带本地化键、一个重点语法形式、一个最小示例和一道延后给出的练习。它使用无工具的 `learning` Agent preset 创建 Session，通过 `sessions.retain()` 和 `sessions.using()` 持有它，把已记录的学习者与助手文本投影为导师时间线，并通过 Session face 提交 prompt。控制 prompt 会进入日志，使面向模型的课程上下文可以重建；应用不会在学习者时间线中显示控制消息和插件注入消息。

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

一条带有 `DSH_TUTOR_CONTROL` 标记的已记录控制消息会给出编程语言、本地化课程与课名、本课目标、重点语法、此前知识点、最小围栏代码示例和延后给出的练习。它要求模型依次经历讲解、澄清、练习、点评和可选扩展阶段。首次回复会自然说明本课学什么、为什么有用，只解释示例中的相关代码行，并在结尾询问学习者要继续澄清还是准备练习。模型不会向学习者说明知识点数量、教学阶段或节奏规则，也不得提前引入后续课程、在学习者准备好之前给出练习，或声称已执行代码。`learning` preset 不暴露工具，也不注入工作区运行时上下文。课程切换会把下一课的依据追加到同一个 Session。普通学习者消息会原样进入 Session。

#### Token 影响

第一轮会增加一条包含所选课程依据和示例的控制消息。每次课程切换会再增加一条紧凑控制消息；普通轮次只增加学习者消息和已保留的导师历史。preset 只增加一段简短的完整 persona，不包含工具 schema、skill 目录或工作区指令。

#### KV Cache 影响

每一轮都会使用已持有 Session 的完整上下文。课程切换会追加一条紧凑控制 prompt，而不是打开另一个 Session，因此 provider 可以复用此前的对话前缀。

## 已知限制与待办工作

<a id="known-limitations-and-deferred-work"></a>

- **没有编译器执行** — 示例是教学文本；本包不会编译或运行学习者编写的 C 代码。
- **浏览器本地进度** — 课程选择和完成状态跟随当前浏览器配置；导师消息本身是持久 Session 数据。
- **一门课程** — 可复用流程当前只随附包含 22 节微课程的 C 语言基础定义。

<a id="dev-note"></a>
### 开发备注

<details>
<summary>维护者工作上下文 — 点击展开</summary>

无。

</details>
