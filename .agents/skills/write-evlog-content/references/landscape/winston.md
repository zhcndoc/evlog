# winston

检查时间：2026-08-14 · 来源：https://github.com/winstonjs/winston

现有方案。一位提到 winston 的读者通常是继承了它，而不是主动选择了它，这改变了页面对他们的责任：应当提供迁移路径，而不是进行论证

## 它的功能

- `winston.createLogger({ level, format, transports })`。一个 logger 上可以有多个 transport，每个 transport 都有自己的 level
- 格式通过 `logform` 组合：`combine`、`timestamp`、`json`、`printf` 以及自定义格式
- 提供用于 console、file 和 HTTP 的 transport，还有大量第三方 transport（`winston-transport` 是基类）
- 提供性能分析辅助工具（`logger.profile`）、子 logger（`logger.child`）以及异常和拒绝处理器
- 默认使用 npm 的级别，也支持自定义级别集合

## evlog 的不同之处

- winston 的单元是附带元数据的消息。evlog 的单元是请求，而消息是请求中的一个字段
- 格式组合在每次写入时进行。evlog 在发出事件时一次性确定事件的形状
- winston 没有采样功能，也没有针对每个 drain 的重试策略。用户需要将这些功能构建到自定义 transport 中

## 我们绝不能说什么

- 不能说 winston 无法生成结构化输出。`format.json()` 是核心功能
- 不能说它无人维护。在撰写任何有关其活跃度的内容前，先检查代码仓库
- 不要在没有数字和来源的情况下谈论其开销，包括本文件。开销是读者首先会核查的说法，而已发布的比较数据来自 pino（[基准测试](https://github.com/pinojs/pino/blob/main/docs/benchmarks.md)），其中说明了它们的测试设置。针对你正在撰写的版本复现一项比较，引用你运行的内容，或者不要涉及这个主题。
