import { FC, useMemo, useState } from 'react';
import { CardGrid, Group, Header, NavIdProps, Panel, PanelHeader, PanelHeaderBack, SegmentedControl, Spacing, Text } from '@vkontakte/vkui';
import { useRouteNavigator } from '@vkontakte/vk-mini-apps-router';
import { bridgeMethodCategories, bridgeMethods, type BridgeMethod, type BridgeMethodCategoryId } from '../data/bridge-methods';
import { BridgeMethodCard } from '../components/BridgeMethodCard';
import type { BridgeMethodRunResult, BridgeMethodSend } from '../bridge/bridge-method-runner';

type PersikProps = NavIdProps & {
  send: BridgeMethodSend;
  onLog: (method: BridgeMethod, result: BridgeMethodRunResult) => void;
  onValidationError?: (method: BridgeMethod, error: string) => void;
};

export const Persik: FC<PersikProps> = ({ id, send, onLog, onValidationError }) => {
  const routeNavigator = useRouteNavigator();
  const [categoryId, setCategoryId] = useState<BridgeMethodCategoryId>(bridgeMethodCategories[0].id);
  const selectedMethods = useMemo(() => bridgeMethods.filter((method) => method.categoryId === categoryId), [categoryId]);

  return (
    <Panel id={id}>
      <PanelHeader fixed={false} before={<PanelHeaderBack onClick={() => routeNavigator.back()} />}>
        VK Bridge 方法测试中心
      </PanelHeader>
      <Group header={<Header size="s">分类</Header>}>
        <SegmentedControl
          value={categoryId}
          onChange={(value) => setCategoryId(value as BridgeMethodCategoryId)}
          options={bridgeMethodCategories.map((category) => ({ label: category.title, value: category.id }))}
        />
      </Group>
      <Group header={<Header size="s">Bridge 方法</Header>}>
        <Text>
          共 {bridgeMethods.length} 个方法。请在 VK Mini App 环境中测试容器专用能力；标记“需要用户操作”的方法可能打开授权或确认界面。
        </Text>
        <Spacing size="s" />
        <CardGrid size="l">
          {selectedMethods.map((method) => (
            <BridgeMethodCard key={method.name} method={method} send={send} onLog={onLog} onValidationError={onValidationError} />
          ))}
        </CardGrid>
      </Group>
    </Panel>
  );
};
