# 系统架构（移动端 App）

> **模板类型**：mobile
> **适用项目**：iOS、Android、React Native、Flutter、KMP 等移动应用

---

## 跨平台架构（Flutter/RN 视角）

```
┌─────────────────────────────────────────────────────────────┐
│                      UI Layer (Dart/TS)                     │
│         (Widgets / Components / Screens / Pages)            │
├─────────────────────────────────────────────────────────────┤
│                    Business Logic Layer                     │
│        (BLoC / Provider / Redux / ViewModel)                │
├─────────────────────────────────────────────────────────────┤
│                   Data Layer (Repository)                    │
│       (API Client / Local Storage / Cache)                  │
├─────────────────────────────────────────────────────────────┤
│                   Platform Channel Layer                    │
│        (MethodChannel / EventChannel / JSBridge)            │
├─────────────────────────────────────────────────────────────┤
│                      Native Layer                            │
│         (iOS: Swift / Android: Kotlin/Java)                 │
│              (Platform APIs / System Services)              │
└─────────────────────────────────────────────────────────────┘
```

## 跨平台架构（KMP 视角）

```
┌─────────────────────────────────────────────────────────────┐
│                    Platform UI Layer                        │
│      iOS: SwiftUI/UIKit  │  Android: Compose/Views          │
├─────────────────────────────────────────────────────────────┤
│                  Shared Business Logic                      │
│              (commonMain - Kotlin Multiplatform)            │
│         (ViewModels / Use Cases / Domain Models)            │
├─────────────────────────────────────────────────────────────┤
│                    Shared Data Layer                        │
│              (Repository / API Client / Cache)              │
│         (Ktor / SQLDelight / DataStore / Serialization)     │
├─────────────────────────────────────────────────────────────┤
│                  Platform-Specific Layer                    │
│         expect/actual declarations (iosMain/androidMain)    │
│    (Platform APIs / File System / Crypto / Notifications)   │
└─────────────────────────────────────────────────────────────┘
```

### KMP 代码共享策略

| 层级              | 共享程度 | 说明                                      |
| ----------------- | -------- | ----------------------------------------- |
| **UI Layer**      | 0-20%    | 平台原生实现（SwiftUI/Compose）           |
| **Presentation**  | 80-100%  | ViewModel/State 逻辑共享                  |
| **Domain**        | 100%     | 业务逻辑完全共享                          |
| **Data**          | 90-100%  | Repository/API 共享，存储用 expect/actual |
| **Platform APIs** | 0%       | expect/actual 声明，平台实现              |

## 原生 iOS 架构

```
┌─────────────────────────────────────────────────────────────┐
│                    SwiftUI / UIKit                          │
│              (Views / ViewControllers / Navigation)           │
├─────────────────────────────────────────────────────────────┤
│                      ViewModels                              │
│            (@Observable / @StateObject)                      │
├─────────────────────────────────────────────────────────────┤
│                    Services / Managers                       │
│         (Network / Storage / Analytics / Auth)               │
├─────────────────────────────────────────────────────────────┤
│                      Data Layer                              │
│        (CoreData / Realm / SwiftData / Cache)                │
└─────────────────────────────────────────────────────────────┘
```

## 原生 Android 架构

```
┌─────────────────────────────────────────────────────────────┐
│                       UI Layer                              │
│            (Activities / Fragments / Compose)                │
├─────────────────────────────────────────────────────────────┤
│                     ViewModel Layer                          │
│              (Jetpack ViewModel / StateFlow)                 │
├─────────────────────────────────────────────────────────────┤
│                    Domain Layer (Use Cases)                  │
│                   (业务逻辑用例)                             │
├─────────────────────────────────────────────────────────────┤
│                      Data Layer                              │
│      (Repository + DataSource / Room / Retrofit)            │
└─────────────────────────────────────────────────────────────┘
```

## 桥接层

| 框架             | 桥接机制                                       |
| ---------------- | ---------------------------------------------- |
| **Flutter**      | PlatformChannel (MethodChannel / EventChannel) |
| **React Native** | JSBridge / Native Modules                      |
| **UniApp**       | JS Bridge / Plus API                           |
| **KMP**          | Expect/Actual 声明                             |

## 网络层

| 组件            | 职责                                               | 平台支持     |
| --------------- | -------------------------------------------------- | ------------ |
| **API Client**  | 封装 HTTP 请求（Dio / Axios / OkHttp / Alamofire） | 各平台原生   |
| **Ktor Client** | HTTP 客户端                                        | KMP (跨平台) |
| **拦截器**      | 认证、日志、错误处理                               | 全平台       |
| **缓存**        | 离线缓存、内存缓存                                 | 全平台       |
| **序列化**      | JSON → Model 转换                                  | 全平台       |

## 本地存储

| 方案                    | 适用场景          | 平台支持                     |
| ----------------------- | ----------------- | ---------------------------- |
| **SharedPreferences**   | 轻量配置          | Android                      |
| **SQLite / Room**       | 结构化数据        | Android                      |
| **SQLDelight**          | 结构化数据        | KMP (iOS + Android)          |
| **DataStore**           | 轻量配置          | KMP (iOS + Android)          |
| **CoreData / Realm**    | 对象关系映射      | iOS / 跨平台                 |
| **File System**         | 文件存储          | 全平台                       |
| **Keychain / Keystore** | 敏感数据（Token） | iOS / Android                |
| **Settings**            | 轻量配置          | KMP (multiplatform-settings) |

## 导航模式

| 模式         | 说明          |
| ------------ | ------------- |
| **栈导航**   | 页面入栈/出栈 |
| **标签导航** | 底部 Tab 切换 |
| **抽屉导航** | 侧边栏菜单    |
| **模态导航** | 全屏弹窗      |

## 性能优化

| 方向         | 手段                       |
| ------------ | -------------------------- |
| **渲染优化** | 懒加载、虚拟列表、图片缓存 |
| **内存优化** | 对象池、内存泄漏检查       |
| **启动优化** | 延迟初始化、任务分片       |
| **包体积**   | 代码分割、资源压缩         |
