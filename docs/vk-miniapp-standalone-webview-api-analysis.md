# VK Mini App 脱离 VK 宿主后的接口与 Bridge 分析

本文档分析以下场景：

1. Mini App 原本面向 VK 宿主环境运行。
2. 现在将 Mini App 放进普通 WebView。
3. WebView 先打开 VK 官网完成登录。
4. 登录完成后再跳回 Mini App。

分析依据为项目当前安装的 `@vkontakte/vk-bridge@3.0.2` 源码和类型定义。

## 1. 先给结论

### 1.1 不同平台的 API 数量不一致

不一致，原因有三层：

- `vk-bridge` 的 TypeScript 类型只是完整接口声明，不代表所有平台都实现。
- Web 平台在源码中有一份静态方法白名单，Android/iOS 则检查宿主注入了哪些方法。
- 即使同一个平台，不同 VK 客户端版本、Messenger、iPad 客户端也可能返回不同的支持方法集合。

因此，不能把“类型定义中存在”理解成“所有平台都支持”。

### 1.2 所有 `VKWebApp*` 调用在协议层都属于 Bridge 调用

例如：

```ts
await bridge.send('VKWebAppGetUserInfo');
await bridge.send('VKWebAppOpenCodeReader');
await bridge.send('VKWebAppOpenPayForm', params);
```

这些调用最终都需要某个宿主接收请求并返回事件。区别只是底层传输可能是：

- Android：`window.AndroidBridge`
- iOS/iPadOS：`window.webkit.messageHandlers`
- React Native：`window.ReactNativeWebView.postMessage`
- Web Mini App：`window.parent.postMessage`

如果放进普通 WebView 后没有 VK 宿主或自定义宿主处理这些消息，`vk-bridge` 仍然可以被导入，但调用不会产生有效的 VK 能力。

### 1.3 登录 VK 官网不会自动恢复 VK Mini App 宿主能力

在普通 WebView 中登录 VK 官网，通常只能获得 VK 网站的登录 Cookie。它不会自动生成：

- `window.AndroidBridge`
- `window.webkit.messageHandlers`
- VK Web Mini App 的父页面消息处理器
- Mini App 的合法启动参数和签名
- Mini App 所需的 Access Token

因此，“登录成功”与“Mini App Bridge 可用”是两件不同的事情。

## 2. 特殊场景下 `vk_platform` 的判断

### 2.1 `vk_platform` 不会因为登录而自动变成 `mobile_web`

当前源码判断移动 Web 的方式是：

```ts
const IS_MVK =
  IS_WEB && /(^\?|&)vk_platform=mobile_web(&|$)/.test(location.search);
```

也就是说，必须满足：

1. 页面处于 Web 分支，即没有 `AndroidBridge`，也没有 iOS WebKit Bridge。
2. 当前 URL 的 query string 中明确存在 `vk_platform=mobile_web`。

例如：

```text
https://example.com/miniapp?vk_platform=mobile_web
```

这种情况下，`vk-bridge` 的 `IS_MVK` 才会是 `true`。

如果登录完成后跳回：

```text
https://example.com/miniapp
```

没有保留 `vk_platform=mobile_web`，那么：

- `parseURLSearchParamsForGetLaunchParams` 得不到该字段；
- `IS_MVK` 为 `false`；
- `IS_DESKTOP_VK` 可能反而为 `true`，因为源码把所有非 MVK 的 Web 环境归入桌面 Web 分支。

### 2.2 即使 URL 中写了 `mobile_web`，也只是一个标识

普通 WebView 可以手动拼接：

```text
?vk_platform=mobile_web
```

但这只会改变前端对 URL 的解析结果，不会：

- 创建 VK 宿主；
- 注入 Bridge 对象；
- 给 `window.parent` 增加 VK 消息处理逻辑；
- 证明用户真的从 VK 移动 Web 入口打开了 Mini App。

因此，不能把客户端传入的 `vk_platform` 当成可信的身份或宿主证明。

## 3. 特殊场景下是否存在 Bridge

需要区分“npm 包中的 Bridge 对象”和“真正可工作的 VK 宿主通信通道”。

### 3.1 `import bridge` 仍然存在

页面仍然可以正常执行：

```ts
import bridge from '@vkontakte/vk-bridge';
```

这只表示 JavaScript Bridge 封装对象存在。

### 3.2 默认普通 WebView 通常没有可用的 VK Bridge

