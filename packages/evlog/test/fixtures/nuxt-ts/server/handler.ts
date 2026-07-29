export default defineEventHandler((event) => {
  const log = useLogger(event)
  log.set({ ok: true })
  return null
})

function defineEventHandler<T>(handler: (event: { context: { log?: unknown } }) => T) {
  return handler
}
