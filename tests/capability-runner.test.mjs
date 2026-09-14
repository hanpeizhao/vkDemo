import test from 'node:test';
import assert from 'node:assert/strict';
import { formatBridgeError, runCapability } from '../src/bridge/capability-runner.ts';
import { createBridgeLogStore } from '../src/stores/bridge-log-store.ts';

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

test('日志存储支持追加、更新和清空', () => {
  const store = createBridgeLogStore();
  store.add({ id: '1', capabilityId: 'test', status: 'running', startedAt: 1, duration: 0 });
  store.update('1', { status: 'success', duration: 2 });
  assert.equal(store.entries[0].status, 'success');
  store.clear();
  assert.deepEqual(store.entries, []);
});

test('未知错误也会转换成可展示的中文信息', () => {
  const error = formatBridgeError(new Error('network failed'));
  assert.match(error.message, /network failed/u);
  assert.ok(error.suggestion);
});
