# pino

检查日期：2026-09-08 · 来源：https://github.com/pinojs/pino/blob/main/docs/api.md 和 https://github.com/pinojs/pino/blob/main/docs/transports.md

默认比较对象。大多数来到 evlog 的读者要么使用 pino，要么曾考虑过使用它，因此这是最常用的档案。

## 它的功能

- Node 的 JSON 日志记录器。级别为数值（`trace` 为 10，`fatal` 为 60），除非格式化器修改了级别，否则级别会以数字形式写入
- `logger.child(bindings)` 返回一个携带额外字段的日志记录器。`logger.setBindings()` 可以稍后添加绑定。它不会覆盖现有键，并且可能产生重复项
- 传输器（`pino.transport`、`pino/file`、`pino-pretty`）通过 `thread-stream` 在工作线程中运行，因此序列化仍在主线程中进行，而写入操作不在主线程中进行
- 内置脱敏功能：`redact: ['req.headers.authorization']` 支持路径语法，可对内容进行替换或移除
- 支持按键配置序列化器（`serializers: { err: pino.stdSerializers.err }`）
- `pino-http` 是请求日志记录器，并在响应时发出日志
- 低开销是该项目声明的设计目标，其基准测试已发布在代码仓库中

## evlog 的不同之处

- pino 每次调用写入一行。evlog 会在请求期间累积字段，并在结束时发出一个事件，包括处理器抛出异常时
- `child()` 以绑定开始，`setBindings()` 可以添加更多绑定。`log.fork()` 会分支出已累积的上下文，并且可以在不影响父上下文的情况下丢弃
- pino 的排出机制是由用户组装的传输器。evlog 提供适配器和管道，用于批处理、重试，并隔离发生故障的传输器

## 我们绝不能说什么

- 不能说 pino 很慢。没有等效的工作负载和带版本的测量结果时，不要对速度进行排名。任何提及 pino 性能的句子都必须包含数值及其来源，否则不得发布
- 不能说 pino 没有脱敏、序列化器或请求日志记录功能。它三者都有
- 不能说 pino 无法处理宽事件。没有任何东西阻止用户累积一个对象并一次性记录它；evlog 提供的是累积过程、请求生命周期以及错误路径
