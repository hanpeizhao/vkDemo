import type { ReactNode } from 'react';

export type CapabilityType = 'bridge' | 'component' | 'navigation';

export type Capability = {
  id: string;
  title: string;
  description: string;
  type: CapabilityType;
  requiresVk?: boolean;
  bridgeMethod?: string;
  run?: () => Promise<unknown>;
  demo?: ReactNode;
};

export type CapabilityCategory = {
  id: string;
  title: string;
  description: string;
  icon: string;
  capabilities: Capability[];
};

export const capabilityCategories: CapabilityCategory[] = [
  {
    id: 'basic',
    title: '基础信息',
    description: '查看当前用户、平台、主题和应用适配状态。',
    icon: '🧭',
    capabilities: [
      { id: 'user-info', title: '获取用户信息', description: '通过 VK Bridge 获取当前用户的公开资料。', type: 'bridge', requiresVk: true, bridgeMethod: 'VKWebAppGetUserInfo' },
      { id: 'launch-params', title: '启动参数', description: '查看当前小程序 URL 中的启动参数。', type: 'component' },
      { id: 'runtime-info', title: '运行环境', description: '展示平台、WebView 和当前主题信息。', type: 'component' },
    ],
  },
  {
    id: 'bridge',
    title: 'VK Bridge',
    description: '调用 VK 平台能力并观察返回结果。',
    icon: '🔌',
    capabilities: [
      { id: 'bridge-init', title: '初始化 VK Bridge', description: '向 VK 容器发送初始化事件。', type: 'bridge', requiresVk: true, bridgeMethod: 'VKWebAppInit' },
      { id: 'open-link', title: '打开外部链接', description: '请求 VK 打开指定的外部链接。', type: 'bridge', requiresVk: true, bridgeMethod: 'VKWebAppOpenExternalLink' },
      { id: 'share', title: '分享内容', description: '调用 VK 的分享能力。', type: 'bridge', requiresVk: true, bridgeMethod: 'VKWebAppShare' },
      { id: 'copy-text', title: '复制文本', description: '将示例文本复制到系统剪贴板。', type: 'bridge', requiresVk: true, bridgeMethod: 'VKWebAppCopyText' },
      { id: 'get-files', title: '选择图片', description: '请求用户选择图片文件。', type: 'bridge', requiresVk: true, bridgeMethod: 'VKWebAppGetUserFiles' },
    ],
  },
  {
    id: 'components',
    title: 'VKUI 组件',
    description: '查看常用 VKUI 组件的交互和视觉效果。',
    icon: '🧩',
    capabilities: [
      { id: 'button', title: 'Button 按钮', description: '展示主要、次要和加载状态按钮。', type: 'component' },
      { id: 'form-controls', title: '表单控件', description: '展示输入框、复选框和选择器。', type: 'component' },
      { id: 'feedback', title: '反馈组件', description: '展示弹窗、提示条、加载器和占位符。', type: 'component' },
      { id: 'content', title: '内容组件', description: '展示卡片、头像、标签页和列表内容。', type: 'component' },
    ],
  },
  {
    id: 'layout',
    title: '布局与导航',
    description: '测试页面跳转、返回和响应式布局。',
    icon: '🗺️',
    capabilities: [
      { id: 'navigation', title: '页面导航', description: '在首页、分类页和日志页之间跳转。', type: 'navigation' },
      { id: 'adaptivity', title: '响应式布局', description: '查看 VKUI 在不同屏幕尺寸下的适配表现。', type: 'component' },
      { id: 'box-layout', title: 'Box 布局', description: '使用 Box 的间距和定位属性组织内容。', type: 'component' },
    ],
  },
  {
    id: 'logs',
    title: '调试日志',
    description: '查看本次会话中的能力调用记录。',
    icon: '🧪',
    capabilities: [],
  },
];

export function findCapabilityCategory(categoryId: string) {
  return capabilityCategories.find(({ id }) => id === categoryId);
}
