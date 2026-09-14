import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

test('首页分类入口使用已注册的完整路由路径', async () => {
  const content = await readFile('src/panels/Home.tsx', 'utf8');
  assert.match(content, /routeNavigator\.push\(`\/category\/\$\{category\.id\}`\)/u);
  assert.match(content, /routeNavigator\.push\('\/logs'\)/u);
});
