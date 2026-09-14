import { FC } from 'react';
import {
  Panel,
  PanelHeader,
  Header,
  Button,
  Group,
  Cell,
  Box,
  Avatar,
  NavIdProps,
} from '@vkontakte/vkui';
import { UserInfo } from '@vkontakte/vk-bridge';
import { useRouteNavigator } from '@vkontakte/vk-mini-apps-router';

export interface HomeProps extends NavIdProps {
  fetchedUser?: UserInfo;
}

export const Home: FC<HomeProps> = ({ id, fetchedUser }) => {
  const { photo_200, city, first_name, last_name } = { ...fetchedUser };
  const routeNavigator = useRouteNavigator();

  return (
    <Panel id={id}>
      <PanelHeader>首页</PanelHeader>
      {fetchedUser && (
        <Group header={<Header size="s">通过 VK Bridge 获取的用户信息</Header>}>
          <Cell before={photo_200 && <Avatar src={photo_200} />} subtitle={city?.title}>
            {`${first_name} ${last_name}`}
          </Cell>
        </Group>
      )}

      <Group header={<Header size="s">导航示例</Header>}>
        <Box paddingBlock="m" paddingInline="m">
          <Button stretched size="l" mode="secondary" onClick={() => routeNavigator.push('persik')}>
            郭煜
          </Button>
        </Box>
      </Group>
    </Panel>
  );
};
