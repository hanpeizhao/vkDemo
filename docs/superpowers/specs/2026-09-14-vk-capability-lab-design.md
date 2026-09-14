# VK 能力实验室设计

## 目标

将当前 VK 小程序示例扩展为面向中国开发者的 VK 功能与组件测试 Demo。用户可以按分类浏览能力，运行测试，查看成功结果或错误信息，并通过日志了解调用耗时和当前环境。

## 范围

首期包含以下分类：

- 基础信息
- VK Bridge
- VKUI 组件
- 布局与导航
- 调试日志

首期优先实现稳定、容易验证的能力。需要特殊权限或特定 VK 容器环境的能力必须明确标注运行条件。

## 页面结构

```text
首页
├── 基础信息
├── VK Bridge
├── VKUI 组件
├── 布局与导航
└── 调试日志
```

首页负责展示分类入口和测试数量。分类页负责展示测试项。测试项使用通用测试卡片呈现说明、运行按钮、参数、状态和结果。每个测试项不单独建立路由，避免路由数量随能力增长而失控。

## 能力模型

```ts
type CapabilityCategory = {
  id: string;
  title: string;
  description: string;
  icon: ReactNode;
  capabilities: Capability[];
};

type Capability = {
  id: string;
  title: string;
  description: string;
  type: 'bridge' | 'component' | 'navigation';
  run?: () => Promise<unknown>;
};
```

Bridge 测试通过 `run` 执行真实调用；组件测试通过 `demo` 内容展示真实可交互组件；导航测试执行路由操作并反馈结果。新增能力时优先增加注册数据和测试函数，不复制页面布局代码。

## 首期能力

基础信息包括获取用户信息、读取启动参数、识别平台、展示主题与安全区域、展示路由和适配状态。

VK Bridge 包括初始化、打开链接、分享、复制文本、选择图片以及发送事件。具体调用必须遵循 VK Bridge 当前 API 支持和运行环境限制。

VKUI 组件包括 Button、Input、Select、Checkbox、Modal、Snackbar、Tabs、Card、Avatar、Spinner 和 Placeholder，并展示加载、交互、主题和响应式效果。

布局与导航包括页面跳转、返回、回到首页、响应式布局、`PanelHeader fixed={false}` 以及 `Box` 布局属性。

## 结果与日志

```ts
type BridgeLog = {
  id: string;
  capabilityId: string;
  startedAt: number;
  duration: number;
  status: 'running' | 'success' | 'error';
  result?: unknown;
  error?: {
    code?: string;
    message: string;
  };
};
```

测试执行器必须在开始时记录 `running`，在成功或失败时记录结果，并在 `finally` 中释放当前测试的 loading 状态。单个测试的加载状态只影响该测试卡片，不遮挡整个应用。结果支持格式化 JSON 和复制。

需要 VK 容器的能力在普通浏览器中失败时，显示运行环境提示、错误码和建议，不允许无限等待。日志只保存在当前页面会话中，刷新后清空。

## 路由与组件边界

- `routes.ts`：维护首页、分类页和日志页路由。
- `src/data/`：维护分类与能力注册数据。
- `src/bridge/`：封装 Bridge 调用和统一执行器。
- `src/components/`：提供能力卡片、结果展示和状态标记。
- `src/panels/`：负责首页、分类页和日志页的页面组合。

页面只负责组合数据和组件，不直接处理重复的 Bridge 错误转换或日志写入。

## 兼容性与错误处理

- 使用 VKUI v8 推荐的 `Box`，不再新增 `Div`。
- 项目侧的 `PanelHeader` 使用 `fixed={false}`，避免触发 VKUI v8 内部的 `FixedLayout` 弃用路径。
- Bridge 调用统一捕获异常，并区分未在 VK 容器、权限拒绝、参数错误和未知错误。
- 所有异步测试都必须有结束路径，成功、失败和异常都不能留下全局遮罩。

## 验证

- 为能力注册表、执行器和错误转换添加单元测试。
- 为关键路由和页面状态添加组件测试。
- 使用真实构建验证 TypeScript、ESLint 和 Vite 打包。
- 检查普通浏览器环境下 Bridge 失败时页面仍可操作。
