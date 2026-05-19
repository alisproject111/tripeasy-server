// Clean server terminal logging override
const originalLog = console.log
console.log = (...args) => {
  const message = args[0]
  if (typeof message === "string") {
    const isImportantLog =
      message.startsWith("[") ||
      message.includes("Server running") ||
      message.includes("connection successful") ||
      message.includes("connected") ||
      message.includes("Error")

    if (isImportantLog) {
      originalLog(...args)
    }
  }
}

// Clean request logger middleware (excluding GET and OPTIONS to keep terminal clean)
export const requestLogger = (req, res, next) => {
  const start = Date.now()
  res.on("finish", () => {
    if (req.method === "GET" || req.method === "OPTIONS") return
    const duration = Date.now() - start
    const timestamp = new Date().toLocaleTimeString("en-IN", {
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
      hour12: false,
    })
    console.log(`[${timestamp}] ${req.method} ${req.originalUrl} - ${res.statusCode} (${duration}ms)`)
  })
  next()
}
