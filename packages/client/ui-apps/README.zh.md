---
description: "在一个 Web 侧栏目录中承载场景应用，并让浏览器插件通过类型化 Slot 贡献可随卸载移除的应用摘要与页面。"
kind: "package-reference"
---

# @deepseek-ai/dsh-client-ui-apps

[English](README.md) | 中文

## 概述

本包向 Web 侧栏添加**应用**入口。它持有一个全局目录和 `apps.item` 列表 Slot；浏览器插件可以贡献面向具体场景的界面，而不必让每个场景各占一个导航入口。移除或停用贡献插件时，其应用也会消失。

## 目录

- [使用本包](#use-this-package)
- [理解实现](#understand-the-implementation)
- [进一步探索](#further-exploration)
- [模型体验](#model-experience)
- [已知限制与延期工作](#known-limitations-and-deferred-work)
- [开发备注](#dev-note)

-----

<a id="use-this-package"></a>
## 使用本包

默认 Web 组合已加载 Apps 外壳。可信的浏览器插件通过类型导入 Slot 约定并注册一个 `apps.item` 条目来贡献应用：

```tsx ignore-check
import type { AppItemProps } from '@deepseek-ai/dsh-client-ui-apps/client'
import type {} from '@deepseek-ai/dsh-client-ui-slots'

function PythonTutorApp(props: AppItemProps) {
  const { view } = props
  if (view === 'summary') return <>Practice Python with guided feedback.</>
  return <PythonTutor onDone={props.close} />
}

ctx.slots.inject('apps.item', () => ctx.slots.register({
  name: 'apps.item',
  id: 'python-tutor',
  order: 20,
  label: () => t('appName'),
}, PythonTutorApp))
```

`id` 是目录内的稳定标识，`order` 决定卡片位置，`label` 可以是跟随语言变化的 thunk。在 `summary` 视图中，应渲染简短且不可交互的卡片内容；卡片按钮和标题由外壳持有。在 `page` 视图中，应渲染完整场景界面，并在工作流需要返回目录时调用 `close()`。应用可以像其他客户端插件一样使用现有客户端服务、Remote、Session 与子 Slot。

-----

<a id="understand-the-implementation"></a>
## 理解实现

<details>
<summary>实现细节——点击展开</summary>

Apps 外壳注册一个 root 作用域的 `main` 面板和一个 `sidebar.panellist` 条目。主面板注册会声明 root 作用域的 `apps.item` 列表 Slot。一个跟随语言变化的 observable 把 Slot ledger 投影为目录 id 与标题；页面通过 `renderSlot(..., { only: id })` 渲染每个摘要，再经同一个 Slot 渲染选中条目的页面。Slot effect 提供卸载、HMR、排序、单元遮蔽与逐条目错误隔离。选中状态只属于已挂载页面；对应注册消失时，页面返回目录。

</details>

-----

<a id="further-exploration"></a>
## 进一步探索

- [ui-slots](../ui-slots/README.zh.md)——注册生命周期、列表排序与组件隔离。
- [ui-layout](../ui-layout/README.zh.md)——全局主面板导航。
- [ui-plugin-manager](../ui-plugin-manager/README.zh.md)——安装和启用能够贡献应用的 bundle。
- [场景应用决策](../../../.agents/notes/implemented/architecture/2026-09-20-scenario-apps-client-slot.zh.md)——应用为何共用一个外壳并沿用现有 Slot 系统。

-----

<a id="model-experience"></a>
## 模型体验

无。这个浏览器侧应用目录和 Slot 持有者不注册任何面向模型的内容。

#### KV Cache 影响

无；本包既不组装也不发送提供方请求。

## 已知限制与延期工作

<a id="known-limitations-and-deferred-work"></a>

- **仅限可信客户端代码**——应用是浏览器插件组件，不是任意 HTML 或远程脚本的沙箱。
- **选中状态是瞬时的**——刷新页面会返回目录；各应用自行持有所需的持久工作流状态。
- **尚无兼容桥**——若要原样运行 tclaw 风格的打包页面，需要另行设计 manifest、资源、权限与消息层。

<a id="dev-note"></a>
### 开发备注

<details>
<summary>维护者的工作上下文——点击展开</summary>

无。

</details>

**运行时不变式：** 不发布伴生入口。Apps 外壳只持有浏览器查看状态，Slot 生命周期行为由本包测试覆盖。
