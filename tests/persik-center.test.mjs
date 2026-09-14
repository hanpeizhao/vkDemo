import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

test('Persik 测试中心以注册表渲染分类筛选、方法卡片和容器提示', async () => {
  const content = await readFile('src/panels/Persik.tsx', 'utf8');

  assert.match(content, /VK Bridge 方法测试中心/u);
  assert.match(content, /bridgeMethodCategories\.map/u);
  assert.match(content, /bridgeMethods\.filter/u);
  assert.match(content, /<BridgeMethodCard/u);
  assert.match(content, /需要用户操作/u);
  assert.match(content, /VK Mini App/u);
});

test('Persik 将真实 Bridge send 和日志回调从 App 注入卡片', async () => {
  const app = await readFile('src/App.tsx', 'utf8');
  const persik = await readFile('src/panels/Persik.tsx', 'utf8');

  assert.match(app, /bridge\.send\(method as never, params as never\)/u);
  assert.match(app, /<Persik id="persik" send=\{sendBridgeMethod\}/u);
  assert.match(app, /onLog=\{handleBridgeMethodLog\}/u);
  assert.match(persik, /onLog=\{onLog\}/u);
});

test('首页提供 Persik 入口，View 页面保持稳定 ID', async () => {
  const home = await readFile('src/panels/Home.tsx', 'utf8');
  const app = await readFile('src/App.tsx', 'utf8');

  assert.match(home, /routeNavigator\.push\('\/persik'\)/u);
  for (const panel of ['home', 'persik', 'basic', 'bridge', 'components', 'layout', 'logs']) {
    assert.match(app, new RegExp(`<[^>]+ id="${panel}"`, 'u'));
  }
});

test('日志页显示时间、方法、状态、耗时和脱敏结果', async () => {
  const logs = await readFile('src/panels/Logs.tsx', 'utf8');

  assert.match(logs, /new Date\(entry\.startedAt\)/u);
  assert.match(logs, /getLogMethod/u);
  assert.match(logs, /entry\.status/u);
  assert.match(logs, /entry\.duration/u);
  assert.match(logs, /JSON\.stringify\(entry\.result/u);
});
