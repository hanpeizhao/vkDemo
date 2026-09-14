import { FC } from 'react';
import { Group, Header, NavIdProps, Panel, PanelHeader, Placeholder } from '@vkontakte/vkui';
import type { Capability, CapabilityCategory } from '../data/capabilities';
import type { CapabilityRunResult } from '../bridge/capability-runner';
import { CapabilityCard } from '../components/CapabilityCard';

type CategoryProps = NavIdProps & {
  category: CapabilityCategory;
  onRun: (capability: Capability) => Promise<CapabilityRunResult<unknown>>;
};

export const Category: FC<CategoryProps> = ({ id, category, onRun }) => (
  <Panel id={id}>
    <PanelHeader fixed={false}>{category.title}</PanelHeader>
    <Group header={<Header size="s">{category.description}</Header>}>
      {category.capabilities.length ? category.capabilities.map((capability) => (
        <CapabilityCard key={capability.id} capability={capability} onRun={onRun} />
      )) : <Placeholder>暂无测试项</Placeholder>}
    </Group>
  </Panel>
);
