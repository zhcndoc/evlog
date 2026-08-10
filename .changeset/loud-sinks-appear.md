---
'@evlog/cli': patch
---

修复：`evlog doctor` 在第一个事件之前将已连接的 fs drain 视为本地 sink，并且在未配置本地 sink 时不再发出警告
