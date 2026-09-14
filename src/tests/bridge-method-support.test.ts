// @ts-expect-error 项目未安装 Node.js 类型声明，测试由 Node 直接执行。
import assert from 'node:assert/strict';
// @ts-expect-error 项目未安装 Node.js 类型声明，测试由 Node 直接执行。
import test from 'node:test';

import {
  getBridgeMethodSupportStatuses,
  type BridgeMethodSupportStatus,
} from '../bridge/bridge-method-support.ts';

test('支持检测将支持、不支持和异常分别映射为明确状态', async () => {
  const statuses = await getBridgeMethodSupportStatuses(
    ['VKWebAppInit', 'VKWebAppOpenCodeReader', 'VKWebAppStorageGet'],
    async (method) => {
      if (method === 'VKWebAppInit') {
        return true;
      }

      if (method === 'VKWebAppOpenCodeReader') {
        return false;
      }

      throw new Error('宿主未返回支持列表');
    },
  );

  assert.deepEqual(statuses, {
    VKWebAppInit: 'supported' satisfies BridgeMethodSupportStatus,
    VKWebAppOpenCodeReader: 'unsupported' satisfies BridgeMethodSupportStatus,
    VKWebAppStorageGet: 'unknown' satisfies BridgeMethodSupportStatus,
  });
});
