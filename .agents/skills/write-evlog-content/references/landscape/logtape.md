# LogTape

检查日期：2026-09-08  
来源：https://logtape.org/manual/library、https://logtape.org/manual/contexts、https://logtape.org/manual/testing、https://logtape.org/comparison

## 功能

- 类别让使用库的应用程序能够配置库代码的输出。LogTape 也支持应用程序日志记录
- `logger.with()` 提供显式上下文。`withContext()` 需要配置上下文本地存储以及兼容的运行时
- 结构化记录支持消息模板和属性。Sinks 负责处理传递
- 测试包提供捕获和断言。Redaction 是一个独立的包

## 比较时必须区分的内容

- evlog 的累加器和 `fork()` 与隐式上下文传播不是同一功能
- evlog 提供用于捕获记录的内存 drain。不要将其描述为完全缺乏测试或捕获支持
- 库可以使用任一 logger 累加对象并一次性发出。应比较所提供的生命周期和集成代码
- 历史捆绑包和吞吐量数据并不能确定当前浏览器导入的优胜者。比较数字时应匹配版本、入口点、工作负载和输出
