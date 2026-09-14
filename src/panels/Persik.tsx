import { FC } from 'react';
import { NavIdProps, Panel, PanelHeader, PanelHeaderBack, Placeholder } from '@vkontakte/vkui';
import { useRouteNavigator } from '@vkontakte/vk-mini-apps-router';
import PersikImage from '../assets/persik.png';

export const Persik: FC<NavIdProps> = ({ id }) => {
  const routeNavigator = useRouteNavigator();

  return (
    <Panel id={id}>
      <PanelHeader before={<PanelHeaderBack onClick={() => routeNavigator.back()} />}>
        桃子
      </PanelHeader>
      <Placeholder>
        <img width={230} src={PersikImage} alt="桃子猫咪" />
      </Placeholder>
    </Panel>
  );
};
