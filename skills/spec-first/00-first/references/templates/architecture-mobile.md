# 系统架构（移动端 App）

> **模板类型**：mobile
> **适用项目**：iOS、Android、React Native、Flutter 等移动应用

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

| 框架 | 桥接机制 |
|------|----------|
| **Flutter** | PlatformChannel (MethodChannel / EventChannel) |
| **React Native** | JSBridge / Native Modules |
| **UniApp** | JS Bridge / Plus API |
| **KMP** | Expect/Actual 声明 |

## 网络层

| 组件 | 职责 |
|------|------|
| **API Client** | 封装 HTTP 请求（Dio / Axios / OkHttp / Alamofire） |
| **拦截器** | 认证、日志、错误处理 |
| **缓存** | 离线缓存、内存缓存 |
| **序列化** | JSON → Model 转换 |

## 本地存储

| 方案 | 适用场景 |
|------|----------|
| **SharedPreferences** | 轻量配置 |
| **SQLite / Room** | 结构化数据 |
| **CoreData / Realm** | 对象关系映射 |
| **File System** | 文件存储 |
| **Keychain / Keystore** | 敏感数据（Token） |

## 导航模式

| 模式 | 说明 |
|------|------|
| **栈导航** | 页面入栈/出栈 |
| **标签导航** | 底部 Tab 切换 |
| **抽屉导航** | 侧边栏菜单 |
| **模态导航** | 全屏弹窗 |

## 性能优化

| 方向 | 手段 |
|------|------|
| **渲染优化** | 懒加载、虚拟列表、图片缓存 |
| **内存优化** | 对象池、内存泄漏检查 |
| **启动优化** | 延迟初始化、任务分片 |
| **包体积** | 代码分割、资源压缩 |
