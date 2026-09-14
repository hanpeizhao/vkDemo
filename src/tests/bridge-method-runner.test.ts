// @ts-expect-error 项目未安装 Node.js 类型声明，测试由 Node 直接执行。
import assert from 'node:assert/strict';
// @ts-expect-error 项目未安装 Node.js 类型声明，测试由 Node 直接执行。
import test from 'node:test';

import {
  parseBridgeParams,
  runBridgeMethod,
  sanitizeBridgeValue,
} from '../bridge/bridge-method-runner.ts';

test('空文本和 JSON 对象会解析为可调用参数', () => {
  assert.deepEqual(parseBridgeParams('  \n '), {});
  assert.deepEqual(parseBridgeParams('{"group_id": 42, "enabled": true}'), {
    group_id: 42,
    enabled: true,
  });
});

test('非法 JSON 与非对象参数返回可展示的中文错误', () => {
  assert.deepEqual(parseBridgeParams('{'), { error: '参数不是合法的 JSON。' });

  for (const text of ['[]', '"文本"', '42', 'null']) {
    assert.deepEqual(parseBridgeParams(text), {
      error: '参数格式错误：仅支持 JSON 对象。',
    });
  }
});

test('递归脱敏嵌套对象和数组中的敏感字段并保留结构', () => {
  assert.deepEqual(
    sanitizeBridgeValue({
      user: {
        access_token: 'token-value',
        contacts: [{ phone: '+79990001122', email: 'person@example.com' }],
      },
      response_hash: 'hash-value',
      visible: '保留此字段',
    }),
    {
      user: {
        access_token: '[已脱敏]',
        contacts: [{ phone: '[已脱敏]', email: '[已脱敏]' }],
      },
      response_hash: '[已脱敏]',
      visible: '保留此字段',
    },
  );
});

test('成功调用返回脱敏结果、状态和耗时', async () => {
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
  assert.deepEqual(result.result, { id: 7, email: '[已脱敏]' });
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
  assert.equal(result.error, '调用 VKWebAppGetUserInfo 失败，请检查 VK 环境或参数。');
  assert.equal(result.errorType, 'TypeError');
  assert.equal(typeof result.durationMs, 'number');
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
