export type BridgeRisk = 'low' | 'medium' | 'high';

export type BridgeAvailability = 'all' | 'vk-container' | 'desktop-web' | 'mobile';

export type BridgeMethodCategoryId =
  | 'basic-environment'
  | 'users-permissions'
  | 'social-navigation'
  | 'storage-security'
  | 'files-media'
  | 'device-capabilities'
  | 'ads-payments-subscriptions'
  | 'calls-realtime'
  | 'interface-window'
  | 'analytics';

export type BridgeMethodCategory = Readonly<{
  id: BridgeMethodCategoryId;
  title: string;
  description: string;
}>;

interface BridgeMethodDefaultParamObject {
  readonly [key: string]: BridgeMethodDefaultParam;
}

type BridgeMethodDefaultParam =
  | string
  | number
  | boolean
  | null
  | readonly BridgeMethodDefaultParam[]
  | BridgeMethodDefaultParamObject;

type BridgeMethodDefaultParams = BridgeMethodDefaultParamObject;

export type BridgeMethod = Readonly<{
  name: string;
  title: string;
  categoryId: BridgeMethodCategoryId;
  description: string;
  risk: BridgeRisk;
  availability: BridgeAvailability;
  defaultParams: BridgeMethodDefaultParams;
  requiresParams: boolean;
  requiresUserAction: boolean;
}>;

export const bridgeMethodCategories = Object.freeze([
  {
    id: 'basic-environment',
    title: '基础与环境',
    description: '初始化、启动参数、客户端版本、配置和容器通信。',
  },
  {
    id: 'users-permissions',
    title: '用户与权限',
    description: '用户资料、授权、权限、联系人和社区信息。',
  },
  {
    id: 'social-navigation',
    title: '社交与导航',
    description: '分享、推荐、收藏、加群、消息、应用和页面导航。',
  },
  {
    id: 'storage-security',
    title: '存储与安全',
    description: '应用存储、哈希和安全相关能力。',
  },
  {
    id: 'files-media',
    title: '文件与媒体',
    description: '用户文件、图片、下载、二维码和联系人选择。',
  },
  {
    id: 'device-capabilities',
    title: '设备能力',
    description: '闪光灯、传感器、音频和触感反馈。',
  },
  {
    id: 'ads-payments-subscriptions',
    title: '广告、支付与订阅',
    description: '广告、支付表单、订单、订阅和调查。',
  },
  {
    id: 'calls-realtime',
    title: '通话与实时通信',
    description: '通话开始、加入、状态查询和实时通信能力。',
  },
  {
    id: 'interface-window',
    title: '界面与窗口',
    description: '窗口尺寸、滚动、视图、消息框和页面显示。',
  },
  {
    id: 'analytics',
    title: '数据统计',
    description: '事件、转化和再营销统计。',
  },
] as const satisfies readonly BridgeMethodCategory[]);

type BridgeMethodDefinition = readonly [
  name: string,
  title: string,
  categoryId: BridgeMethodCategoryId,
  description: string,
  risk: BridgeRisk,
  availability: BridgeAvailability,
  defaultParams: BridgeMethodDefaultParams,
  requiresParams: boolean,
  requiresUserAction: boolean,
];

const deepFreeze = <Value extends object>(value: Value): Value => {
  if (Object.isFrozen(value)) {
    return value;
  }

  Object.freeze(value);

  for (const nestedValue of Object.values(value)) {
    if (nestedValue !== null && typeof nestedValue === 'object') {
      deepFreeze(nestedValue);
    }
  }

  return value;
};

const method = (definition: BridgeMethodDefinition): BridgeMethod => {
  const [
    name,
    title,
    categoryId,
    description,
    risk,
    availability,
    defaultParams,
    requiresParams,
    requiresUserAction,
  ] = definition;

  return Object.freeze({
    name,
    title,
    categoryId,
    description,
    risk,
    availability,
    defaultParams: deepFreeze({ ...defaultParams }),
    requiresParams,
    requiresUserAction,
  });
};

