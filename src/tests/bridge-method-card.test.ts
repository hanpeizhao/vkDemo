// @ts-expect-error 项目未安装 Node.js 类型声明，测试由 Node 直接执行。
import assert from 'node:assert/strict';
// @ts-expect-error 项目未安装 Node.js 类型声明，测试由 Node 直接执行。
import test from 'node:test';

import {
  formatBridgeMethodDefaultParams,
  getBridgeMethodAvailabilityHint,
  getBridgeMethodRiskLabel,
} from '../components/bridge-method-card-utils.ts';
import {
  getBridgeMethodResultTitle,
  runBridgeMethodCardInteraction,
  type BridgeMethodCardInteractionOutcome,
  type BridgeMethodCardInteractionState,
} from '../components/bridge-method-card-interaction.ts';
import type { BridgeMethodRunResult } from '../bridge/bridge-method-runner.ts';
import type { BridgeMethod } from '../data/bridge-methods.ts';

const testMethod: BridgeMethod = {
  name: 'VKWebAppGetUserInfo',
  title: '获取用户信息',
  categoryId: 'users-permissions',
  description: '读取当前用户的公开资料。',
  risk: 'medium',
  availability: 'vk-container',
  defaultParams: {},
  requiresParams: false,
  requiresUserAction: false,
};

const collectStates = (): {
  readonly states: BridgeMethodCardInteractionState[];
  readonly onStateChange: (state: BridgeMethodCardInteractionState) => void;
} => {
  const states: BridgeMethodCardInteractionState[] = [];

  return {
    states,
    onStateChange: (state) => states.push(state),
  };
};

const getCompletedResult = (outcome: BridgeMethodCardInteractionOutcome): BridgeMethodRunResult => {
  if (outcome.kind !== 'completed') {
    throw new Error('卡片调用应返回执行结果。');
  }

  return outcome.result;
};

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

test('卡片在参数不是 JSON 对象时仅显示当前卡片的校验错误且不调用 Bridge', async () => {
  const stateCollector = collectStates();
  let sendCalls = 0;

  const outcome = await runBridgeMethodCardInteraction({
    method: testMethod,
    paramsText: '[]',
    send: () => {
      sendCalls += 1;
      return { id: 1 };
    },
    onStateChange: stateCollector.onStateChange,
  });

  assert.deepEqual(outcome, { kind: 'validation-error' });
  assert.equal(sendCalls, 0);
  assert.deepEqual(stateCollector.states, [{
    paramsError: '参数格式错误：仅支持 JSON 对象。',
    runResult: null,
    loading: false,
  }]);
});

test('卡片使用 fake Bridge 成功结果、恢复 loading 并写入日志', async () => {
  const stateCollector = collectStates();
  const logs: Array<{ method: BridgeMethod; status: string }> = [];

  const outcome = await runBridgeMethodCardInteraction({
    method: testMethod,
    paramsText: '{"fields":"email"}',
    send: async (method, params) => {
      assert.equal(method, 'VKWebAppGetUserInfo');
      assert.deepEqual(params, { fields: 'email' });
      return { id: 7, email: 'person@example.com' };
    },
    onLog: (method, result) => logs.push({ method, status: result.status }),
    onStateChange: stateCollector.onStateChange,
  });

  const result = getCompletedResult(outcome);
  const lastState = stateCollector.states[stateCollector.states.length - 1];

  assert.equal(result.status, 'success');
  assert.deepEqual(logs, [{ method: testMethod, status: 'success' }]);
  assert.deepEqual(stateCollector.states.map((state) => state.loading), [true, false]);
  assert.equal(lastState?.runResult?.status, 'success');
  assert.deepEqual(lastState?.runResult?.result, {
    id: 7,
    email: '[已脱敏]',
  });
});

test('卡片使用 fake Bridge 失败和超时时分别恢复 loading、记录日志并展示对应标题', async () => {
  const failures = [
    {
      name: '失败',
      send: async () => {
        throw new TypeError('容器拒绝调用');
      },
      timeoutMs: 50,
      status: 'error',
      title: '调用失败',
    },
    {
      name: '超时',
      send: () => new Promise<never>(() => undefined),
      timeoutMs: 10,
      status: 'timeout',
      title: '调用超时',
    },
  ] as const;

  for (const failure of failures) {
    const stateCollector = collectStates();
    const logs: string[] = [];

    const outcome = await runBridgeMethodCardInteraction({
      method: testMethod,
      paramsText: '{}',
      send: failure.send,
      timeoutMs: failure.timeoutMs,
      onLog: (_method, result) => logs.push(result.status),
      onStateChange: stateCollector.onStateChange,
    });

    const result = getCompletedResult(outcome);
    const lastState = stateCollector.states[stateCollector.states.length - 1];

    assert.equal(result.status, failure.status, `${failure.name}应得到完成结果`);
    assert.equal(getBridgeMethodResultTitle(result.status), failure.title);
    assert.deepEqual(logs, [failure.status]);
    assert.deepEqual(stateCollector.states.map((state) => state.loading), [true, false]);
    assert.equal(lastState?.runResult?.status, failure.status);
  }
});
