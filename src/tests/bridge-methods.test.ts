// @ts-expect-error 项目未安装 Node.js 类型声明，测试由 Node 运行时直接执行。
import assert from 'node:assert/strict';
// @ts-expect-error 项目未安装 Node.js 类型声明，测试由 Node 运行时直接执行。
import test from 'node:test';

import {
  bridgeMethodCategories,
  bridgeMethods,
  getBridgeMethodsByCategory,
} from '../data/bridge-methods.ts';

test('分类 ID 唯一且覆盖十个能力领域', () => {
  assert.equal(bridgeMethodCategories.length, 10);
  assert.equal(new Set(bridgeMethodCategories.map((category) => category.id)).size, 10);
  assert.deepEqual(
    bridgeMethodCategories.map((category) => category.id),
    [
      'basic-environment',
      'users-permissions',
      'social-navigation',
      'storage-security',
      'files-media',
      'device-capabilities',
      'ads-payments-subscriptions',
      'calls-realtime',
      'interface-window',
      'analytics',
    ],
  );
});

test('方法名唯一且每条记录包含完整中文元数据', () => {
  assert.equal(bridgeMethods.length, 98);
  assert.equal(new Set(bridgeMethods.map((method) => method.name)).size, bridgeMethods.length);

  for (const method of bridgeMethods) {
    assert.match(method.name, /^VKWebApp[A-Z]/u);
    assert.ok(method.title.length > 0);
    assert.match(method.title, /[\u3400-\u9fff]/u);
    assert.ok(method.description.length > 0);
    assert.match(method.description, /[\u3400-\u9fff]/u);
    assert.ok(bridgeMethodCategories.some((category) => category.id === method.categoryId));
    assert.ok(['low', 'medium', 'high'].includes(method.risk));
    assert.ok(['all', 'vk-container', 'desktop-web', 'mobile'].includes(method.availability));
    assert.equal(typeof method.requiresParams, 'boolean');
    assert.equal(typeof method.defaultParams, 'object');
  }
});

test('代表性方法保留官方名称、分类、参数和风险语义', () => {
  const init = bridgeMethods.find((method) => method.name === 'VKWebAppInit');
  const userInfo = bridgeMethods.find((method) => method.name === 'VKWebAppGetUserInfo');
  const storageGet = bridgeMethods.find((method) => method.name === 'VKWebAppStorageGet');
  const copyText = bridgeMethods.find((method) => method.name === 'VKWebAppCopyText');
  const banner = bridgeMethods.find((method) => method.name === 'VKWebAppShowBannerAd');
  const leaderboard = bridgeMethods.find((method) => method.name === 'VKWebAppShowLeaderBoardBox');
  const story = bridgeMethods.find((method) => method.name === 'VKWebAppShowStoryBox');
  const retargetingPixel = bridgeMethods.find((method) => method.name === 'VKWebAppRetargetingPixel');
  const conversionHit = bridgeMethods.find((method) => method.name === 'VKWebAppConversionHit');

  assert.deepEqual(init, {
    name: 'VKWebAppInit',
    title: '初始化 Bridge',
    categoryId: 'basic-environment',
    description: '初始化 VK Bridge，并建立小程序与 VK 容器之间的通信。',
    risk: 'low',
    availability: 'vk-container',
    defaultParams: {},
    requiresParams: false,
    requiresUserAction: false,
  });
  assert.equal(userInfo?.categoryId, 'users-permissions');
  assert.deepEqual(userInfo?.defaultParams, {});
  assert.equal(userInfo?.requiresParams, false);
  assert.equal(storageGet?.categoryId, 'storage-security');
  assert.deepEqual(storageGet?.defaultParams, { keys: ['示例键'] });
  assert.equal(storageGet?.requiresParams, true);
  assert.equal(copyText?.requiresUserAction, true);
  assert.equal(copyText?.risk, 'medium');
  assert.deepEqual(banner?.defaultParams, { banner_location: 'bottom' });
  assert.equal(banner?.risk, 'high');
  assert.equal(banner?.requiresUserAction, true);
  assert.deepEqual(leaderboard?.defaultParams, { user_result: 0 });
  assert.equal(leaderboard?.categoryId, 'social-navigation');
  assert.equal(leaderboard?.requiresUserAction, true);
  assert.deepEqual(story?.defaultParams, { background_type: 'none' });
  assert.equal(story?.risk, 'high');
  assert.equal(story?.requiresUserAction, true);
  assert.deepEqual(retargetingPixel?.defaultParams, {
    pixel_code: 'VK-RTRG-000000-000000',
    event: 'view',
  });
  assert.deepEqual(conversionHit?.defaultParams, {
    pixel_code: 'VK-RTRG-000000-000000',
    conversion_event: 'purchase',
    conversion_value: 0,
  });
});

test('默认参数的嵌套数组和对象不可被外部修改', () => {
  const storageGet = bridgeMethods.find((method) => method.name === 'VKWebAppStorageGet');
  const callApiMethod = bridgeMethods.find((method) => method.name === 'VKWebAppCallAPIMethod');
  const storageParams = storageGet?.defaultParams as unknown as { keys: string[] };
  const callApiParams = callApiMethod?.defaultParams as unknown as { params: { v: string } };

  assert.equal(Object.isFrozen(storageParams.keys), true);
  assert.throws(() => {
    storageParams.keys.push('外部修改');
  }, TypeError);
  assert.deepEqual(storageGet?.defaultParams, { keys: ['示例键'] });

  assert.equal(Object.isFrozen(callApiParams.params), true);
  assert.throws(() => {
    callApiParams.params.v = '外部修改';
  }, TypeError);
  assert.deepEqual(callApiMethod?.defaultParams, { method: 'users.get', params: { v: '5.199' } });
});

test('按分类查询只返回目标分类的方法且不暴露可变注册表', () => {
  const methods = getBridgeMethodsByCategory('storage-security');

  assert.ok(methods.length > 0);
  assert.ok(methods.every((method) => method.categoryId === 'storage-security'));
  assert.ok(methods.some((method) => method.name === 'VKWebAppStorageGet'));
  assert.notEqual(methods, bridgeMethods);
  assert.throws(() => {
    (methods as Array<unknown>).push({});
  }, TypeError);
});

test('官方 registry 中的所有方法都能按分类筛选并带有风险和可用性标记', () => {
  const methodsByCategory = bridgeMethodCategories.flatMap((category) =>
    getBridgeMethodsByCategory(category.id),
  );
  const methodNames = new Set(methodsByCategory.map((method) => method.name));

  assert.equal(methodsByCategory.length, bridgeMethods.length);
  assert.deepEqual(methodNames, new Set(bridgeMethods.map((method) => method.name)));

  for (const method of bridgeMethods) {
    assert.equal(
      getBridgeMethodsByCategory(method.categoryId).some((filteredMethod) => filteredMethod.name === method.name),
      true,
      `${method.name} 应能从 ${method.categoryId} 分类筛选到`,
    );
    assert.ok(['low', 'medium', 'high'].includes(method.risk));
    assert.ok(['all', 'vk-container', 'desktop-web', 'mobile'].includes(method.availability));
  }
});
