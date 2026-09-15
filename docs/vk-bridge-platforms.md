# VK Bridge 平台与通信方式

本文档基于项目当前安装的 `@vkontakte/vk-bridge@3.0.2` 源码整理。

## 1. 先区分两个概念

VK Mini App 中经常会同时遇到两个概念：

- `vk_platform`：启动参数中的平台标识，表示 Mini App 从哪里打开。
- Bridge 对象：当前页面和 VK 宿主之间实际通信时使用的 JavaScript 接口。

两者不是一一对应关系。`vk-bridge` 不会根据每一个 `vk_platform` 创建一个独立的 Bridge，而是根据运行环境中是否存在特定的全局对象来选择通信方式。

## 2. 全部平台标识

当前包在 `src/types/data/values.ts` 中声明了以下平台：

| `vk_platform` | 常见运行位置 | 通常使用的 Bridge | 通信类型 |
| --- | --- | --- | --- |
| `desktop_web` | 桌面浏览器中的 `vk.ru` | Web Bridge | `window.parent.postMessage` |
| `desktop_web_messenger` | Web Messenger | Web Bridge | `window.parent.postMessage` |
| `desktop_app_messenger` | 桌面 Messenger 应用 | 通常按 Web Bridge 处理 | `window.parent.postMessage` |
| `mobile_web` | 移动浏览器中的 `m.vk.ru` | Web Bridge | `window.parent.postMessage` |
| `mobile_android` | VK Android 客户端 | Android Bridge | `window.AndroidBridge` |
| `mobile_android_messenger` | VK Messenger Android 客户端 | Android Bridge | `window.AndroidBridge` |
| `mobile_iphone` | VK iPhone 客户端 | iOS WebKit Bridge | `window.webkit.messageHandlers` |
| `mobile_iphone_messenger` | VK Messenger iPhone 客户端 | iOS WebKit Bridge | `window.webkit.messageHandlers` |
| `mobile_ipad` | VK iPad 客户端 | iOS WebKit Bridge | `window.webkit.messageHandlers` |

定义位置：[`src/types/data/values.ts`](../node_modules/@vkontakte/vk-bridge/src/types/data/values.ts)。

> `desktop_app_messenger` 在当前 `vk-bridge` 源码中没有单独的 `DesktopBridge` 判断。如果桌面 Messenger 没有注入 Android/iOS/React Native Bridge，它会走 Web Bridge 的 `parent.postMessage` 路径。

## 3. Bridge 对象和发送格式

### 3.1 Android Bridge

检测条件：

```ts
Boolean(window.AndroidBridge)
```

调用方式：

```ts
window.AndroidBridge[method](JSON.stringify(params));
```

特点：

- `method` 是方法名，例如 `VKWebAppGetUserInfo`。
- 参数会先通过 `JSON.stringify` 转成字符串。
- Android 原生侧需要按照方法名暴露对应函数。
- Android 平台收到的事件类型是 `VKWebAppEvent`。

示例：

```ts
window.AndroidBridge.VKWebAppGetUserInfo('{}');
```

