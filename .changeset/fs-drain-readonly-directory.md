---
"evlog": patch
---

当其目录不可写时，文件系统 drain 会自动停用。

`createFsDrain()` 既没有保护其 `mkdir`，也没有保护其 `appendFile`，因此在无服务器主机上挂载它时——该环境中临时目录之外的所有位置都是只读的——它会在部署的整个生命周期内每个批次抛出一次错误，而事件无论如何都无法写入。调用方必须猜测运行环境来避免这种情况：

```ts
// 不再需要
const drain = process.env.VERCEL !== '1' ? createFsDrain() : undefined
```

现在，drain 一旦检测到该目录发生 `EROFS`、`EACCES` 或 `EPERM` 写入失败，就会自动停用，并且只发出一次警告，其行为与它在 Edge 运行时中已有的自动停用机制相同。请无条件挂载它。其他任何失败——例如磁盘已满或确实存在 bug——仍会继续向上传播。
