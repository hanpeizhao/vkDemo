# VK 能力实验室 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 将当前 VK 小程序示例扩展为按分类测试 VK Bridge、VKUI、布局与导航能力的中文实验室。

**Architecture:** 使用分类与能力注册表驱动页面，分类页复用通用能力卡片；Bridge 调用通过统一执行器处理 loading、错误和日志，组件测试通过演示内容呈现。路由只包含首页、分类页和日志页，不为每个测试项创建独立路由。

**Tech Stack:** React 18、TypeScript、VKUI 8、VK Bridge、VK Miniapps Router、Node 内置测试运行器。

**Spec:** `docs/superpowers/specs/2026-09-14-vk-capability-lab-design.md`

## Global Constraints

- 所有用户可见文案和新增注释使用简体中文。
- 使用 VKUI v8 推荐的 `Box`，不再新增 `Div`。
- 项目侧的 `PanelHeader` 使用 `fixed={false}`，避免触发 VKUI v8 内部的 `FixedLayout` 弃用路径。
- Bridge 调用无论成功、失败还是异常，都必须释放当前测试的 loading 状态。
- 需要 VK 容器的能力在普通浏览器中必须显示可理解的环境提示，不能无限等待。
- 日志仅保存当前页面会话，刷新后清空。
- 每个任务都先写失败测试，再写最小实现，并运行 TypeScript、ESLint 和构建验证。

---

### Task 1: 建立能力模型与分类注册表

**Files:**
- Create: `src/data/capabilities.ts`
- Create: `tests/capabilities.test.mjs`
- Modify: `tests/language.test.mjs`
- Modify: `package.json`

**Interfaces:**
- Produces `CapabilityCategory`, `Capability`, `CapabilityType`, `capabilityCategories` and `findCapabilityCategory(categoryId)` for later pages.
- `Capability` includes `id`, `title`, `description`, `type`, optional `requiresVk`, optional `run`, and optional `demo: ReactNode`.

- [ ] **Step 1: Write the failing test**

```js
import test from 'node:test';
import assert from 'node:assert/strict';
import { capabilityCategories, findCapabilityCategory } from '../src/data/capabilities.ts';

test('分类注册表包含五个首期分类', () => {
  assert.deepEqual(
    capabilityCategories.map(({ id }) => id),
    ['basic', 'bridge', 'components', 'layout', 'logs'],
  );
});

test('分类可以通过 id 查询并包含唯一能力 id', () => {
  const category = findCapabilityCategory('bridge');
  assert.equal(category?.title, 'VK Bridge');
  const ids = capabilityCategories.flatMap(({ capabilities }) => capabilities.map(({ id }) => id));
  assert.equal(new Set(ids).size, ids.length);
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `node --experimental-strip-types tests/capabilities.test.mjs`

Expected: FAIL because `src/data/capabilities.ts` and the exported registry do not exist.

- [ ] **Step 3: Write minimal implementation**

Create the typed registry with the five categories and首期 capability metadata. Keep Bridge `run` functions small and defer common execution behavior to Task 2. Add a `test` script to `package.json`:

```json
"test": "node --experimental-strip-types --test tests/*.test.mjs"
```

Keep existing dependency names and API identifiers unchanged. Extend `tests/language.test.mjs` so all new visible titles, descriptions and comments are checked for absence of Cyrillic characters.

- [ ] **Step 4: Run test to verify it passes**

Run: `yarn test`

Expected: PASS for registry and language checks.

- [ ] **Step 5: Commit**

```bash
git add src/data/capabilities.ts tests/capabilities.test.mjs tests/language.test.mjs package.json
git commit -m "feat: 添加 VK 能力分类注册表"
```

### Task 2: 实现 Bridge 执行器和会话日志

**Files:**
- Create: `src/bridge/capability-runner.ts`
- Create: `src/stores/bridge-log-store.ts`
- Create: `tests/capability-runner.test.mjs`

**Interfaces:**
- `runCapability<T>(capabilityId: string, operation: () => Promise<T>, onLog: (entry: BridgeLog) => void): Promise<CapabilityRunResult<T>>`
- `formatBridgeError(error: unknown): { code?: string; message: string; suggestion: string }`
- `BridgeLog` follows the shape in the design spec.
- `createBridgeLogStore()` returns `{ entries, add, update, clear }` and keeps entries in memory only.

- [ ] **Step 1: Write the failing test**

```js
test('Bridge 调用成功时记录耗时和结果，并结束 running 状态', async () => {
  const logs = [];
  const result = await runCapability('get-user', async () => ({ id: 1 }), (entry) => logs.push(entry));
  assert.deepEqual(result, { status: 'success', value: { id: 1 } });
  assert.equal(logs[0].status, 'running');
  assert.equal(logs.at(-1).status, 'success');
  assert.deepEqual(logs.at(-1).result, { id: 1 });
});

