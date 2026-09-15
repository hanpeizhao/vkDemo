# VK 小程序示例

这是一个基于 [VK Bridge](https://github.com/VKCOM/vk-bridge)、[VKUI](https://github.com/VKCOM/VKUI) 和 [VK Miniapps Router](https://github.com/VKCOM/vk-mini-apps-router) 的 VK 小程序示例项目。

项目使用 [Vite](https://vite.dev/) 作为构建工具，适合用来学习 VK 小程序的基础结构和开发流程。

## 🚀 启动小程序

先安装依赖，再运行开发服务器：

```sh
npm install
npm run start -- --host
```

打开 [VK 开发者平台](https://dev.vk.ru/)，或进入 [小程序管理页面](https://vk.ru/apps?act=manage) 创建一个新的小程序。

将本地开发服务器的 URL 填入小程序设置，并提前开启开发模式。之后点击小程序图标即可打开它。

## 🌐 部署小程序

如果要将小程序托管到 VK 服务器，请先打开 `vk-hosting-config.json`，填写你的小程序 ID，然后运行部署脚本：

```sh
npm run deploy
```

## 🧪 VK 小程序测试中心

首页只提供 VK Bridge 方法测试中心和调试日志两个入口。Bridge 测试需要从 VK 小程序容器中打开；在普通浏览器中运行时，页面会显示环境提示，不会一直停留在加载状态。

### Persik：VK Bridge 方法测试中心

从首页的“VK Bridge 方法测试中心”入口进入 Persik 页面，可按十个能力分类浏览和筛选注册表中的 98 个官方 Bridge 方法。每张方法卡片都会显示风险等级、可用环境和是否需要用户操作。

- 普通浏览器可以加载测试中心、浏览分类和编辑参数，但依赖 VK 客户端的调用可能被拒绝或超时；只有在 VK Mini App 容器中才能验证真实的 Bridge 结果。页面会把失败和超时显示为可读状态，并恢复按钮操作。
- 参数编辑框使用 JSON 对象。可以直接修改示例参数；调用前会校验 JSON，数组、字符串、数字和 `null` 不能作为方法参数。
- 调试日志会保存并展示 VK Bridge 返回的原始结果。请注意不要把真实凭据或不应公开的个人信息粘贴到参数框中。
- 标记“需要用户操作”的方法可能打开授权、确认、分享、支付、订阅、通话或其他 VK 界面；标记“需要 VK 容器”的方法不能在普通浏览器中伪造成功，应在对应容器和设备条件下手动确认。

## 🗂️ 预置依赖

| 依赖 | 用途 |
| --- | --- |
| [vk-bridge](https://dev.vk.ru/ru/mini-apps/bridge) | 向 VK 平台发送指令并交换数据。 |
| [VKUI](https://vkcom.github.io/VKUI/) | 使用 React 组件创建 VK 风格的小程序界面。 |
| [vk-bridge-react](https://www.npmjs.com/package/@vkontakte/vk-bridge-react) | 在 React 应用中使用 VK Bridge 的事件。 |
| [vk-mini-apps-router](https://dev.vk.ru/ru/libraries/router) | 为基于 VKUI 的小程序提供路由和导航能力。 |
| [icons](https://vkcom.github.io/icons/) | 在 VKUI 组件中使用的图标集合。 |
| [vk-miniapps-deploy](https://dev.vk.ru/ru/mini-apps/development/hosting) | 将小程序文件部署到 VK 托管服务。 |
| [eruda](https://www.npmjs.com/package/eruda) | 移动浏览器调试控制台。 |

## 📎 相关链接

- [VK 开发者平台](https://dev.vk.ru/)
- [VK 小程序示例](https://dev.vk.ru/ru/mini-apps/examples/shop)
- [VK 小程序问题反馈](https://github.com/VKCOM/create-vk-mini-app/issues)