如果普通 WebView 没有注入以下对象：

```ts
window.AndroidBridge
window.webkit?.messageHandlers
window.ReactNativeWebView?.postMessage
```

`vk-bridge` 会进入 Web 分支，并把消息发送到：

```ts
window.parent.postMessage(message, '*');
```

如果当前页面是 WebView 顶层页面，通常有：

```ts
window.parent === window
```

这时消息只是发给当前窗口自身，并没有 VK 页面接收和处理它。除非你的普通 WebView 宿主或父页面主动实现了 VK Bridge 协议，否则它不能提供 VK API。

### 3.3 特殊情况下可能存在自定义 Bridge

如果普通 WebView 是由你自己的 Android、iOS 或 React Native 应用承载，并且你主动注入了对应接口，那么通信可以存在：

| 注入对象 | 通信方式 | 能力来源 |
| --- | --- | --- |
| `window.AndroidBridge` | 方法名对应函数，参数为 JSON 字符串 | 你自己的 Android 宿主实现 |
| `window.webkit.messageHandlers` | `postMessage(data)` | 你自己的 iOS 宿主实现 |
| `window.ReactNativeWebView` | `postMessage(JSON.stringify(...))` | 你自己的 React Native 宿主实现 |
| 没有原生对象，但父页面处理消息 | `window.parent.postMessage` | 你自己的父页面实现 |

这时存在的是“兼容 VK Bridge 消息格式的自定义宿主”，不是 VK 官方宿主能力。你需要自己实现响应事件、错误格式、权限、登录态和安全校验。

## 4. `vk-bridge` 当前的能力判断逻辑

### Android

```ts
typeof window.AndroidBridge[method] === 'function'
```

### iOS / iPadOS

```ts
typeof window.webkit.messageHandlers[method].postMessage === 'function'
```

### Web

旧的同步接口 `bridge.supports()` 使用源码中的 `DESKTOP_METHODS` 静态列表。

异步接口 `bridge.supportsAsync()` 会通过 `SetSupportedHandlers` 从宿主查询支持列表：

```ts
const supported = await bridge.supportsAsync(method);
```

在完全没有宿主响应的普通 WebView 中，查询会超时或失败，源码最终只保留 `VKWebAppInit` 作为兜底支持项。这并不代表普通 WebView 真正实现了 `VKWebAppInit`，只是库的失败兜底行为。

## 5. 全量接口的分类方法

下面的分类不是简单按照方法名字，而是按照“脱离 VK 宿主后还能否完整实现”来划分。

### A 类：必须依赖 Bridge 才能完整实现的宿主能力

这些接口的完整语义由 VK 宿主负责。普通 WebView 即使有 VK 登录 Cookie，也不能仅靠 Cookie 复现完整行为。

#### 生命周期、宿主配置和上下文

```text
VKWebAppInit
VKWebAppGetConfig
VKWebAppGetLaunchParams
VKWebAppUpdateConfig       // 接收事件
VKWebAppUpdateInsets       // 接收事件
VKWebAppClose
VKWebAppViewHide           // 接收事件
VKWebAppViewRestore        // 接收事件
VKWebAppGetClientVersion
VKWebAppSendToClient
VKWebAppSetLocation
VKWebAppSetTitle
VKWebAppChangeFragment     // 接收事件/响应
```

原因：这些接口依赖宿主维护的 Mini App 容器、Frame、导航栈、窗口和启动上下文。

#### 原生 UI、系统能力和设备能力

```text
VKWebAppOpenCodeReader
VKWebAppOpenQR
VKWebAppOpenContacts
VKWebAppSetViewSettings
VKWebAppShowMessageBox
VKWebAppResizeWindow
VKWebAppAddToMenu
VKWebAppCopyText
VKWebAppDownloadFile
VKWebAppTapticImpactOccurred
VKWebAppTapticNotificationOccurred
VKWebAppTapticSelectionChanged
VKWebAppGetGeodata
VKWebAppAccelerometerStart
VKWebAppAccelerometerStop
VKWebAppGyroscopeStart
VKWebAppGyroscopeStop
VKWebAppDeviceMotionStart
VKWebAppDeviceMotionStop
VKWebAppAccelerometerChanged       // 接收事件
VKWebAppGyroscopeChanged           // 接收事件
VKWebAppDeviceMotionChanged        // 接收事件
VKWebAppLocationChanged            // 接收事件
VKWebAppDisableSwipeBack
VKWebAppEnableSwipeBack
VKWebAppSetSwipeSettings
```

