确认超时：`timed_out: true`，`duration_ms: 120032`——解析仅 4ms（缓存生效），但下载卡住：120 秒内 numpy (5.2MB) 都下不完，指向到 PyPI 的网络极慢。用户环境可能有镜像配置存在真实 HOME 下而隔离 HOME 丢失了。检查：
