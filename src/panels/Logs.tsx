import { FC } from 'react';
import { Button, Cell, Group, Header, NavIdProps, Panel, PanelHeader, Placeholder } from '@vkontakte/vkui';
import type { BridgeLog } from '../bridge/capability-runner';

type LogsProps = NavIdProps & {
  entries: BridgeLog[];
  onClear: () => void;
};

export const Logs: FC<LogsProps> = ({ id, entries, onClear }) => (
  <Panel id={id}>
    <PanelHeader fixed={false}>调试日志</PanelHeader>
    <Group header={<Header size="s">当前会话记录</Header>}>
      <Button stretched mode="secondary" onClick={onClear}>清空日志</Button>
      {entries.length ? entries.slice().reverse().map((entry) => (
        <Cell key={entry.id} subtitle={`${entry.status} · ${entry.duration} 毫秒`}>
          {entry.capabilityId}
        </Cell>
      )) : <Placeholder>暂无测试记录</Placeholder>}
    </Group>
  </Panel>
);
