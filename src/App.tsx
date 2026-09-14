import { useEffect, useState } from 'react';
import bridge, { UserInfo } from '@vkontakte/vk-bridge';
import { SplitCol, SplitLayout, View } from '@vkontakte/vkui';
import { useActiveVkuiLocation } from '@vkontakte/vk-mini-apps-router';
import { Home, Logs, Persik } from './panels';
import type { BridgeMethod } from './data/bridge-methods';
import { formatBridgeError } from './bridge/log-types';
import { DEFAULT_VIEW_PANELS } from './routes';
import type { BridgeMethodRunResult, BridgeMethodSend } from './bridge/bridge-method-runner';
import { createBridgeLogStore } from './stores/bridge-log-store';
import type { BridgeLogEntry, BridgeMethodLog } from './panels/Logs';

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

  const clearLogs = () => {
    logStore.clear();
    setLogs([]);
  };

  return (
    <SplitLayout>
      <SplitCol>
        <View activePanel={activePanel}>
          <Home id="home" fetchedUser={fetchedUser} userError={userError} />
          <Persik id="persik" send={sendBridgeMethod} onLog={handleBridgeMethodLog} onValidationError={handleBridgeValidationError} />
          <Logs id="logs" entries={logs} onClear={clearLogs} />
        </View>
      </SplitCol>
    </SplitLayout>
  );
};
