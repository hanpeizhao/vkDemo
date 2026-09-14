import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

test('View 的页面必须作为带 id 的直接子节点渲染', async () => {
  const content = await readFile('src/App.tsx', 'utf8');
  assert.doesNotMatch(content, /<Fragment>/u);
});
