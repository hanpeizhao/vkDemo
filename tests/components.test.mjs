import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

test('通用测试卡片包含运行、复制和环境提示文案', async () => {
  const content = await readFile('src/components/CapabilityCard.tsx', 'utf8');
  assert.match(content, /运行测试/u);
  assert.match(content, /复制结果/u);
  assert.match(content, /需要在 VK 环境中运行/u);
});

test('组件测试不直接使用已弃用的布局组件', async () => {
  const files = ['src/components/CapabilityCard.tsx', 'src/components/CapabilityResult.tsx', 'src/components/StatusBadge.tsx'];
  for (const file of files) {
    const content = await readFile(file, 'utf8');
    assert.doesNotMatch(content, /\bDiv\b|\bFixedLayout\b/u, `${file} 不应使用已弃用组件`);
  }
});

test('应用路由包含五个分类页和日志页', async () => {
  const content = await readFile('src/routes.ts', 'utf8');
  for (const path of ['/category/basic', '/category/bridge', '/category/components', '/category/layout', '/logs']) {
    assert.match(content, new RegExp(path.replaceAll('/', '\\/'), 'u'));
  }
});

test('首页展示能力实验室分类', async () => {
  const content = await readFile('src/panels/Home.tsx', 'utf8');
  assert.match(content, /能力实验室/u);
  assert.match(content, /基础信息/u);
  assert.match(content, /capabilityCategories/u);
  const categories = await readFile('src/data/capabilities.ts', 'utf8');
  assert.match(categories, /VKUI 组件/u);
});

test('VK Bridge 初始化调用处理失败 Promise', async () => {
  const content = await readFile('src/main.tsx', 'utf8');
  assert.match(content, /VKWebAppInit/u);
  assert.match(content, /catch/u);
});
