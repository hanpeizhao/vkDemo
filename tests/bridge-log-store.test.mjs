import test from 'node:test';
import assert from 'node:assert/strict';

import { createBridgeLogStore } from '../src/stores/bridge-log-store.ts';

test('方法日志记录成功、失败、超时和参数错误的原始结果契约', () => {
  const store = createBridgeLogStore();

  store.recordMethod({
    id: 'method-success',
    method: 'VKWebAppGetUserInfo',
    startedAt: 100,
    duration: 25,
    status: 'success',
    result: { email: 'person@example.com' },
  });
  store.recordMethod({
    id: 'method-timeout',
    method: 'VKWebAppCopyText',
    startedAt: 200,
    duration: 8_000,
    status: 'timeout',
    error: '调用超时',
  });
  store.recordMethod({
    id: 'method-params',
    method: 'VKWebAppStorageGet',
    startedAt: 300,
    duration: 0,
    status: 'error',
    error: '参数不是合法的 JSON。',
  });

  assert.deepEqual(store.entries, [
    {
      id: 'method-success',
      capabilityId: 'VKWebAppGetUserInfo',
      method: 'VKWebAppGetUserInfo',
      startedAt: 100,
      duration: 25,
      status: 'success',
      result: { email: 'person@example.com' },
    },
    {
      id: 'method-timeout',
      capabilityId: 'VKWebAppCopyText',
      method: 'VKWebAppCopyText',
      startedAt: 200,
      duration: 8_000,
      status: 'timeout',
      error: {
        message: '调用超时',
        suggestion: '请检查运行环境、权限和传入参数。',
      },
    },
    {
      id: 'method-params',
      capabilityId: 'VKWebAppStorageGet',
      method: 'VKWebAppStorageGet',
      startedAt: 300,
      duration: 0,
      status: 'error',
      error: {
        message: '参数不是合法的 JSON。',
        suggestion: '请检查运行环境、权限和传入参数。',
      },
    },
  ]);
});
