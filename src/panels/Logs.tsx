import { FC } from 'react';
import { Button, Cell, Group, Header, NavIdProps, Panel, PanelHeader, Placeholder } from '@vkontakte/vkui';
import type { BridgeLog } from '../bridge/capability-runner';
import type { BridgeMethodRunStatus } from '../bridge/bridge-method-runner';

export type BridgeMethodLog = BridgeLog & {
  method: string;
  methodStatus: BridgeMethodRunStatus;
};

export type BridgeLogEntry = BridgeLog | BridgeMethodLog;

type LogsProps = NavIdProps & {
  entries: readonly BridgeLogEntry[];
  onClear: () => void;
};

const getLogMethod = (entry: BridgeLogEntry): string => (
  'method' in entry && typeof entry.method === 'string' ? entry.method : entry.capabilityId
);

const getLogStatus = (entry: BridgeLogEntry): BridgeLog['status'] | BridgeMethodRunStatus => (
  'methodStatus' in entry ? entry.methodStatus : entry.status
);

export const Logs: FC<LogsProps> = ({ id, entries, onClear }) => (
  <Panel id={id}>
    <PanelHeader fixed={false}>调试日志</PanelHeader>
    <Group header={<Header size="s">当前会话记录</Header>}>
      <Button stretched mode="secondary" onClick={onClear}>清空日志</Button>
      {entries.length ? entries.slice().reverse().map((entry) => (
        <Cell
          key={entry.id}
          multiline
          subtitle={`${new Date(entry.startedAt).toLocaleString('zh-CN')} · ${getLogStatus(entry)} · ${entry.duration} 毫秒`}
        >
          {getLogMethod(entry)}
          {entry.result !== undefined && (
            <pre style={{ margin: '8px 0 0', whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>
              {JSON.stringify(entry.result, null, 2)}
            </pre>
          )}
        </Cell>
      )) : <Placeholder>暂无测试记录</Placeholder>}
    </Group>
  </Panel>
);
