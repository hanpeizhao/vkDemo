import { FC } from 'react';
import { Avatar, Cell, Group, Header, NavIdProps, Panel, PanelHeader } from '@vkontakte/vkui';
import { UserInfo } from '@vkontakte/vk-bridge';
import { useRouteNavigator } from '@vkontakte/vk-mini-apps-router';
import { capabilityCategories } from '../data/capabilities';

export interface HomeProps extends NavIdProps {
  fetchedUser?: UserInfo;
  userError?: string;
}

export const Home: FC<HomeProps> = ({ id, fetchedUser, userError }) => {
  const { photo_200, city, first_name, last_name } = { ...fetchedUser };
  const routeNavigator = useRouteNavigator();

  return (
    <Panel id={id}>
      <PanelHeader fixed={false}>能力实验室</PanelHeader>
      <Group header={<Header size="s">基础信息</Header>}>
        {fetchedUser ? (
          <Cell before={photo_200 && <Avatar src={photo_200} />} subtitle={city?.title}>
            {`${first_name} ${last_name}`}
          </Cell>
        ) : (
          <Cell subtitle={userError || '正在等待 VK Bridge 返回用户信息'}>用户信息</Cell>
        )}
      </Group>
      <Group header={<Header size="s">功能分类</Header>}>
        <Cell onClick={() => routeNavigator.push('/persik')} subtitle="测试 VK Bridge 官方方法">
          VK Bridge 方法测试中心
        </Cell>
        {capabilityCategories.filter(({ id: categoryId }) => categoryId !== 'logs').map((category) => (
          <Cell
            key={category.id}
            before={<span aria-hidden="true">{category.icon}</span>}
            subtitle={`${category.capabilities.length} 项测试 · ${category.description}`}
            onClick={() => routeNavigator.push(`/category/${category.id}`)}
          >
            {category.title}
          </Cell>
        ))}
        <Cell onClick={() => routeNavigator.push('/logs')} subtitle="查看当前会话中的测试记录">
          调试日志
        </Cell>
      </Group>
    </Panel>
  );
};
