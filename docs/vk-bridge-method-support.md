# VK Bridge 各平台方法支持情况

本文档基于项目当前安装的 `@vkontakte/vk-bridge@3.0.2` 源码整理，重点说明 Web、Android、iOS/iPadOS 和 React Native WebView 的方法支持判断方式。

## 1. 重要结论

`vk-bridge` 中的方法支持有两层含义：

1. **方法类型存在**：TypeScript 类型中可以调用该方法。
2. **当前宿主支持**：当前 VK 客户端或 Web 容器真的实现了该方法。

方法出现在类型定义中，不代表所有平台都支持。比如 `VKWebAppOpenCodeReader`（扫码）虽然存在于类型定义中，但它不在 Web 平台的静态方法列表中，因此普通 Web 端不能依赖它。

## 2. 支持检查 API

### 2.1 推荐使用 `supportsAsync`

```ts
const supported = await bridge.supportsAsync('VKWebAppOpenCodeReader');

if (supported) {
  await bridge.send('VKWebAppOpenCodeReader');
} else {
  // 使用 Web 端的替代方案，例如调用浏览器摄像头能力
}
```

`supportsAsync` 的行为：

| 环境 | 检查方式 |
| --- | --- |
| Android | 检查 `window.AndroidBridge[method]` 是否为函数 |
| iOS / iPadOS | 检查 `window.webkit.messageHandlers[method].postMessage` 是否存在 |
| Web / Web Messenger | 向宿主请求 `SetSupportedHandlers`，读取宿主返回的方法列表 |
| React Native WebView | 发送能力查询或由宿主处理，最终能力取决于 React Native 容器 |