浏览器可能有部分替代能力，但替代能力不等价于 VK 接口。例如：

- `VKWebAppOpenCodeReader` 不等于自己调用摄像头扫描二维码；
- `VKWebAppGetGeodata` 不等于浏览器 `navigator.geolocation`；
- `VKWebAppCopyText` 不等于 `navigator.clipboard.writeText`；
- `VKWebAppSetViewSettings` 不等于修改网页 CSS；
- `VKWebAppDisableSwipeBack` 不等于监听浏览器返回事件。

#### VK 宿主弹窗、支付和其他宿主交互

```text
VKWebAppOpenApp
VKWebAppOpenPayForm
VKWebAppShare
VKWebAppShowImages
VKWebAppShowWallPostBox
VKWebAppShowOrderBox
VKWebAppShowLeaderBoardBox
VKWebAppShowInviteBox
VKWebAppShowRequestBox
VKWebAppShowCommunityWidgetPreviewBox
VKWebAppShowSlidesSheet
VKWebAppShowStoryBox
VKWebAppOpenWallPost
```

如果需要完整使用 VK 的支付、分享、社区弹窗、Story 或帖子流程，必须有 VK 宿主或一个真正实现了这些协议的自定义宿主。

#### VK 存储

```text
VKWebAppStorageGet
VKWebAppStorageGetKeys
VKWebAppStorageSet
```

可以用 `localStorage` 或 IndexedDB 替代本地存储，但这不等价于 VK 存储：

- 数据不会自动与 VK 用户绑定；
- 不会跨设备同步；
- 不会沿用 VK Mini App 的存储权限和生命周期；
- 不一定遵循 VK 宿主的容量和清理策略。

## 6. B 类：VK 生态强绑定接口

这些接口从技术上可以尝试通过 VK Web API、自己的后端或自定义 UI 重新实现，但需要深入理解 VK 的授权、签名、用户身份、社区权限和业务流程。它们不是简单替换一个 HTTP 请求就能完整复现的。

### B1. 用户身份、授权和隐私数据

```text
VKWebAppGetAuthToken
VKWebAppGetCommunityToken
VKWebAppGetCommunityAuthToken
VKWebAppGetUserInfo
VKWebAppGetFriends
VKWebAppGetPhoneNumber
VKWebAppGetEmail
VKWebAppGetPersonalCard
VKWebAppGetGrantedPermissions
VKWebAppCheckAllowedScopes
VKWebAppCreateHash
VKWebAppLibverifyRequest
VKWebAppLibverifyCheck
VKWebAppLibverifyOnConfirmed       // 接收事件
VKWebAppLibverifyOnFailed          // 接收事件
```

重点问题：

- VK 官网 Cookie 不一定等于 Mini App Access Token。
- 前端自己传入 `user_id` 或 `vk_platform` 不可信。
- 手机号、邮箱、个人卡片等数据通常带有签名或隐私授权控制。
- 需要验证 VK 返回的 `sign`、Token、过期时间和授权范围。

### B2. 社交关系和社区操作

```text
VKWebAppAddToCommunity
VKWebAppJoinGroup
VKWebAppLeaveGroup
VKWebAppAllowMessagesFromGroup
VKWebAppAllowNotifications
VKWebAppDenyNotifications
VKWebAppGetGroupInfo
VKWebAppAddToFavorites
VKWebAppAddToProfile
VKWebAppRecommend
VKWebAppSubscribeStoryApp
VKWebAppSendPayload
```

这些接口不仅需要调用 VK API，还涉及当前用户、社区管理员权限、社区配置、消息回调和 VK 客户端 UI。

### B3. 动态内容、分享和社区内容

```text
VKWebAppShowWallPostBox
VKWebAppOpenWallPost
VKWebAppShowStoryBox
VKWebAppShare
VKWebAppShowInviteBox
VKWebAppShowRequestBox
VKWebAppShowLeaderBoardBox
VKWebAppShowCommunityWidgetPreviewBox
VKWebAppShowSubscriptionBox
VKWebAppShowSurvey
VKWebAppCheckSurvey
VKWebAppTranslate
```

可以自行画一个分享框或帖子界面，但想得到 VK 原生分享结果、帖子 ID、邀请状态、问卷状态或订阅状态，需要复现 VK 的业务协议。

### B4. 支付、广告和统计

