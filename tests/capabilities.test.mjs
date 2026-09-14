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

test('首期 Bridge 和 VKUI 能力都已登记', () => {
  const capabilities = capabilityCategories.flatMap(({ capabilities: items }) => items);
  for (const method of ['VKWebAppGetUserInfo', 'VKWebAppInit', 'VKWebAppOpenExternalLink', 'VKWebAppShare', 'VKWebAppCopyText', 'VKWebAppGetUserFiles']) {
    const capability = capabilities.find((item) => item.bridgeMethod === method);
    assert.ok(capability, `${method} 未登记`);
    assert.equal(capability.requiresVk, true);
    assert.ok(capability.description);
  }
  for (const id of ['button', 'form-controls', 'feedback', 'content']) {
    const capability = capabilities.find((item) => item.id === id);
    assert.ok(capability, `${id} 未登记`);
    assert.ok(capability.demoId, `${id} 缺少组件演示标识`);
  }
});