源码位置：[`src/bridge.ts:122-124`](../node_modules/@vkontakte/vk-bridge/src/bridge.ts#L122-L124)、[`src/bridge.ts:166-170`](../node_modules/@vkontakte/vk-bridge/src/bridge.ts#L166-L170)。

适用平台：

- `mobile_android`
- `mobile_android_messenger`

### 3.2 iOS / iPadOS WebKit Bridge

检测条件：

```ts
Boolean(window.webkit?.messageHandlers?.VKWebAppClose)
```

调用方式：

```ts
window.webkit.messageHandlers[method].postMessage(params);
```

特点：

- 每个 Bridge 方法对应一个 `messageHandlers` 项。
- 参数直接传给 `postMessage`，不会像 Android 一样在 `vk-bridge` 中统一转成 JSON 字符串。
- iOS、iPadOS 和 iOS Messenger 使用这类 WebKit 注入接口。
- iOS 平台收到的事件类型是 `VKWebAppEvent`。

示例：

```ts
window.webkit.messageHandlers.VKWebAppGetUserInfo.postMessage({});
```

源码位置：[`src/bridge.ts:17-20`](../node_modules/@vkontakte/vk-bridge/src/bridge.ts#L17-L20)、[`src/bridge.ts:126-128`](../node_modules/@vkontakte/vk-bridge/src/bridge.ts#L126-L128)、[`src/bridge.ts:172-175`](../node_modules/@vkontakte/vk-bridge/src/bridge.ts#L172-L175)。

适用平台：

- `mobile_iphone`
- `mobile_iphone_messenger`
- `mobile_ipad`

### 3.3 React Native WebView Bridge

检测条件：

```ts
Boolean(
  window.ReactNativeWebView &&
    typeof window.ReactNativeWebView.postMessage === 'function',
)
```

调用方式：

```ts
window.ReactNativeWebView.postMessage(
  JSON.stringify({
    handler: method,
    params,
  }),
);
```

这不是一个单独的 `vk_platform` 值，而是 `vk-bridge` 支持的一种 WebView 容器通信方式。它可能被自定义的 React Native 宿主使用。

源码位置：[`src/bridge.ts:22-26`](../node_modules/@vkontakte/vk-bridge/src/bridge.ts#L22-L26)、[`src/bridge.ts:177-185`](../node_modules/@vkontakte/vk-bridge/src/bridge.ts#L177-L185)。

### 3.4 Web Bridge

Web 环境下，`vk-bridge` 将消息发送给父窗口：

```ts
window.parent.postMessage(
  {
    handler: method,
    params,
    type: 'vk-connect',
    webFrameId,
    connectVersion,
  },
  '*',
);
```

特点：

- 适用于 Web Mini App iframe 场景。
- `desktop_web` 和 `mobile_web` 都使用这一通信方式。
- Web Messenger 通常也走这一方式。
- Web 侧接收事件使用浏览器的 `message` 事件。
- `VKWebAppSettings` 事件会用于设置当前 `webFrameId`。

源码位置：[`src/bridge.ts:28-35`](../node_modules/@vkontakte/vk-bridge/src/bridge.ts#L28-L35)、[`src/bridge.ts:130-133`](../node_modules/@vkontakte/vk-bridge/src/bridge.ts#L130-L133)、[`src/bridge.ts:187-198`](../node_modules/@vkontakte/vk-bridge/src/bridge.ts#L187-L198)。

适用平台：

- `desktop_web`
- `desktop_web_messenger`
- `desktop_app_messenger`（当前源码没有其他专用 Bridge 时）
- `mobile_web`

## 4. `vk-bridge` 的实际判断顺序

发送请求时，当前源码按照以下顺序选择通信方式：

```text
window.AndroidBridge
        ↓ 不存在或没有对应方法
window.webkit.messageHandlers
        ↓ 不存在或没有对应方法
window.ReactNativeWebView.postMessage
        ↓ 不存在
window.parent.postMessage
```

对应实现位于 [`src/bridge.ts:162-199`](../node_modules/@vkontakte/vk-bridge/src/bridge.ts#L162-L199)。

因此，判断当前运行环境时，不建议只根据 `vk_platform` 推断 Bridge。更可靠的是检查包导出的环境常量：

```ts
import {
  IS_ANDROID_WEBVIEW,
  IS_IOS_WEBVIEW,
  IS_REACT_NATIVE_WEBVIEW,
  IS_WEB,
  IS_MVK,
  IS_DESKTOP_VK,
} from '@vkontakte/vk-bridge';
```

也可以使用：

```ts
bridge.isWebView();
bridge.isIframe();
bridge.isEmbedded();
bridge.isStandalone();
```

## 5. 事件通信方式

| 运行环境 | 发送方式 | 接收事件方式 |
| --- | --- | --- |
| Android WebView | `window.AndroidBridge[method](json)` | `VKWebAppEvent` |
| iOS / iPadOS WebView | `window.webkit.messageHandlers[method].postMessage(data)` | `VKWebAppEvent` |
| React Native WebView | `window.ReactNativeWebView.postMessage(json)` | 通常为 `message`，Android RN 特殊情况下监听 `document` |
| Web iframe | `window.parent.postMessage(data, '*')` | `window` 的 `message` 事件 |

源码中 WebView 事件会直接传给订阅者；Web 环境则从 `event.data` 中读取 `type` 和 `data`，再转换成 VK Bridge 事件格式。详见 [`src/bridge.ts:294-335`](../node_modules/@vkontakte/vk-bridge/src/bridge.ts#L294-L335)。

## 6. 结论

- 安卓 VK Mini App：`window.AndroidBridge`。
- 安卓 Messenger：通常同样是 `window.AndroidBridge`。
- iPhone / iPad VK Mini App：`window.webkit.messageHandlers`。
- iOS Messenger：通常同样是 `window.webkit.messageHandlers`。
- 移动 Web、桌面 Web、Web Messenger：`window.parent.postMessage`。
- React Native 容器：`window.ReactNativeWebView.postMessage`。
- `vk_platform` 只说明启动来源；真正的 Bridge 类型应以页面中注入的对象为准。
