import {
  createHashRouter,
  createPanel,
  createRoot,
  createView,
  RoutesConfig,
} from '@vkontakte/vk-mini-apps-router';

export const DEFAULT_ROOT = 'default_root';

export const DEFAULT_VIEW = 'default_view';

export const DEFAULT_VIEW_PANELS = {
  HOME: 'home',
  PERSIK: 'persik',
  BASIC: 'basic',
  BRIDGE: 'bridge',
  COMPONENTS: 'components',
  LAYOUT: 'layout',
  LOGS: 'logs',
} as const;

export const routes = RoutesConfig.create([
  createRoot(DEFAULT_ROOT, [
    createView(DEFAULT_VIEW, [
      createPanel(DEFAULT_VIEW_PANELS.HOME, '/', []),
      createPanel(DEFAULT_VIEW_PANELS.PERSIK, `/${DEFAULT_VIEW_PANELS.PERSIK}`, []),
      createPanel(DEFAULT_VIEW_PANELS.BASIC, '/category/basic', []),
      createPanel(DEFAULT_VIEW_PANELS.BRIDGE, '/category/bridge', []),
      createPanel(DEFAULT_VIEW_PANELS.COMPONENTS, '/category/components', []),
      createPanel(DEFAULT_VIEW_PANELS.LAYOUT, '/category/layout', []),
      createPanel(DEFAULT_VIEW_PANELS.LOGS, '/logs', []),
    ]),
  ]),
]);

export const router = createHashRouter(routes.getRoutes());