源码位置：[`src/bridge.ts:224-238`](../node_modules/@vkontakte/vk-bridge/src/bridge.ts#L224-L238)、[`src/bridge.ts:344-357`](../node_modules/@vkontakte/vk-bridge/src/bridge.ts#L344-L357)。

### 2.2 `supports` 已废弃

```ts
bridge.supports('VKWebAppOpenCodeReader');
```

`supports` 已经标记为 deprecated。它对 Web 平台使用源码中的静态白名单，对 Android/iOS 只检查注入对象是否存在。新代码应优先使用异步版本：

```ts
await bridge.supportsAsync(method);
```

## 3. Web 平台静态支持列表

当前源码中的 `DESKTOP_METHODS` 实际上同时作为 Web 平台的静态支持列表。它不是“只有桌面端支持的方法列表”。

### 3.1 `desktop_web` 和 `desktop_web_messenger`

这两个平台静态支持以下公共方法，以及桌面 Web 专属方法。

#### 公共 Web 方法

| 方法 | 功能分类 |
| --- | --- |
| `VKWebAppInit` | 初始化 |
| `VKWebAppGetCommunityAuthToken` | 获取社区授权 Token |
| `VKWebAppAddToCommunity` | 添加到社区 |
| `VKWebAppAddToHomeScreenInfo` | 获取添加到主屏信息 |
| `VKWebAppClose` | 关闭 Mini App |
| `VKWebAppCopyText` | 复制文本 |
| `VKWebAppCreateHash` | 创建 Hash |
| `VKWebAppGetUserInfo` | 获取用户信息 |
| `VKWebAppSetLocation` | 设置页面位置 |
| `VKWebAppSendToClient` | 向客户端发送数据 |
| `VKWebAppGetClientVersion` | 获取客户端版本 |
| `VKWebAppGetPhoneNumber` | 获取手机号 |
| `VKWebAppGetEmail` | 获取邮箱 |
| `VKWebAppGetGroupInfo` | 获取社区信息 |
| `VKWebAppGetGeodata` | 获取地理位置 |
| `VKWebAppGetCommunityToken` | 获取社区 Token |
| `VKWebAppGetConfig` | 获取配置 |
| `VKWebAppGetLaunchParams` | 获取启动参数 |
| `VKWebAppSetTitle` | 设置标题 |
| `VKWebAppGetAuthToken` | 获取用户 Token |
| `VKWebAppCallAPIMethod` | 调用 VK API |
| `VKWebAppJoinGroup` | 加入社区 |
| `VKWebAppLeaveGroup` | 离开社区 |
| `VKWebAppAllowMessagesFromGroup` | 允许社区发送消息 |
| `VKWebAppDenyNotifications` | 禁止通知 |
| `VKWebAppAllowNotifications` | 允许通知 |
| `VKWebAppOpenPayForm` | 打开支付表单 |
| `VKWebAppOpenApp` | 打开其他 Mini App |
| `VKWebAppShare` | 分享 |
| `VKWebAppShowWallPostBox` | 显示发帖框 |
| `VKWebAppScroll` | 页面滚动 |
| `VKWebAppShowOrderBox` | 显示订单框 |
| `VKWebAppShowLeaderBoardBox` | 显示排行榜 |
| `VKWebAppShowInviteBox` | 显示邀请框 |
| `VKWebAppShowRequestBox` | 显示请求框 |
| `VKWebAppAddToFavorites` | 添加收藏 |
| `VKWebAppShowStoryBox` | 发布 Story |
| `VKWebAppStorageGet` | 读取存储 |
| `VKWebAppStorageGetKeys` | 获取存储 Key |
| `VKWebAppStorageSet` | 写入存储 |
| `VKWebAppFlashGetInfo` | 获取 Flash 信息 |
| `VKWebAppSubscribeStoryApp` | 订阅 Story App |
| `VKWebAppOpenWallPost` | 打开帖子 |
| `VKWebAppCheckAllowedScopes` | 检查授权范围 |
| `VKWebAppCheckBannerAd` | 检查 Banner 广告 |
| `VKWebAppHideBannerAd` | 隐藏 Banner 广告 |
| `VKWebAppShowBannerAd` | 显示 Banner 广告 |
| `VKWebAppCheckNativeAds` | 检查原生广告 |
| `VKWebAppShowNativeAds` | 显示原生广告 |
| `VKWebAppRetargetingPixel` | 重定向统计像素 |
| `VKWebAppConversionHit` | 转化统计 |
| `VKWebAppShowSubscriptionBox` | 显示订阅框 |
| `VKWebAppCheckSurvey` | 检查问卷 |
| `VKWebAppShowSurvey` | 显示问卷 |
| `VKWebAppScrollTop` | 滚动到顶部 |
| `VKWebAppScrollTopStart` | 开始监听滚动到顶部 |
| `VKWebAppScrollTopStop` | 停止监听滚动到顶部 |
| `VKWebAppShowSlidesSheet` | 显示幻灯片面板 |
| `VKWebAppTranslate` | 翻译 |
| `VKWebAppRecommend` | 推荐应用 |
| `VKWebAppAddToProfile` | 添加到个人资料 |
| `VKWebAppGetFriends` | 获取好友 |

#### 桌面 Web 专属方法

只有 `IS_DESKTOP_VK === true` 时才会加入静态支持列表：

| 方法 | 功能 |
| --- | --- |
| `VKWebAppResizeWindow` | 调整窗口大小 |
| `VKWebAppAddToMenu` | 添加到菜单 |
| `VKWebAppShowInstallPushBox` | 显示安装 Push 提示框 |
| `VKWebAppShowCommunityWidgetPreviewBox` | 显示社区 Widget 预览 |
| `VKWebAppCallStart` | 发起通话 |
| `VKWebAppCallJoin` | 加入通话 |
| `VKWebAppCallGetStatus` | 获取通话状态 |

### 3.2 `mobile_web`

`mobile_web` 使用公共 Web 方法，但不会加入上面的桌面专属方法；它会加入：

| 方法 | 功能 |
| --- | --- |
| `VKWebAppShowImages` | 显示图片查看器 |

因此，根据当前源码，以下方法在移动 Web 端的静态 `supports()` 判断中为 `false`：

- `VKWebAppResizeWindow`
- `VKWebAppAddToMenu`
- `VKWebAppShowInstallPushBox`
- `VKWebAppShowCommunityWidgetPreviewBox`
- `VKWebAppCallStart`
- `VKWebAppCallJoin`
- `VKWebAppCallGetStatus`

## 4. Web 端明确不能按静态列表依赖的方法

以下方法虽然存在于 `RequestPropsMap` 类型定义中，但没有加入 Web 的 `DESKTOP_METHODS` 静态列表。使用 `bridge.supports()` 时，它们会被判定为不支持。

| 方法 | 说明 |
| --- | --- |
| `VKWebAppOpenCodeReader` | 扫码 / 打开扫码器；普通 Web 端不能依赖 |
| `VKWebAppOpenQR` | 打开二维码相关能力；普通 Web 端不能依赖 |
| `VKWebAppOpenContacts` | 打开联系人选择 |
| `VKWebAppDownloadFile` | 下载文件 |
| `VKWebAppAddToHomeScreen` | 直接添加到主屏 |
| `VKWebAppGetGrantedPermissions` | 获取已授权权限 |
| `VKWebAppGetPersonalCard` | 获取个人卡片信息 |
| `VKWebAppSetViewSettings` | 设置原生 View 外观 |
| `VKWebAppShowMessageBox` | 显示原生消息框 |
| `VKWebAppTapticImpactOccurred` | 触感反馈 |
| `VKWebAppTapticNotificationOccurred` | 触感通知反馈 |
| `VKWebAppTapticSelectionChanged` | 选择变化触感反馈 |
| `VKWebAppSendPayload` | 发送宿主 Payload |
| `VKWebAppDisableSwipeBack` | 禁止返回手势 |
| `VKWebAppEnableSwipeBack` | 启用返回手势 |
| `VKWebAppSetSwipeSettings` | 设置返回手势 |
| `VKWebAppAccelerometerStart` / `VKWebAppAccelerometerStop` | 加速度计 |
| `VKWebAppGyroscopeStart` / `VKWebAppGyroscopeStop` | 陀螺仪 |
| `VKWebAppDeviceMotionStart` / `VKWebAppDeviceMotionStop` | 设备运动传感器 |
| `VKWebAppLibverifyRequest` / `VKWebAppLibverifyCheck` | 手机号验证 |
| `VKWebAppFlashSetLevel` | 设置 Flash 亮度 |
| `VKWebAppAudioPause` | 音频暂停 |
| `OKWebAppCallAPIMethod` | OK 平台 API 调用类型 |
| `VKWebAppTrackEvent` | 追踪事件 |

这里的“不能依赖”是针对当前包的 Web 静态支持判断，不代表 VK 宿主未来不会通过 `SetSupportedHandlers` 动态提供该方法。

## 5. Android 平台

Android 平台没有在 `vk-bridge` 中写死一份和 Web 一样的白名单。源码通过检查原生注入对象判断：

```ts
typeof window.AndroidBridge[method] === 'function'
```

因此 Android 的实际支持情况由当前 VK Android 客户端决定。理论上，只要 Android 原生侧暴露了对应方法，就可以使用；如果没有暴露，`supportsAsync` 会返回 `false`。

常见的 Android 原生能力包括：

- `VKWebAppOpenCodeReader`：扫码
- `VKWebAppOpenQR`：二维码相关能力
- `VKWebAppGetGeodata`：定位
- `VKWebAppGetPhoneNumber`：手机号
- `VKWebAppOpenContacts`：联系人
- `VKWebAppSetViewSettings`：状态栏、导航栏等原生 View 设置
- `VKWebAppTapticImpactOccurred`：触感反馈
- 加速度计、陀螺仪、设备运动传感器
- `VKWebAppDisableSwipeBack`、`VKWebAppEnableSwipeBack`：返回手势

上面是原生平台常见能力分类，不应替代运行时检测。

## 6. iOS / iPadOS 平台

iOS 和 iPadOS 同样不使用 Web 的 `DESKTOP_METHODS` 白名单，而是检查：

```ts
window.webkit.messageHandlers[method]?.postMessage
```

所以实际支持情况由 VK iOS 客户端注入了哪些 `messageHandlers` 决定。

通常 iOS/iPadOS 可以提供移动端原生能力，例如：

- 扫码：`VKWebAppOpenCodeReader`
- 二维码能力：`VKWebAppOpenQR`
- 联系人：`VKWebAppOpenContacts`
- 定位：`VKWebAppGetGeodata`
- 分享、支付、打开 App
- 图片查看、原生消息框
- 触感反馈

仍然建议用 `supportsAsync` 实际确认，因为不同 VK 客户端版本、Messenger 和 iPad 客户端的能力可能不同。

## 7. React Native WebView

React Native 容器使用：

```ts
window.ReactNativeWebView.postMessage(
  JSON.stringify({
    handler: method,
    params,
  }),
);
```

这里的 `vk-bridge` 只负责把方法名和参数发给 React Native 宿主，具体支持哪些方法由宿主实现决定。因此不能仅根据 `vk_platform` 判断 React Native 容器是否支持扫码、定位或支付。

## 8. 方法支持矩阵

下表是面向开发决策的简化矩阵：

| 能力 | `desktop_web` | `mobile_web` | Android | iOS / iPadOS | React Native |
| --- | --- | --- | --- | --- | --- |
| 初始化 | 支持 | 支持 | 由宿主决定 | 由宿主决定 | 由宿主决定 |
| 用户信息 | 支持 | 支持 | 由宿主决定 | 由宿主决定 | 由宿主决定 |
| API 调用 | 支持 | 支持 | 由宿主决定 | 由宿主决定 | 由宿主决定 |
| 分享 | 支持 | 支持 | 由宿主决定 | 由宿主决定 | 由宿主决定 |
| 支付 | 支持 | 支持 | 由宿主决定 | 由宿主决定 | 由宿主决定 |
| 图片查看 | 静态列表不包含 | 支持 | 由宿主决定 | 由宿主决定 | 由宿主决定 |
| 扫码 | 静态列表不支持 | 静态列表不支持 | 由宿主决定，通常支持 | 由宿主决定，通常支持 | 由宿主决定 |
| 定位 | 支持 | 支持 | 由宿主决定 | 由宿主决定 | 由宿主决定 |
| 触感反馈 | 静态列表不支持 | 静态列表不支持 | 由宿主决定 | 由宿主决定 | 由宿主决定 |
| 传感器 | 静态列表不支持 | 静态列表不支持 | 由宿主决定 | 由宿主决定 | 由宿主决定 |
| 调整窗口 | 支持 | 静态列表不支持 | 不适用或由宿主决定 | 不适用或由宿主决定 | 由宿主决定 |

## 9. 推荐的兼容写法

不要直接按照 `vk_platform` 判断某个方法一定存在：

```ts
// 不推荐
if (vk_platform === 'mobile_android') {
  await bridge.send('VKWebAppOpenCodeReader');
}
```

建议统一进行运行时检查：

```ts
async function openScanner() {
  const supported = await bridge.supportsAsync('VKWebAppOpenCodeReader');

  if (!supported) {
    return {
      supported: false,
      reason: '当前宿主不支持 VKWebAppOpenCodeReader',
    };
  }

  await bridge.send('VKWebAppOpenCodeReader');

  return { supported: true };
}
```

## 10. 源码依据

- Web 静态方法列表：[`src/bridge.ts:40-117`](../node_modules/@vkontakte/vk-bridge/src/bridge.ts#L40-L117)
- Android 方法检查：[`src/bridge.ts:224-227`](../node_modules/@vkontakte/vk-bridge/src/bridge.ts#L224-L227)
- iOS 方法检查：[`src/bridge.ts:228-230`](../node_modules/@vkontakte/vk-bridge/src/bridge.ts#L228-L230)
- Web 动态支持查询：[`src/bridge.ts:344-357`](../node_modules/@vkontakte/vk-bridge/src/bridge.ts#L344-L357)
- 方法类型定义：[`src/types/data.ts:1118-1224`](../node_modules/@vkontakte/vk-bridge/src/types/data.ts#L1118-L1224)
