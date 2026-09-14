// @ts-expect-error 项目未安装 Node.js 类型声明，测试由 Node 直接执行。
import assert from 'node:assert/strict';
// @ts-expect-error 项目未安装 Node.js 类型声明，测试由 Node 直接执行。
import test from 'node:test';

import {
  formatBridgeMethodDefaultParams,
  getBridgeMethodAvailabilityHint,
  getBridgeMethodRiskLabel,
} from '../components/bridge-method-card-utils.ts';

test('卡片辅助逻辑将默认参数格式化为可编辑 JSON', () => {
  assert.equal(
    formatBridgeMethodDefaultParams({ title: '示例页面', enabled: true }),
    '{\n  "title": "示例页面",\n  "enabled": true\n}',
  );
});

test('卡片辅助逻辑为高风险方法提供风险标签', () => {
  assert.equal(getBridgeMethodRiskLabel('high'), '高风险');
});

test('卡片辅助逻辑为容器专用方法提供 VK Mini App 环境提示', () => {
  assert.equal(
    getBridgeMethodAvailabilityHint('vk-container'),
    '请在 VK Mini App 环境中测试',
  );
});
