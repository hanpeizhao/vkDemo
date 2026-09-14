# VK Bridge 方法测试中心 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 将 Persik 页面改造成 VK Bridge 方法测试中心，按能力分类展示官方方法，提供参数编辑、调用、结果、错误、耗时和调试日志，并让无法在当前容器运行的方法以清晰状态呈现。

**Architecture:** 使用独立的官方方法注册表驱动分类和页面；使用纯函数负责 JSON 参数解析、方法调用超时和结果归一化；使用受类型约束的 Bridge 适配层调用 VK Bridge。Persik 负责展示和交互，调试日志页面负责查看当前会话记录。

**Tech Stack:** React 18、TypeScript、VKUI、VK Bridge、Vite、Node test runner。

**Spec:** `docs/superpowers/specs/2026-09-14-vk-bridge-method-center-design.md`

## Global Constraints

- 所有新增用户界面文字、代码注释和测试描述使用中文。
- 不把 `VKWebAppCallAPIMethod`、支付、订阅、通话、敏感权限等方法误标为“无需授权”或“可安全自动执行”。
- 未在 VK 环境中运行的方法必须显示为“需要 VK 环境”或“需要用户操作”，不能伪造成功结果。
- 参数输入必须拒绝非法 JSON，并在调用前显示可读的中文错误。
- Bridge 调用必须有超时，避免页面出现无法操作的无限加载状态。
- 不修改用户现有的依赖版本，不提交构建产物、环境变量和 `node_modules`。

## Task 1: 建立官方 Bridge 方法注册表与分类数据

**Files:**
- Create: `src/data/bridge-methods.ts`
- Create: `src/tests/bridge-methods.test.ts`
- Modify: `src/data/capabilities.ts` only if shared types or labels need extraction

- [ ] 从官方 Bridge 总览整理全部方法名，建立不可变的 `BridgeMethod` 类型，至少包含 `name`、`title`、`categoryId`、`description`、`risk`、`availability`、`defaultParams` 和 `requiresParams`。
- [ ] 建立十个分类：基础与环境、用户与权限、社交与导航、存储与安全、文件与媒体、设备能力、广告支付与订阅、通话与实时通信、界面与窗口、数据统计。
- [ ] 将方法按语义归类，并区分“可直接调用”“需要参数”“需要用户操作”“需要特定 VK 容器”。
- [ ] 为高风险或副作用方法提供保守的默认参数与明确警示；对没有稳定安全默认值的方法使用空参数并要求用户编辑。
- [x] 仅保留 Bridge 方法测试中心和调试日志两个入口，移除旧能力分类页面。
- [ ] 测试分类 ID 唯一、方法名唯一、每个方法都有分类和中文说明，并覆盖首批代表性方法，例如 `VKWebAppInit`、`VKWebAppGetUserInfo`、`VKWebAppStorageGet`、`VKWebAppCopyText` 和 `VKWebAppShowBannerAd`。

验证命令：

```text
node --experimental-strip-types --test src/tests/bridge-methods.test.ts
```

## Task 2: 实现参数解析、调用和超时执行器

**Files:**
- Create: `src/bridge/bridge-method-runner.ts`
- Create: `src/tests/bridge-method-runner.test.ts`

- [ ] 实现 `parseBridgeParams(text)`：空文本解析为 `{}`；非法 JSON 返回中文错误；只接受 JSON 对象，数组、字符串、数字和 `null` 返回参数格式错误。
- [x] 不对 Bridge 返回结果做脱敏，保留完整字段和值供调试查看。
- [ ] 实现 `runBridgeMethod({ method, params, send, timeoutMs })`：记录开始时间，调用 `send(method, params)`，统一返回 success/error/timeout 状态、耗时和原始结果。
- [ ] 使用可取消的超时竞争，确保 Bridge 永不返回时 UI 也能结束加载；超时错误必须是中文且包含方法名。
- [ ] 将异常、Bridge reject、非对象结果统一转为可展示的错误信息，保留原始错误类型供日志判断。
- [ ] 测试成功、拒绝、非法参数、超时和耗时字段；测试不得依赖真实 VK 容器。

验证命令：

```text
node --experimental-strip-types --test src/tests/bridge-method-runner.test.ts
```

## Task 3: 实现 Bridge 方法卡片组件

**Files:**
- Create: `src/components/BridgeMethodCard.tsx`
- Create: `src/tests/bridge-method-card.test.tsx`
- Modify: `src/components/StatusBadge.tsx` if status labels need to be shared

