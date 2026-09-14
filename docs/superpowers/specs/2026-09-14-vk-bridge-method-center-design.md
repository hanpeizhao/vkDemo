# VK Bridge 方法测试中心设计

## 目标

将现有 `Persik` 页面改造成 VK Bridge 方法测试中心，按官方方法目录分类展示可测试方法，并提供示例参数、调用按钮、返回结果、错误信息、耗时和复制 JSON 功能。

官方参考：[VK Bridge 方法总览](https://dev.vk.ru/en/bridge/overview)。

## 分类

- 基础与环境：初始化、启动参数、客户端版本、配置和客户端通信。
- 用户与权限：用户信息、授权 Token、权限、邮箱、手机号、好友和社区信息。
- 社交与导航：分享、推荐、收藏、加群、离开群、打开墙、打开应用和关闭应用。
- 存储与安全：Storage、Secure Token 和 Create Hash。
- 文件与媒体：用户文件、图片预览、文件下载、二维码和联系人。
- 设备能力：加速度计、陀螺仪、设备运动和触感反馈。
- 广告、支付与订阅：Banner、Native Ads、支付表单、订单、订阅和请求框。
- 通话与实时通信：通话开始、加入、离开、结束和状态查询。
- 界面与窗口：窗口大小、滚动、位置、滑动设置、View 设置和页面片段。
- 数据统计：Track Event、Conversion 和 Retargeting。

方法目录应保留官方方法名，例如 `VKWebAppGetUserInfo`，中文只用于标题、说明和限制提示。

## 数据模型

```ts
type BridgeMethod = {
  id: string;
  method: string;
  categoryId: string;
  title: string;
  description: string;
  params: Record<string, unknown>;
  requiresVk?: boolean;
  requiresPermission?: boolean;
  dangerous?: boolean;
  enabled?: boolean;
};
```

所有官方目录方法都登记元数据。参数明确且适合 Demo 的方法默认启用；需要真实权限、支付或不可逆操作的方法默认保留为受控测试项，并在执行前显示限制和示例参数。

## Persik 页面

`Persik` 保留现有路由 id `persik`，页面内容改为：

```text
VK Bridge 测试中心
├── 分类选择
├── 当前分类的方法列表
│   ├── 官方方法名
│   ├── 中文说明
│   ├── 参数 JSON 编辑器
│   ├── 权限/环境提示
│   └── 测试按钮
└── 返回结果、错误码、耗时、复制 JSON
```

分类选择使用 VKUI 的 Tabs 或 Select。方法列表使用通用测试卡片，但调用目标改为 `bridge.send(method, params)`。每个卡片独立维护 loading，调用失败不能遮挡或锁死页面。

## 执行安全

- 所有调用经过统一执行器，记录 `running`、`success`、`error` 和耗时。
- `requiresVk` 方法在普通浏览器中显示环境提示。
- 参数 JSON 无法解析时，不发起 Bridge 调用，直接显示参数错误。
- 可能产生外部副作用的方法（支付、发布、加入社区等）显示二次确认或标记为受控测试。
- 不在页面持久化或展示完整授权 Token、Secure Token 等敏感内容。
- 不响应或失败的 Bridge 调用必须有超时结束路径。

## 首期执行方法

首期优先接入无副作用或低风险的方法：`VKWebAppInit`、`VKWebAppGetLaunchParams`、`VKWebAppGetClientVersion`、`VKWebAppGetConfig`、`VKWebAppGetUserInfo`、`VKWebAppGetGrantedPermissions`、`VKWebAppStorageGetKeys`、`VKWebAppStorageGet`、`VKWebAppStorageSet`、`VKWebAppCopyText`、`VKWebAppShare`、`VKWebAppGetUserFiles`、`VKWebAppShowImages`、`VKWebAppTapticImpactOccurred`、`VKWebAppScrollTop` 和 `VKWebAppResizeWindow`。

其余方法先完成目录登记和文档说明，再根据参数与权限逐步开放执行，避免用错误参数批量调用高风险能力。

## 验证

- 测试分类和方法名唯一、官方方法名不被翻译或拼写修改。
- 测试参数 JSON 解析失败不会调用 Bridge。
- 测试成功、失败、超时都会结束 loading 并写入日志。
- 测试 `Persik` 页面能切换分类并展示方法卡片。
- 运行完整测试、TypeScript、ESLint 和 Vite 构建。