test('Bridge 调用失败时返回中文提示并结束 error 状态', async () => {
  const logs = [];
  const result = await runCapability('open-link', async () => {
    throw { code: 'WebAppNotAllowed', error_data: '需要在 VK 容器中运行' };
  }, (entry) => logs.push(entry));
  assert.equal(result.status, 'error');
  assert.match(result.error.message, /VK/u);
  assert.equal(logs.at(-1).status, 'error');
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `node --experimental-strip-types tests/capability-runner.test.mjs`

Expected: FAIL because the runner and log store do not exist.

- [ ] **Step 3: Write minimal implementation**

Implement the runner with `try/catch/finally` semantics: emit a running entry, resolve success or normalized error, and ensure callers can always clear local loading. Treat missing VK Bridge response as an error result rather than an unresolved UI state. Implement the in-memory store with immutable updates and a `clear` method.

- [ ] **Step 4: Run test to verify it passes**

Run: `yarn test`

Expected: PASS for success, failure, error normalization and log-store behavior.

- [ ] **Step 5: Commit**

```bash
git add src/bridge/capability-runner.ts src/stores/bridge-log-store.ts tests/capability-runner.test.mjs
git commit -m "feat: 添加能力执行器和调试日志"
```

### Task 3: 添加通用测试卡片和结果展示

**Files:**
- Create: `src/components/CapabilityCard.tsx`
- Create: `src/components/CapabilityResult.tsx`
- Create: `src/components/StatusBadge.tsx`
- Create: `tests/components.test.mjs`

**Interfaces:**
- `CapabilityCard` accepts `{ capability, onRun }` and owns only the selected card's running state.
- `CapabilityResult` accepts `{ result }` and renders success, error, or empty state.
- `StatusBadge` accepts `status: 'idle' | 'running' | 'success' | 'error'`.

- [ ] **Step 1: Write the failing test**

Add source-level contract tests for the component API and visible states. Assert that the card exposes “运行测试”, “复制结果”, “成功”, “失败” and “需要在 VK 环境中运行” strings, and that no component imports `Div` or `FixedLayout`.

- [ ] **Step 2: Run test to verify it fails**

Run: `node --experimental-strip-types tests/components.test.mjs`

Expected: FAIL because the component files do not exist.

- [ ] **Step 3: Write minimal implementation**

Use VKUI `Card`, `Group`, `Header`, `Button`, `Text`, `Code`/`Paragraph`, `Spinner`, `Snackbar` and `Box`. Render formatted JSON with `JSON.stringify(value, null, 2)`. Use the Clipboard API for copying and show a short success message. Pass `requiresVk` through to a visible environment hint. Use `PanelHeader fixed={false}` wherever a header is introduced.

- [ ] **Step 4: Run test to verify it passes**

Run: `yarn test` and `.\\node_modules\\.bin\\tsc.cmd`

Expected: PASS and no TypeScript errors.

- [ ] **Step 5: Commit**

```bash
git add src/components tests/components.test.mjs
git commit -m "feat: 添加能力测试卡片"
```

### Task 4: 添加首页、分类页和日志页

**Files:**
- Create: `src/panels/Category.tsx`
- Create: `src/panels/Logs.tsx`
- Modify: `src/panels/Home.tsx`
- Modify: `src/panels/Persik.tsx`
- Modify: `src/panels/index.ts`
- Modify: `src/App.tsx`
- Modify: `src/routes.ts`

**Interfaces:**
- `Category` reads the category id from the active route, finds it through `findCapabilityCategory`, and renders `CapabilityCard` for each capability.
- `Logs` receives the session log store and renders clearable entries.
- `Home` renders category cells and navigates to `/category/:categoryId` using the existing route navigator.

- [ ] **Step 1: Write the failing test**

Extend route and panel contract tests to require routes for `/category/basic`, `/category/bridge`, `/category/components`, `/category/layout`, and `/logs`, and require Home to render category titles instead of the old Persik-only navigation.

- [ ] **Step 2: Run test to verify it fails**

Run: `node --experimental-strip-types tests/components.test.mjs`

Expected: FAIL because the category and log panels/routes do not exist.

- [ ] **Step 3: Write minimal implementation**

Replace the old Home navigation block with category entries and a log entry. Keep the fetched user section under “基础信息” or show a safe error state when Bridge is unavailable. Add route constants for the category and logs panels, pass the active category id through route params or a route-derived lookup, and keep `Persik` only as a small existing demo if it remains useful. Set both existing headers to `fixed={false}`.

In `App.tsx`, replace the global `ScreenSpinner` lifecycle with per-capability state. The initial user-info request must use a bounded error path and clear its loading state in `finally`.

- [ ] **Step 4: Run test to verify it passes**

Run: `yarn test`, `.\\node_modules\\.bin\\tsc.cmd`, and `.\\node_modules\\.bin\\eslint.cmd . --ext ts,tsx --report-unused-disable-directives --max-warnings 0`

Expected: PASS with no deprecated `Div`/direct `FixedLayout` usage in project source.

- [ ] **Step 5: Commit**

```bash
git add src/App.tsx src/routes.ts src/panels src/components tests
git commit -m "feat: 添加 VK 能力分类页面"
```

### Task 5: 接入首期真实测试并完成验证

**Files:**
- Modify: `src/data/capabilities.ts`
- Modify: `src/bridge/capability-runner.ts`
- Modify: `src/components/CapabilityCard.tsx`
- Modify: `README.md`
- Modify: `tests/capabilities.test.mjs`

**Interfaces:**
- Bridge capability runners call `bridge.send` only through the common runner.
- Component demos remain local and do not require VK permissions.

- [ ] **Step 1: Write the failing test**

Require registry entries for the agreed首期 API names and component names, and require every VK-dependent entry to include `requiresVk: true` plus a non-empty description.

- [ ] **Step 2: Run test to verify it fails**

Run: `yarn test`

Expected: FAIL for any missing capability metadata.

- [ ] **Step 3: Write minimal implementation**

Add safe runners for `VKWebAppGetUserInfo`, `VKWebAppInit`, `VKWebAppOpenExternalLink`, `VKWebAppShare`, `VKWebAppCopyText`, `VKWebAppGetUserFiles` and event sending, using explicit parameters where the API requires them. Add local demos for the agreed VKUI components. Document the new laboratory pages and the requirement to open Bridge tests inside VK.

- [ ] **Step 4: Run full verification**

Run:

```bash
yarn test
.\\node_modules\\.bin\\tsc.cmd
.\\node_modules\\.bin\\eslint.cmd . --ext ts,tsx --report-unused-disable-directives --max-warnings 0
.\\node_modules\\.bin\\vite.cmd build
```

Expected: all commands exit 0. A Vite chunk-size warning may remain informational; it is not a test failure.

- [ ] **Step 5: Commit**

```bash
git add src README.md tests
git commit -m "feat: 接入 VK 首期能力测试"
```
