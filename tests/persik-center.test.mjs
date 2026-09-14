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
  assert.match(content, /persik-category-scroll/u);
  assert.match(content, /persik-method-summary/u);
});

test('Persik 将真实 Bridge send 和日志回调从 App 注入卡片', async () => {
  const app = await readFile('src/App.tsx', 'utf8');
  const persik = await readFile('src/panels/Persik.tsx', 'utf8');

  assert.match(app, /bridge\.send\(method as never, params as never\)/u);
  assert.match(app, /<Persik id="persik" send=\{sendBridgeMethod\}/u);
  assert.match(app, /onLog=\{handleBridgeMethodLog\}/u);
  assert.match(persik, /onLog=\{onLog\}/u);
});

test('App 通过 recordMethod 写入方法日志并保留执行器原始状态', async () => {
  const app = await readFile('src/App.tsx', 'utf8');

  assert.match(app, /^\s*status:\s*result\.status,$/mu);
  assert.match(app, /logStore\.recordMethod\(entry\)/u);
});

test('首页提供 Persik 入口，View 页面保持稳定 ID', async () => {
  const home = await readFile('src/panels/Home.tsx', 'utf8');
  const app = await readFile('src/App.tsx', 'utf8');

  assert.match(home, /routeNavigator\.push\('\/persik'\)/u);
  for (const panel of ['home', 'persik', 'logs']) {
    assert.match(app, new RegExp(`<[^>]+ id="${panel}"`, 'u'));
  }
  for (const panel of ['basic', 'bridge', 'components', 'layout']) {
    assert.doesNotMatch(app, new RegExp(`<[^>]+ id="${panel}"`, 'u'));
  }
});

test('日志页将状态映射为中文并显示时间、方法、耗时和原始结果', async () => {
  const logs = await readFile('src/panels/Logs.tsx', 'utf8');

  assert.match(logs, /new Date\(entry\.startedAt\)/u);
  assert.match(logs, /getLogMethod/u);
  assert.match(logs, /success:\s*'成功'/u);
  assert.match(logs, /error:\s*'失败'/u);
  assert.match(logs, /timeout:\s*'超时'/u);
  assert.match(logs, /getLogStatusLabel/u);
  assert.match(logs, /entry\.duration/u);
  assert.match(logs, /JSON\.stringify\(entry\.result/u);
  assert.match(logs, /entry\.error/u);
  assert.match(logs, /entry\.error\.message/u);
  assert.match(logs, /PanelHeaderBack/u);
  assert.match(logs, /routeNavigator\.back\(\)/u);
});

test('Bridge 方法卡片为移动端和长 JSON 结果提供稳定的响应式容器', async () => {
  const card = await readFile('src/components/BridgeMethodCard.tsx', 'utf8');
  const styles = await readFile('src/styles.css', 'utf8');

  assert.match(card, /bridge-method-card/u);
  assert.match(card, /bridge-method-result/u);
  assert.match(styles, /\.persik-category-scroll[\s\S]*overflow-x:\s*auto/u);
  assert.match(styles, /\.bridge-method-result[\s\S]*overflow-x:\s*auto/u);
  assert.match(styles, /overflow-wrap:\s*anywhere/u);
});