```text
VKWebAppOpenPayForm
VKWebAppShowOrderBox
VKWebAppCheckBannerAd
VKWebAppHideBannerAd
VKWebAppShowBannerAd
VKWebAppBannerAdUpdated          // 接收事件
VKWebAppBannerAdClosedByUser     // 接收事件
VKWebAppCheckNativeAds
VKWebAppShowNativeAds
VKWebAppInitAds                  // 接收事件
VKWebAppLoadAds                  // 接收事件
VKWebAppRetargetingPixel
VKWebAppConversionHit
VKWebAppTrackEvent
```

这些接口与 VK 的支付订单、广告填充、广告归因、统计账户和宿主展示容器绑定。即使能够发出同名消息，没有 VK 宿主或服务端协议，也无法产生有效的 VK 业务结果。

### B5. API 调用入口

```text
VKWebAppCallAPIMethod
OKWebAppCallAPIMethod
```

> 兼容性注意：当前源码的 `DESKTOP_METHODS` 中包含 `VKWebAppGetCommunityAuthToken` 和 `VKWebAppSetTitle`，但它们没有出现在本地 `RequestPropsMap` 的键列表中。这说明该版本的静态 Web 支持表与 TypeScript 请求类型并非完全一致；实际调用前应以当前安装包的类型检查结果和 `supportsAsync` 返回值为准。

`VKWebAppCallAPIMethod` 本身是 Bridge 提供的 API 代理入口，但 VK API 也可以在满足授权、Token、CORS 和安全校验的情况下由服务端直接调用。

因此它属于“可替代传输，但强绑定 VK 业务”的接口：

- 没有有效 VK Token 时，普通 WebView 的登录 Cookie 不能直接替代它；
- 将 Token 放在前端会增加泄露风险；
- 更稳妥的方案是由自己的后端保存并调用 VK API。

## 7. C 类：可以不依赖 Bridge 的替代功能

严格来说，下面这些不是“VK Bridge 接口仍然可用”，而是可以使用标准浏览器能力或自己的后端重新实现。

| 原 VK 能力 | 可替代方案 | 是否等价 |
| --- | --- | --- |
| `VKWebAppCopyText` | `navigator.clipboard.writeText` | 不完全等价 |
| `VKWebAppOpenCodeReader` | `getUserMedia` + QR 识别库 | 不等价 |
| `VKWebAppOpenQR` | 摄像头 + QR 识别库 | 不等价 |
| `VKWebAppGetGeodata` | `navigator.geolocation` | 不等价 |
| `VKWebAppDownloadFile` | `<a download>`、Blob、Fetch | 通常可替代 |
| `VKWebAppShowImages` | 自己实现图片预览器 | 通常可替代 |
| `VKWebAppShare` | Web Share API 或自定义分享页 | 不等价 |
| `VKWebAppStorageGet/Set` | `localStorage`、IndexedDB | 不等价 |
| `VKWebAppShowMessageBox` | HTML/CSS 自定义弹窗 | 不等价 |
| `VKWebAppShowWallPostBox` | 自己实现发帖表单 + 后端 API | 需要 VK API，不等价 |
| `VKWebAppCallAPIMethod` | 自己的后端请求 VK API | 需要 Token，不等价 |
| `VKWebAppTaptic*` | 普通 Web 没有可靠通用替代 | 不可完全替代 |
| 传感器接口 | Device Motion / Generic Sensor API | 受浏览器权限和兼容性限制 |

真正完全不依赖 Bridge 的部分，通常是 Mini App 自己的业务代码：

- DOM 和 CSS；
- 页面路由；
- 表单校验；
- 自己的后端 API；
- 自己的数据库；
- WebSocket；
- IndexedDB / localStorage；
- Web Crypto；
- Canvas、音视频和文件处理；
- 浏览器支持的摄像头、定位、分享、通知等能力。

但这些能力只能实现你的应用功能，不能自动获得 VK 用户身份、VK 社交关系、VK 支付状态或 VK 原生容器能力。

## 8. 全量请求接口清单与分类

以下是当前 `RequestPropsMap` 中声明的请求接口。这里的“可替代”表示可以用浏览器或自己的后端重做部分功能，不表示仍然可以直接调用同名 VK Bridge 方法。

### 8.1 宿主 / 原生能力类

