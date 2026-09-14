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
