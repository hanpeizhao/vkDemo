import { FC } from 'react';
import { Button, Cell, Group, Header, NavIdProps, Panel, PanelHeader, PanelHeaderBack, Placeholder, Text } from '@vkontakte/vkui';
import { useRouteNavigator } from '@vkontakte/vk-mini-apps-router';
import type { BridgeLog } from '../bridge/log-types';

export type BridgeMethodLog = BridgeLog & {
  method: string;
};

export type BridgeLogEntry = BridgeLog | BridgeMethodLog;

type LogsProps = NavIdProps & {
  entries: readonly BridgeLogEntry[];
  onClear: () => void;
};

const getLogMethod = (entry: BridgeLogEntry): string => (
  'method' in entry && typeof entry.method === 'string' ? entry.method : entry.capabilityId
);

const logStatusLabels: Record<BridgeLog['status'], string> = {
  running: '进行中',
  success: '成功',
  error: '失败',
  timeout: '超时',
};

const getLogStatusLabel = (entry: BridgeLogEntry): string => logStatusLabels[entry.status];

export const Logs: FC<LogsProps> = ({ id, entries, onClear }) => {
  const routeNavigator = useRouteNavigator();

  return (
  <Panel id={id}>
    <PanelHeader fixed={false} before={<PanelHeaderBack onClick={() => routeNavigator.back()} />}>调试日志</PanelHeader>
    <Group header={<Header size="s">当前会话记录</Header>}>
      <Button stretched mode="secondary" onClick={onClear}>清空日志</Button>
      {entries.length ? entries.slice().reverse().map((entry) => (
        <Cell
          key={entry.id}
          multiline
          subtitle={`${new Date(entry.startedAt).toLocaleString('zh-CN')} · ${getLogStatusLabel(entry)} · ${entry.duration} 毫秒`}
        >
          {getLogMethod(entry)}
          {entry.result !== undefined && (
            <pre style={{ margin: '8px 0 0', whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>
              {JSON.stringify(entry.result, null, 2)}
            </pre>
          )}
          {entry.error && (
            <Text style={{ marginTop: 8, whiteSpace: 'pre-wrap', overflowWrap: 'anywhere' }}>
              错误详情：{entry.error.message}{entry.error.code ? `（类型：${entry.error.code}）` : ''}
            </Text>
          )}
        </Cell>
      )) : <Placeholder>暂无测试记录</Placeholder>}
    </Group>
  </Panel>
  );
};