const definitions: readonly BridgeMethodDefinition[] = [
  ['VKWebAppInit', '初始化 Bridge', 'basic-environment', '初始化 VK Bridge，并建立小程序与 VK 容器之间的通信。', 'low', 'vk-container', {}, false, false],
  ['VKWebAppGetLaunchParams', '获取启动参数', 'basic-environment', '获取打开小程序时由 VK 容器提供的启动参数。', 'low', 'vk-container', {}, false, false],
  ['VKWebAppGetClientVersion', '获取客户端版本', 'basic-environment', '获取当前 VK 客户端的平台和版本信息。', 'low', 'vk-container', {}, false, false],
  ['VKWebAppGetConfig', '获取客户端配置', 'basic-environment', '获取客户端主题、视口和适配性配置。', 'low', 'vk-container', {}, false, false],
  ['VKWebAppGetGeodata', '获取地理位置', 'basic-environment', '请求客户端提供当前设备的地理位置信息。', 'high', 'vk-container', {}, false, true],
  ['VKWebAppSetTitle', '设置页面标题', 'basic-environment', '设置 VK 容器中的当前页面标题。', 'low', 'vk-container', { title: '示例页面' }, true, false],
  ['VKWebAppSetLocation', '设置页面地址', 'basic-environment', '在 VK 容器中更新小程序当前页面地址。', 'medium', 'vk-container', { location: '/example' }, true, false],
  ['VKWebAppSendToClient', '发送消息给客户端', 'basic-environment', '向承载小程序的 VK 客户端发送自定义消息。', 'medium', 'vk-container', { fragment: 'example' }, false, false],
  ['VKWebAppCreateHash', '创建数据哈希', 'basic-environment', '请求客户端为指定数据创建哈希，用于校验数据完整性。', 'medium', 'vk-container', { payload: 'example' }, true, false],
  ['VKWebAppTranslate', '翻译文本', 'basic-environment', '请求 VK 客户端翻译指定文本或文本列表。', 'low', 'vk-container', { text: '示例文本', target_lang: 'en' }, true, false],

  ['VKWebAppGetUserInfo', '获取用户信息', 'users-permissions', '获取当前用户公开的 VK 资料信息。', 'medium', 'vk-container', {}, false, true],
  ['VKWebAppGetGrantedPermissions', '获取已授权权限', 'users-permissions', '获取当前小程序已经获得的用户权限。', 'low', 'vk-container', {}, false, false],
  ['VKWebAppCheckAllowedScopes', '检查权限范围', 'users-permissions', '检查当前用户是否允许指定的权限范围。', 'low', 'vk-container', { scopes: 'friends' }, true, false],
  ['VKWebAppGetAuthToken', '获取用户令牌', 'users-permissions', '请求用户授权并获取指定应用权限的令牌。', 'high', 'vk-container', { app_id: 0, scope: 'friends' }, true, true],
  ['VKWebAppGetCommunityToken', '获取社区令牌', 'users-permissions', '请求指定社区范围的访问令牌。', 'high', 'vk-container', { app_id: 0, group_id: 0, scope: 'messages' }, true, true],
  ['VKWebAppGetCommunityAuthToken', '获取社区授权令牌', 'users-permissions', '为应用获取社区授权令牌，可能触发权限确认。', 'high', 'vk-container', { group_id: 0, scope: 'messages' }, true, true],
  ['VKWebAppGetEmail', '获取邮箱', 'users-permissions', '请求用户确认后获取邮箱信息。', 'high', 'vk-container', {}, false, true],
  ['VKWebAppGetPhoneNumber', '获取手机号', 'users-permissions', '请求用户确认后获取已验证手机号。', 'high', 'vk-container', {}, false, true],
  ['VKWebAppGetPersonalCard', '获取个人卡片', 'users-permissions', '请求用户选择并返回个人资料卡片。', 'high', 'vk-container', { type: ['phone'] }, true, true],
  ['VKWebAppGetGroupInfo', '获取社区信息', 'users-permissions', '获取指定 VK 社区的公开信息。', 'low', 'vk-container', { group_id: 0 }, true, false],
  ['VKWebAppGetFriends', '获取好友列表', 'users-permissions', '获取当前用户允许小程序访问的好友列表。', 'medium', 'vk-container', { multi: false }, false, true],
  ['VKWebAppCallAPIMethod', '调用 VK API', 'users-permissions', '通过 VK Bridge 调用 VK API 方法，参数必须由开发者手动确认。', 'high', 'vk-container', { method: 'users.get', params: { v: '5.199' } }, true, true],
  ['VKWebAppLibverifyRequest', '请求手机号验证', 'users-permissions', '请求向指定手机号发送验证短信。', 'high', 'vk-container', { phone: '+70000000000' }, true, true],
  ['VKWebAppLibverifyCheck', '校验手机号验证码', 'users-permissions', '校验用户输入的手机号验证码。', 'high', 'vk-container', { code: '0000' }, true, true],
  ['VKWebAppOpenContacts', '选择联系人', 'users-permissions', '打开 VK 联系人选择器并返回用户选择结果。', 'medium', 'vk-container', {}, false, true],

  ['VKWebAppShare', '分享链接', 'social-navigation', '打开 VK 分享流程并分享链接。', 'medium', 'vk-container', { link: 'https://vk.com' }, false, true],
  ['VKWebAppShowLeaderBoardBox', '展示排行榜弹窗', 'social-navigation', '打开 VK 客户端提供的排行榜界面并展示用户成绩。', 'medium', 'vk-container', { user_result: 0 }, true, true],
  ['VKWebAppRecommend', '推荐应用', 'social-navigation', '打开推荐流程，让用户推荐当前小程序。', 'medium', 'vk-container', {}, false, true],
  ['VKWebAppAddToFavorites', '添加到收藏', 'social-navigation', '请求用户将当前小程序添加到收藏。', 'medium', 'vk-container', {}, false, true],
  ['VKWebAppAddToProfile', '添加到个人资料', 'social-navigation', '请求用户将当前小程序添加到个人资料。', 'medium', 'vk-container', {}, false, true],
  ['VKWebAppAddToCommunity', '添加到社区', 'social-navigation', '请求将当前小程序添加到指定社区。', 'high', 'vk-container', { hide_success_modal: false }, false, true],
  ['VKWebAppAddToHomeScreen', '添加到主屏幕', 'social-navigation', '请求用户将小程序添加到设备主屏幕。', 'medium', 'mobile', {}, false, true],
  ['VKWebAppAddToHomeScreenInfo', '查询主屏幕状态', 'social-navigation', '查询当前小程序是否支持或已经添加到主屏幕。', 'low', 'mobile', {}, false, false],
  ['VKWebAppOpenApp', '打开其他应用', 'social-navigation', '打开另一个 VK 应用，可能离开当前小程序。', 'high', 'vk-container', { app_id: 0 }, true, true],
  ['VKWebAppClose', '关闭小程序', 'social-navigation', '关闭当前小程序并向 VK 客户端报告状态。', 'high', 'vk-container', { status: 'success' }, true, true],
  ['VKWebAppJoinGroup', '加入社区', 'social-navigation', '请求用户加入指定 VK 社区。', 'high', 'vk-container', { group_id: 0 }, true, true],
  ['VKWebAppLeaveGroup', '退出社区', 'social-navigation', '请求用户退出指定 VK 社区。', 'high', 'vk-container', { group_id: 0 }, true, true],
  ['VKWebAppAllowMessagesFromGroup', '允许社区发消息', 'social-navigation', '请求用户允许指定社区向其发送消息。', 'high', 'vk-container', { group_id: 0 }, true, true],
  ['VKWebAppAllowNotifications', '允许通知', 'social-navigation', '请求用户允许 VK 客户端发送通知。', 'high', 'vk-container', {}, false, true],
  ['VKWebAppDenyNotifications', '拒绝通知', 'social-navigation', '请求关闭当前小程序的通知权限。', 'medium', 'vk-container', {}, false, true],
  ['VKWebAppSendPayload', '发送社区消息载荷', 'social-navigation', '向指定社区发送自定义消息载荷。', 'high', 'vk-container', { group_id: 0, payload: 'example' }, true, true],
  ['VKWebAppSubscribeStoryApp', '订阅故事应用', 'social-navigation', '请求用户订阅当前应用的故事更新。', 'medium', 'vk-container', { app_id: 0 }, true, true],
  ['VKWebAppShowStoryBox', '打开故事发布框', 'social-navigation', '打开 VK 故事编辑和发布流程，故事内容必须由用户确认。', 'high', 'vk-container', { background_type: 'none' }, true, true],
  ['VKWebAppOpenWallPost', '打开墙面帖子', 'social-navigation', '打开指定用户或社区的墙面帖子。', 'low', 'vk-container', { owner_id: 0, post_id: 0 }, true, false],
  ['VKWebAppShowWallPostBox', '打开发帖框', 'social-navigation', '打开 VK 发帖框，内容由用户最终确认发布。', 'high', 'vk-container', { message: '请编辑后再发布' }, false, true],
  ['VKWebAppShowInviteBox', '打开邀请框', 'social-navigation', '打开邀请好友使用当前小程序的界面。', 'medium', 'vk-container', {}, false, true],
  ['VKWebAppShowRequestBox', '打开请求框', 'social-navigation', '打开 VK 请求发送界面，内容必须由用户确认。', 'high', 'vk-container', { user_id: 0, message: '请编辑请求内容' }, true, true],

  ['VKWebAppStorageGetKeys', '获取存储键名', 'storage-security', '获取当前小程序在 VK 容器中的存储键名。', 'low', 'vk-container', { count: 20, offset: 0 }, true, false],
  ['VKWebAppStorageGet', '读取存储', 'storage-security', '读取当前小程序保存的键值数据。', 'low', 'vk-container', { keys: ['示例键'] }, true, false],
  ['VKWebAppStorageSet', '写入存储', 'storage-security', '写入当前小程序的键值数据。', 'medium', 'vk-container', { key: '示例键', value: '示例值' }, true, false],

  ['VKWebAppGetUserFiles', '获取用户文件', 'files-media', '打开文件选择流程并返回用户选择的文件。', 'medium', 'vk-container', {}, false, true],
  ['VKWebAppDownloadFile', '下载文件', 'files-media', '请求 VK 客户端下载指定文件。', 'medium', 'vk-container', { url: 'https://example.com/file.txt', filename: 'file.txt' }, true, true],
  ['VKWebAppShowImages', '预览图片', 'files-media', '在 VK 客户端图片查看器中预览图片列表。', 'low', 'vk-container', { images: ['https://example.com/image.jpg'] }, true, false],
  ['VKWebAppOpenCodeReader', '打开扫码器', 'files-media', '打开客户端扫码器并返回扫描结果。', 'medium', 'mobile', {}, false, true],
  ['VKWebAppOpenQR', '打开二维码识别', 'files-media', '打开二维码识别界面并返回识别结果。', 'medium', 'mobile', {}, false, true],
  ['VKWebAppCopyText', '复制文本', 'files-media', '请求客户端将指定文本复制到系统剪贴板。', 'medium', 'vk-container', { text: '请编辑要复制的文本' }, true, true],

  ['VKWebAppFlashGetInfo', '获取闪光灯状态', 'device-capabilities', '查询设备闪光灯是否可用及当前亮度。', 'low', 'mobile', {}, false, false],
  ['VKWebAppFlashSetLevel', '设置闪光灯亮度', 'device-capabilities', '设置设备闪光灯亮度。', 'medium', 'mobile', { level: 0 }, true, true],
  ['VKWebAppAudioPause', '暂停音频', 'device-capabilities', '暂停 VK 客户端中的音频播放。', 'medium', 'vk-container', {}, false, true],
  ['VKWebAppTapticImpactOccurred', '触感冲击反馈', 'device-capabilities', '触发设备的短促触感冲击反馈。', 'low', 'mobile', { style: 'light' }, true, false],
  ['VKWebAppTapticNotificationOccurred', '触感通知反馈', 'device-capabilities', '触发设备的通知类触感反馈。', 'low', 'mobile', { type: 'success' }, true, false],
  ['VKWebAppTapticSelectionChanged', '触感选择反馈', 'device-capabilities', '触发设备的选择变化触感反馈。', 'low', 'mobile', {}, false, false],
  ['VKWebAppAccelerometerStart', '启动加速度计', 'device-capabilities', '开始读取设备加速度计数据。', 'medium', 'mobile', { refresh_rate: '60' }, false, true],
  ['VKWebAppAccelerometerStop', '停止加速度计', 'device-capabilities', '停止读取设备加速度计数据。', 'low', 'mobile', {}, false, false],
  ['VKWebAppGyroscopeStart', '启动陀螺仪', 'device-capabilities', '开始读取设备陀螺仪数据。', 'medium', 'mobile', {}, false, true],
  ['VKWebAppGyroscopeStop', '停止陀螺仪', 'device-capabilities', '停止读取设备陀螺仪数据。', 'low', 'mobile', {}, false, false],
  ['VKWebAppDeviceMotionStart', '启动设备运动', 'device-capabilities', '开始读取设备运动数据。', 'medium', 'mobile', {}, false, true],
  ['VKWebAppDeviceMotionStop', '停止设备运动', 'device-capabilities', '停止读取设备运动数据。', 'low', 'mobile', {}, false, false],
  ['VKWebAppSetViewSettings', '设置视图样式', 'device-capabilities', '设置客户端状态栏和系统导航栏样式。', 'medium', 'mobile', { status_bar_style: 'light' }, true, false],
  ['VKWebAppDisableSwipeBack', '禁用返回滑动', 'device-capabilities', '禁用客户端页面的返回滑动手势。', 'medium', 'mobile', {}, false, false],
  ['VKWebAppEnableSwipeBack', '启用返回滑动', 'device-capabilities', '启用客户端页面的返回滑动手势。', 'low', 'mobile', {}, false, false],
  ['VKWebAppSetSwipeSettings', '设置返回滑动', 'device-capabilities', '配置客户端返回滑动手势的历史行为。', 'medium', 'mobile', { history: true }, true, false],

  ['VKWebAppCheckBannerAd', '检查横幅广告', 'ads-payments-subscriptions', '检查当前环境是否可以展示横幅广告。', 'low', 'vk-container', {}, false, false],
  ['VKWebAppShowBannerAd', '展示横幅广告', 'ads-payments-subscriptions', '展示横幅广告，可能产生外部商业内容。', 'high', 'vk-container', { banner_location: 'bottom' }, true, true],
  ['VKWebAppHideBannerAd', '隐藏横幅广告', 'ads-payments-subscriptions', '隐藏当前正在展示的横幅广告。', 'low', 'vk-container', {}, false, false],
  ['VKWebAppCheckNativeAds', '检查原生广告', 'ads-payments-subscriptions', '检查当前环境是否可以展示原生广告。', 'low', 'vk-container', { ad_format: 'interstitial' }, true, false],
  ['VKWebAppShowNativeAds', '展示原生广告', 'ads-payments-subscriptions', '展示原生广告，可能产生外部商业内容。', 'high', 'vk-container', { ad_format: 'interstitial' }, true, true],
  ['VKWebAppOpenPayForm', '打开支付表单', 'ads-payments-subscriptions', '打开支付表单，真实交易前必须由用户确认。', 'high', 'vk-container', { action: 'pay', merchant_data: '请编辑商品信息' }, true, true],
  ['VKWebAppShowOrderBox', '打开订单框', 'ads-payments-subscriptions', '打开订单购买流程，可能产生真实支付。', 'high', 'vk-container', { type: 'item', votes: 0, merchant_product_id: '请编辑商品' }, true, true],
  ['VKWebAppShowSubscriptionBox', '打开订阅框', 'ads-payments-subscriptions', '打开订阅流程，可能产生持续性扣款。', 'high', 'vk-container', { action: 'create', subscription_id: 0 }, true, true],
  ['VKWebAppCheckSurvey', '检查调查问卷', 'ads-payments-subscriptions', '检查当前用户是否有可展示的调查问卷。', 'low', 'vk-container', {}, false, false],
  ['VKWebAppShowSurvey', '展示调查问卷', 'ads-payments-subscriptions', '展示 VK 调查问卷界面。', 'medium', 'vk-container', {}, false, true],
  ['VKWebAppShowSlidesSheet', '展示幻灯片面板', 'ads-payments-subscriptions', '展示由 VK 客户端提供的幻灯片式内容面板。', 'medium', 'vk-container', { slides: [] }, true, true],
  ['VKWebAppShowCommunityWidgetPreviewBox', '预览社区组件', 'ads-payments-subscriptions', '预览指定社区组件，内容和社区信息需手动确认。', 'high', 'vk-container', { type: 'group', group_id: 0, code: '请编辑组件代码' }, true, true],

  ['VKWebAppCallStart', '开始通话', 'calls-realtime', '开始实时通话流程，可能请求麦克风或摄像头权限。', 'high', 'vk-container', {}, false, true],
  ['VKWebAppCallJoin', '加入通话', 'calls-realtime', '加入指定实时通话，可能请求设备权限。', 'high', 'vk-container', { call_id: '请编辑通话标识' }, true, true],
  ['VKWebAppCallGetStatus', '查询通话状态', 'calls-realtime', '查询当前实时通话状态。', 'low', 'vk-container', {}, false, false],

  ['VKWebAppResizeWindow', '调整窗口大小', 'interface-window', '调整桌面 VK 容器中小程序窗口的尺寸。', 'low', 'desktop-web', { width: 360, height: 640 }, true, false],
  ['VKWebAppScroll', '滚动页面', 'interface-window', '将页面滚动到指定位置。', 'low', 'vk-container', { top: 0, speed: 300 }, true, false],
  ['VKWebAppScrollTop', '滚动到顶部', 'interface-window', '将当前页面平滑滚动到顶部。', 'low', 'vk-container', {}, false, false],
  ['VKWebAppScrollTopStart', '开始顶部滚动监听', 'interface-window', '开始监听页面是否滚动到顶部。', 'low', 'vk-container', {}, false, false],
  ['VKWebAppScrollTopStop', '停止顶部滚动监听', 'interface-window', '停止页面顶部滚动监听。', 'low', 'vk-container', {}, false, false],
  ['VKWebAppShowMessageBox', '展示消息框', 'interface-window', '展示由 VK 客户端提供的消息确认框。', 'medium', 'vk-container', { peer_id: 0, message: '请编辑消息内容' }, true, true],
  ['VKWebAppAddToMenu', '添加到菜单', 'interface-window', '请求将当前小程序添加到 VK 客户端菜单。', 'medium', 'desktop-web', {}, false, true],
  ['VKWebAppShowInstallPushBox', '展示安装推送框', 'interface-window', '展示安装推送提示框，是否安装由用户决定。', 'medium', 'desktop-web', {}, false, true],

  ['VKWebAppRetargetingPixel', '发送再营销事件', 'analytics', '向 VK 发送再营销像素事件。', 'high', 'vk-container', { pixel_code: 'VK-RTRG-000000-000000', event: 'view' }, true, false],
  ['VKWebAppConversionHit', '发送转化事件', 'analytics', '向 VK 发送转化命中事件。', 'high', 'vk-container', { pixel_code: 'VK-RTRG-000000-000000', conversion_event: 'purchase', conversion_value: 0 }, true, false],
  ['VKWebAppTrackEvent', '记录统计事件', 'analytics', '记录小程序的业务统计事件。', 'medium', 'vk-container', { event_name: 'example', event_params: {} }, true, false],
] as const;

export const bridgeMethods = Object.freeze(definitions.map(method));

export function getBridgeMethodsByCategory(
  categoryId: BridgeMethodCategoryId,
): readonly BridgeMethod[] {
  return Object.freeze(bridgeMethods.filter((bridgeMethod) => bridgeMethod.categoryId === categoryId));
}
