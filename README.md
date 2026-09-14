# VK 小程序示例

这是一个基于 [VK Bridge](https://github.com/VKCOM/vk-bridge)、[VKUI](https://github.com/VKCOM/VKUI) 和 [VK Miniapps Router](https://github.com/VKCOM/vk-mini-apps-router) 的 VK 小程序示例项目。

项目使用 [Vite](https://vite.dev/) 作为构建工具，适合用来学习 VK 小程序的基础结构和开发流程。

## 🚀 启动小程序

安装依赖后运行开发服务器：

```sh
yarn start
```

打开 [VK 开发者平台](https://dev.vk.ru/)，或进入 [小程序管理页面](https://vk.ru/apps?act=manage) 创建一个新的小程序。

将本地开发服务器的 URL 填入小程序设置，并提前开启开发模式。之后点击小程序图标即可打开它。

## 🌐 部署小程序

如果要将小程序托管到 VK 服务器，请先打开 `vk-hosting-config.json`，填写你的小程序 ID，然后运行已配置好的部署脚本：

```sh
yarn run deploy
```

部署完成后，你会获得一个长期有效的小程序访问链接。

## 🗂️ 预置依赖

项目预置了以下依赖，方便你快速开始开发：

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
