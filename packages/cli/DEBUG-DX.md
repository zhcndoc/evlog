# CLI 调试 DX — 摩擦点与愿望清单

关于在 `@evlog/cli` 上接入 `--debug` 的笔记（dogfooding `evlog` + 错误目录）。请保留此文件供维护者使用；不是面向用户的文档。

## 命令作者契约

`defineEvlogCommand` 会注入 **`{ args, cli, log, ui }`** 以及共享标志（`json`、`debug`、`noHeader`）。

| 对象 | 作用 | API |
| --- | --- | --- |
| `cli` | 输入（cwd、env、color，…） | 只读上下文 |
| `log` | 调试 / 诊断 | `step`、`finding`、`set`、`raw` |
| `ui` | 终端输出 + 退出 | `human`、`json`、`exit`、`done` |

```ts
export default defineEvlogCommand('audit', {
  meta: { description: '…' },
  args: { since: { type: 'string' } },
  async run({ args, cli, log, ui }) {
    const data = await log.step('load', () => load(cli.cwd))
    if (!data) {
      log.finding(cliErrors.EVLOG_DECLARED_NOT_INSTALLED, { id: 'evlog' })
      ui.done({ human: 'No evlog.', summary: { ok: 0, warn: 1, fail: 0 } })
      return
    }
    // step 内部的意外抛错 → 步骤轨迹 + 在 --debug 时显示 cli.COMMAND_FAILED
    ui.done({
      jsonMode: args.json,
      json: { data },
      human: format(data),
      summary: { ok: 1, warn: 0, fail: 0 },
    })
  },
})
```

规则：

1. **骨架**（header、debug 事件、catch throw）= 命令中零行  
2. **叙事** = 仅在有用时使用 `log.step` / `log.finding(cliErrors.X)`  
3. **输出 / JSON / 退出** = 仅使用 `ui.*` — 绝不要在命令中触碰 `process.stdout` / `exitCode`  

## 目标流程

```bash
evlog <cmd> --debug                 # 在 stderr 上输出紧凑的 case-file 报告
evlog <cmd> --json --debug 2>e.json # stdout = 合约，stderr = 原始宽事件
```

## 今天可用的功能

- `defineEvlogCommand` → `{ cli, log, ui }` + `COMMON_ARGS`
- `log.step('name', fn)` / `log.finding(cliErrors.X, { id, status })`
- `ui.done({ human, json, summary, jsonMode })`
- 人类模式 `--debug` → `formatDebugReport`；`--json --debug` → 在 stderr 上输出原始事件
- `--json` / debug / telemetry 中的 `environment`：已打包安装 → `production`，工作区 → `development`（`EVLOG_CLI_ENV` / `VERCEL_ENV` 覆盖）

## 摩擦 / 愿望清单

- 软性发现仍通过 `findingsForChecks` 映射到 doctor 中 — 理想情况：checks 携带一个目录引用
- `evlog` 目录上的 `DefinedError.toFinding()` 会移除 `toCliFinding` 的胶水代码
- Pretty → stderr / 独立 logger 目前在上游 `evlog` 中仍然有用
- 之后为长命令提供实时 breadcrumbs（`--debug -v`）

## 发布说明 — `workspace:*` 依赖

`package.json` 为了本地链接保留了 `"evlog": "workspace:*"` 和 `"@evlog/telemetry": "workspace:*"`。**pnpm / `changeset publish` 会在 tarball 中把 `workspace:` 重写为真实的 semver**。

Doctor 通过 `require.resolve('evlog/package.json')` 解析安装 —— 该子路径在 `evlog` 中已导出（`"./package.json": "./package.json"`）。
