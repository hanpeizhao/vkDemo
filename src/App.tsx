import { Fragment, useEffect, useState } from 'react';
import bridge, { UserInfo } from '@vkontakte/vk-bridge';
import { SplitCol, SplitLayout, View } from '@vkontakte/vkui';
import { useActiveVkuiLocation } from '@vkontakte/vk-mini-apps-router';
import { Category, Home, Logs, Persik } from './panels';
import { capabilityCategories, type Capability } from './data/capabilities';
import { formatBridgeError, runCapability, type BridgeLog, type CapabilityRunResult } from './bridge/capability-runner';
import { DEFAULT_VIEW_PANELS } from './routes';

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
  const [logs, setLogs] = useState<BridgeLog[]>([]);

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
    setLogs((current) => entry.status === 'running'
      ? [...current, entry]
      : current.map((item) => item.id === entry.id ? entry : item));
  };

  const run = async (capability: Capability): Promise<CapabilityRunResult<unknown>> => {
    if (!capability.bridgeMethod) {
      return { status: 'success', value: { message: '这是一个本地 VKUI 组件演示。' } };
    }
    return runCapability(
      capability.id,
      () => bridge.send(capability.bridgeMethod as never, bridgeParams[capability.id] as never) as Promise<unknown>,
      handleLog,
    );
  };

  return (
    <SplitLayout>
      <SplitCol>
        <View activePanel={activePanel}>
          <Home id="home" fetchedUser={fetchedUser} userError={userError} />
          <Persik id="persik" />
          <Fragment>
            {capabilityCategories.filter(({ id }) => id !== 'logs').map((category) => (
              <Category key={category.id} id={category.id} category={category} onRun={run} />
            ))}
          </Fragment>
          <Logs id="logs" entries={logs} onClear={() => setLogs([])} />
        </View>
      </SplitCol>
    </SplitLayout>
  );
};