- [ ] 使用 VKUI 组件实现方法卡片：分类标签、方法名、中文说明、风险/环境提示、JSON 参数编辑框、调用按钮、加载状态和结果区域。
- [ ] 参数编辑框显示格式化后的默认 JSON，并在调用前执行解析；参数错误只显示在当前卡片，不影响其他方法。
- [ ] 调用期间禁用当前按钮并显示明确的加载反馈；超时或异常后恢复可操作状态。
- [ ] 成功结果展示原始 JSON；错误展示中文错误、Bridge 方法名和耗时；无法在普通浏览器执行的方法给出“请在 VK Mini App 环境中测试”。
- [ ] 通过 props 注入 `send` 和日志回调，组件测试使用 fake Bridge，不直接依赖全局 `window.vkBridge`。
- [ ] 测试渲染、参数校验、成功结果、失败结果、按钮禁用和错误后恢复。

验证命令：

```text
yarn test
```

## Task 4: 将 Persik 改造成方法测试中心并接入路由

**Files:**
- Modify: `src/panels/Persik.tsx`
- Modify: `src/App.tsx`
- Modify: `src/routes.ts`
- Modify: `src/panels/Home.tsx`
- Modify: `src/panels/Logs.tsx`
- Create or modify: relevant route and panel tests

- [ ] Persik 页面保留现有返回导航，但主体改为“VK Bridge 方法测试中心”，显示当前环境提示、方法总数和使用说明。
- [ ] 按十个分类渲染分类导航；点击分类只筛选当前页面方法，或者通过稳定 URL 参数/路由进入分类，不能依赖 React Fragment 作为 `View` 直接子节点。
- [ ] 在 Persik 页面调用 `BridgeMethodCard`，注入真实 `bridge.send`、全局超时和日志写入函数。
- [ ] 对 `VKWebAppInit`、用户信息、复制文本、存储、分享、打开链接等首批方法提供可直接测试的入口；需要用户操作的方法必须保留确认提示。
- [ ] 将成功、失败、超时、参数错误写入现有日志存储；Logs 页面显示时间、方法名、状态、耗时和原始结果。
- [ ] 从首页增加或调整进入测试中心的入口，并保证现有能力分类页、日志页、返回按钮和页面直达 URL 正常。
- [ ] 测试 `View` 的每个子页面有稳定 `id`，分类跳转使用路径而不是 panel ID，测试中心路径可直接打开。

验证命令：

```text
yarn test
```

## Task 5: 完成官方方法覆盖与展示策略

**Files:**
- Modify: `src/data/bridge-methods.ts`
- Modify: `src/panels/Persik.tsx` and `src/components/BridgeMethodCard.tsx` as needed
- Modify: `README.md`
- Modify: tests for registry coverage and UI filtering

- [ ] 将官方总览中提取的全部 Bridge 方法登记到注册表；同一方法不能因为不同分类重复登记。
- [ ] 对 `VKWebAppGet*`、权限、社交、存储、安全、设备传感器、广告支付、通话、界面、统计等方法补充中文说明和限制提示。
- [ ] 对需要复杂对象、文件、回调或真实用户操作的方法提供示例参数、字段说明或“手动编辑参数”的提示，而不是伪造成功按钮。
- [ ] 对已废弃或容器差异明显的方法标记兼容性风险，并在 README 中说明普通浏览器和 VK Mini App 的差别。
- [ ] 增加覆盖率测试：官方方法清单中的每个方法都能从某个分类筛选到，并具有风险和可用性标记。

验证命令：

```text
yarn test
yarn build
```

## Task 6: 最终验证与交付检查

- [ ] 运行 `yarn test`，确认所有测试通过。
- [ ] 运行 `yarn build`，确认 TypeScript 和 Vite 构建通过；仅允许已有的 chunk 体积提示，不将其当作失败。
- [ ] 运行 `yarn lint` 或项目中实际配置的 ESLint 命令，确认无新增 lint 错误。
- [ ] 运行 `git diff --check`，确认无空白错误。
- [ ] 检查 `git status --short`，确认未生成 `dist`、`build`、`.env`、日志临时文件或 `node_modules` 变更。
- [ ] 手动检查：普通浏览器加载不无限转圈；Bridge 未返回时能在超时后恢复；VK 容器中可看到真实结果；日志中显示返回结果的完整字段和值。
- [ ] 在交付说明中列出修改文件、验证命令及普通浏览器与 VK 环境的能力差异。

## Review Checklist

- [ ] 所有官方方法均可从注册表驱动，不在 JSX 中手写第二份方法列表。
- [ ] 所有 View 页面都有稳定的 `id` 或 `nav`，没有将 Fragment 直接作为 View 子节点。
- [ ] 所有 Bridge 调用都有错误处理和超时，不能留下永久 loading。
- [ ] 所有用户可见文本和新增注释都是中文。
- [ ] 敏感结果不会原样写入日志。
- [x] Bridge 方法测试中心和调试日志页面完成中文本地化。
