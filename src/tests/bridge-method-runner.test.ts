// @ts-expect-error 项目未安装 Node.js 类型声明，测试由 Node 直接执行。
import assert from 'node:assert/strict';
// @ts-expect-error 项目未安装 Node.js 类型声明，测试由 Node 直接执行。
import test from 'node:test';

import {
  parseBridgeParams,
  runBridgeMethod,
} from '../bridge/bridge-method-runner.ts';

test('参数解析以 ok 字段判别结果，并接受含 error 字段的合法参数对象', () => {
  assert.deepEqual(parseBridgeParams('{"error": "这是合法参数"}'), {
    ok: true,
    params: { error: '这是合法参数' },
  });
  assert.deepEqual(parseBridgeParams('{'), {
    ok: false,
    error: '参数不是合法的 JSON。',
  });
});

test('空文本和 JSON 对象会解析为可调用参数', () => {
  assert.deepEqual(parseBridgeParams('  \n '), { ok: true, params: {} });
  assert.deepEqual(parseBridgeParams('{"group_id": 42, "enabled": true}'), {
    ok: true,
    params: {
      group_id: 42,
      enabled: true,
    },
  });
});

test('非法 JSON 与非对象参数返回可展示的中文错误', () => {
  assert.deepEqual(parseBridgeParams('{'), { ok: false, error: '参数不是合法的 JSON。' });

  for (const text of ['[]', '"文本"', '42', 'null']) {
    assert.deepEqual(parseBridgeParams(text), {
      ok: false,
      error: '参数格式错误：仅支持 JSON 对象。',
    });
  }
});

test('成功调用保留原始返回结果、状态和耗时', async () => {
  let receivedMethod = '';
  let receivedParams: Record<string, unknown> = {};

  const result = await runBridgeMethod({
    method: 'VKWebAppGetUserInfo',
    params: { fields: 'email' },
    send: async (method, params) => {
      receivedMethod = method;
      receivedParams = params;
      return { id: 7, email: 'person@example.com' };
    },
    timeoutMs: 100,
  });

  assert.equal(receivedMethod, 'VKWebAppGetUserInfo');
  assert.deepEqual(receivedParams, { fields: 'email' });
  assert.equal(result.status, 'success');
  assert.deepEqual(result.result, { id: 7, email: 'person@example.com' });
  assert.equal(typeof result.durationMs, 'number');
  assert.ok(result.durationMs >= 0);
});

test('被拒绝的调用返回中文错误和原始错误类型', async () => {
  const result = await runBridgeMethod({
    method: 'VKWebAppGetUserInfo',
    params: {},
    send: async () => {
      throw new TypeError('容器拒绝调用');
    },
    timeoutMs: 100,
  });

  assert.deepEqual(result.status, 'error');
  assert.equal(result.error, '调用 VKWebAppGetUserInfo 失败：容器拒绝调用');
  assert.equal(result.errorType, 'TypeError');
  assert.equal(typeof result.durationMs, 'number');
});

test('VK Bridge 错误对象会保留错误类型和具体错误信息', async () => {
  const result = await runBridgeMethod({
    method: 'VKWebAppStorageGet',
    params: { key: 'demo' },
    send: async () => {
      throw {
        error_type: 'storage_error',
        error_data: '存储权限未开启',
      };
    },
    timeoutMs: 100,
  });

  assert.equal(result.status, 'error');
  assert.equal(result.error, '调用 VKWebAppStorageGet 失败：存储权限未开启');
  assert.equal(result.errorType, 'storage_error');
});

test('非对象调用结果返回可展示的中文错误', async () => {
  const result = await runBridgeMethod({
    method: 'VKWebAppGetUserInfo',
    params: {},
    send: async () => ['不是对象'],
    timeoutMs: 100,
  });

  assert.equal(result.status, 'error');
  assert.equal(result.error, '调用 VKWebAppGetUserInfo 返回了非对象结果。');
  assert.equal(result.errorType, 'array');
});

test('超时调用会结束并返回含方法名的中文错误', async () => {
  const result = await runBridgeMethod({
    method: 'VKWebAppGetUserInfo',
    params: {},
    send: () => new Promise<never>(() => undefined),
    timeoutMs: 15,
  });

  assert.equal(result.status, 'timeout');
  assert.equal(result.error, '调用 VKWebAppGetUserInfo 超时，请检查 VK 环境后重试。');
  assert.equal(result.errorType, 'TimeoutError');
  assert.ok(result.durationMs >= 10);
});
