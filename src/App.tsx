import { useEffect, useState } from 'react';
import bridge, { UserInfo } from '@vkontakte/vk-bridge';
import { SplitCol, SplitLayout, View } from '@vkontakte/vkui';
import { useActiveVkuiLocation } from '@vkontakte/vk-mini-apps-router';
import { Category, Home, Logs, Persik } from './panels';
import { capabilityCategories, type Capability } from './data/capabilities';
import type { BridgeMethod } from './data/bridge-methods';
import { formatBridgeError, runCapability, type BridgeLog, type CapabilityRunResult } from './bridge/capability-runner';
import { DEFAULT_VIEW_PANELS } from './routes';
import type { BridgeMethodRunResult, BridgeMethodSend } from './bridge/bridge-method-runner';
import { createBridgeLogStore } from './stores/bridge-log-store';
import type { BridgeLogEntry, BridgeMethodLog } from './panels/Logs';

const bridgeParams: Record<string, Record<string, string | number>> = {
  'open-link': { url: 'https://vk.com' },
  share: { link: 'https://vk.com' },
  'copy-text': { text: '来自 VK 能力实验室的测试文本' },
  'get-files': { count: 1 },
};

export const App = () => {
  const { panel: activePanel = DEFAULT_VIEW_PANELS.HOME } = useActiveVkuiLocation();
  const [fetchedUser, setUser] = useState<UserInfo>();
  const [userError, setUserError] = useState<string>();
  const [logStore] = useState(createBridgeLogStore);
  const [logs, setLogs] = useState<BridgeLogEntry[]>(() => [...logStore.entries]);
  const sendBridgeMethod: BridgeMethodSend = (method, params) => bridge.send(method as never, params as never);
  const handleBridgeMethodLog = (method: BridgeMethod, result: BridgeMethodRunResult) => {
    const finishedAt = Date.now();
    const entry: BridgeMethodLog = {
      id: `${method.name}-${finishedAt}`,
      capabilityId: method.name,
      method: method.name,
      startedAt: finishedAt - result.durationMs,
      duration: result.durationMs,
      status: result.status,
      result: result.result ?? { error: result.error, errorType: result.errorType },
      error: result.error
        ? { message: result.error, suggestion: '请检查运行环境、权限和传入参数。' }
        : undefined,
    };
    logStore.recordMethod(entry);
    setLogs([...logStore.entries]);
  };
  const handleBridgeValidationError = (method: BridgeMethod, error: string) => {
    const startedAt = Date.now();
    const entry: BridgeMethodLog = {
      id: `${method.name}-params-${startedAt}`,
      capabilityId: method.name,
      method: method.name,
      startedAt,
      duration: 0,
      status: 'error',
      result: { error },
      error: { message: error, suggestion: '请检查 JSON 参数格式。' },
    };
    logStore.recordMethod(entry);
    setLogs([...logStore.entries]);
  };

  useEffect(() => {
    let cancelled = false;
    const fetchData = async () => {
      try {
        const user = await Promise.race([
          bridge.send('VKWebAppGetUserInfo'),
          new Promise<never>((_, reject) => window.setTimeout(() => reject(new Error('获取用户信息超时')), 5000)),
        ]);
        if (!cancelled) setUser(user);
      } catch (error) {
        if (!cancelled) setUserError(formatBridgeError(error).message);
      }
    };
    void fetchData();
    return () => { cancelled = true; };
  }, []);

  const handleLog = (entry: BridgeLog) => {
    if (entry.status === 'running') {
      logStore.add(entry);
    } else {
      logStore.update(entry.id, entry);
    }
    setLogs([...logStore.entries]);
  };

  const clearLogs = () => {
    logStore.clear();
    setLogs([]);
  };

  const run = async (capability: Capability): Promise<CapabilityRunResult<unknown>> => {
    if (!capability.bridgeMethod) {
      return { status: 'success', value: { message: '这是一个本地 VKUI 组件演示。' } };
    }
    return runCapability(
      capability.id,
      () => Promise.race([
        bridge.send(capability.bridgeMethod as never, bridgeParams[capability.id] as never) as Promise<unknown>,
        new Promise<never>((_, reject) => window.setTimeout(() => reject(new Error('Bridge 调用超时')), 8000)),
      ]),
      handleLog,
    );
  };

  return (
    <SplitLayout>
      <SplitCol>
        <View activePanel={activePanel}>
          <Home id="home" fetchedUser={fetchedUser} userError={userError} />
          <Persik id="persik" send={sendBridgeMethod} onLog={handleBridgeMethodLog} onValidationError={handleBridgeValidationError} />
          <Category id="basic" category={capabilityCategories.find(({ id }) => id === 'basic')!} onRun={run} />
          <Category id="bridge" category={capabilityCategories.find(({ id }) => id === 'bridge')!} onRun={run} />
          <Category id="components" category={capabilityCategories.find(({ id }) => id === 'components')!} onRun={run} />
          <Category id="layout" category={capabilityCategories.find(({ id }) => id === 'layout')!} onRun={run} />
          <Logs id="logs" entries={logs} onClear={clearLogs} />
        </View>
      </SplitCol>
    </SplitLayout>
  );
};