```text
VKWebAppInit
VKWebAppGetConfig
VKWebAppGetLaunchParams
VKWebAppUpdateConfig
VKWebAppUpdateInsets
VKWebAppClose
VKWebAppGetClientVersion
VKWebAppSendToClient
VKWebAppSetLocation
VKWebAppChangeFragment
VKWebAppResizeWindow
VKWebAppAddToMenu
VKWebAppCopyText
VKWebAppDownloadFile
VKWebAppOpenCodeReader
VKWebAppOpenQR
VKWebAppOpenContacts
VKWebAppGetGeodata
VKWebAppSetViewSettings
VKWebAppShowMessageBox
VKWebAppDisableSwipeBack
VKWebAppEnableSwipeBack
VKWebAppSetSwipeSettings
VKWebAppTapticImpactOccurred
VKWebAppTapticNotificationOccurred
VKWebAppTapticSelectionChanged
VKWebAppAccelerometerStart
VKWebAppAccelerometerStop
VKWebAppGyroscopeStart
VKWebAppGyroscopeStop
VKWebAppDeviceMotionStart
VKWebAppDeviceMotionStop
```

### 8.2 身份、权限、用户和社区类

```text
VKWebAppGetAuthToken
VKWebAppGetCommunityToken
VKWebAppGetCommunityAuthToken
VKWebAppGetUserInfo
VKWebAppGetFriends
VKWebAppGetPhoneNumber
VKWebAppGetEmail
VKWebAppGetPersonalCard
VKWebAppGetGrantedPermissions
VKWebAppCheckAllowedScopes
VKWebAppGetGroupInfo
VKWebAppAddToCommunity
VKWebAppJoinGroup
VKWebAppLeaveGroup
VKWebAppAllowMessagesFromGroup
VKWebAppAllowNotifications
VKWebAppDenyNotifications
VKWebAppAddToFavorites
VKWebAppAddToProfile
VKWebAppRecommend
VKWebAppSubscribeStoryApp
VKWebAppSendPayload
```

### 8.3 VK 内容、弹窗和社交交互类

```text
VKWebAppOpenApp
VKWebAppOpenPayForm
VKWebAppShare
VKWebAppShowImages
VKWebAppShowWallPostBox
VKWebAppOpenWallPost
VKWebAppShowOrderBox
VKWebAppShowLeaderBoardBox
VKWebAppShowInviteBox
VKWebAppShowRequestBox
VKWebAppShowCommunityWidgetPreviewBox
VKWebAppShowStoryBox
VKWebAppShowSubscriptionBox
VKWebAppShowSurvey
VKWebAppCheckSurvey
VKWebAppShowSlidesSheet
VKWebAppTranslate
VKWebAppCallStart
VKWebAppCallJoin
VKWebAppCallGetStatus
```

### 8.4 存储、广告、统计和校验类

```text
VKWebAppStorageGet
VKWebAppStorageGetKeys
VKWebAppStorageSet
VKWebAppFlashGetInfo
VKWebAppFlashSetLevel
VKWebAppAudioPause
VKWebAppCheckBannerAd
VKWebAppHideBannerAd
VKWebAppShowBannerAd
VKWebAppShowNativeAds
VKWebAppCheckNativeAds
VKWebAppRetargetingPixel
VKWebAppConversionHit
VKWebAppTrackEvent
VKWebAppLibverifyRequest
VKWebAppLibverifyCheck
VKWebAppCreateHash
VKWebAppCallAPIMethod
OKWebAppCallAPIMethod
```

### 8.5 仅作为响应或事件出现的接口名

下面这些名称主要出现在响应或宿主事件中，不应该当作普通请求方法主动调用：

```text
VKWebAppUpdateConfig
VKWebAppUpdateInsets
VKWebAppViewHide
VKWebAppViewRestore
VKWebAppAccelerometerChanged
VKWebAppGyroscopeChanged
VKWebAppDeviceMotionChanged
VKWebAppLocationChanged
VKWebAppAudioPaused
VKWebAppAudioStopped
VKWebAppAudioTrackChanged
VKWebAppAudioUnpaused
VKWebAppInitAds
VKWebAppLoadAds
VKWebAppBannerAdUpdated
VKWebAppBannerAdClosedByUser
VKWebAppLibverifyOnConfirmed
VKWebAppLibverifyOnFailed
VKWebAppChangeFragment
```

## 9. 普通 WebView 场景的实际可用性矩阵

