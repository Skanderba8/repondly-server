export function withTiming<T extends Request>(handler: (req: T) => Promise<Response>) {
  return async (req: T) => {
    const start = Date.now()
    const res = await handler(req)
    const duration = Date.now() - start
    res.headers.set("X-Response-Time", `${duration}ms`)
    return res
  }
}