| 能力 | 仅登录 VK 官网 | 有 VK 官方 Web 宿主 | 有自定义 Bridge 宿主 | 完全自实现 |
| --- | --- | --- | --- | --- |
| 读取 VK 登录 Cookie | 可以 | 可以 | 可以 | 不适用 |
| 得到可信 Mini App 启动参数 | 不保证 | 可以 | 需要自定义签名协议 | 需要自己定义 |
| `VKWebAppInit` | 通常不可用 | 可以 | 自己实现 | 不适用 |
| `VKWebAppGetUserInfo` | 不保证 | 可以 | 自己实现用户协议 | 需要自己的用户系统 |
| `VKWebAppOpenCodeReader` | 不可直接使用 | 宿主支持时可用 | 宿主实现时可用 | 摄像头 + 自己的扫码库 |
| `VKWebAppOpenPayForm` | 不可直接使用 | 宿主支持时可用 | 需要自己实现支付协议 | 自己接入支付系统 |
| `VKWebAppCallAPIMethod` | 无 Token 时不可用 | 可以 | 需要 Token 和协议 | 后端直接调用 VK API |
| VK 原生分享 / 帖子 / Story | 不可直接使用 | 宿主支持时可用 | 自己实现并接 VK API | 自己实现业务 |
| VK 用户存储 | 不可直接使用 | 可以 | 自己实现 | IndexedDB / 后端 |
| 页面 UI 和业务逻辑 | 可以 | 可以 | 可以 | 可以 |

## 10. 推荐架构

如果目标是“普通 WebView 中仍然使用 VK 身份和 VK 数据”，建议不要试图伪造完整的官方 Bridge，而是拆成两层：

```text
普通 WebView Mini App
        ↓ HTTPS
自己的后端
        ↓ 服务端保存和调用
VK OAuth / VK API
```

建议：

1. 在服务端完成 VK 登录回调和 Token 管理。
2. 服务端验证 VK 返回的 `state`、`sign`、Token 和过期时间。
3. WebView 只拿自己系统的短期 Session，不直接长期保存 VK Token。
4. 普通 WebView 中对原生能力使用浏览器 API或自定义 UI。
5. 只有确实需要 VK 原生 UI、VK 支付、VK 社交弹窗、宿主身份和原生设备能力时，才回到 VK 官方宿主或实现一个明确的自定义宿主协议。

## 11. 最终判断

在“普通 WebView + 跳转 VK 官网登录 + 跳回 Mini App”场景中：

1. `vk_platform` 不会自动被识别为 `mobile_web`。只有 URL 显式带有 `vk_platform=mobile_web` 时，当前源码才会把它识别为移动 Web；这个值本身不可信。
2. `@vkontakte/vk-bridge` 的 JavaScript 对象仍然存在，但默认没有真正可用的 VK Bridge 宿主。
3. 没有原生注入对象时，底层通信会退化为 `window.parent.postMessage`。在顶层普通 WebView 中，它通常不会到达 VK 宿主，因此不能完成 VK API 调用。
4. 只有纯 Web 业务、自己的后端和部分浏览器能力可以完全脱离 Bridge。
5. VK 身份、启动参数、授权、支付、广告、社交关系、社区操作和原生能力都不能仅靠“登录过 VK 官网”完整恢复。

## 12. 源码依据

- Web 环境判断：[`src/bridge.ts:11-35`](../node_modules/@vkontakte/vk-bridge/src/bridge.ts#L11-L35)
- Web、Android、iOS、React Native 的发送方式：[`src/bridge.ts:162-199`](../node_modules/@vkontakte/vk-bridge/src/bridge.ts#L162-L199)
- Android/iOS 的方法支持检测：[`src/bridge.ts:224-233`](../node_modules/@vkontakte/vk-bridge/src/bridge.ts#L224-L233)
- `supportsAsync` 和 `SetSupportedHandlers`：[`src/bridge.ts:344-358`](../node_modules/@vkontakte/vk-bridge/src/bridge.ts#L344-L358)
- 全量请求接口类型：[`src/types/data.ts:1118-1224`](../node_modules/@vkontakte/vk-bridge/src/types/data.ts#L1118-L1224)
- 全量响应类型：[`src/types/data.ts:1229-1350`](../node_modules/@vkontakte/vk-bridge/src/types/data.ts#L1229-L1350)
- 平台枚举：[`src/types/data/values.ts:22-32`](../node_modules/@vkontakte/vk-bridge/src/types/data/values.ts#L22-L32)
