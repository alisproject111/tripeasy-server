import rateLimit from "express-rate-limit"

// Global rate limiter (applied to all API routes)
export const globalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 300, // Limit each IP to 300 requests per 15 minutes
  message: {
    success: false,
    message: "Too many requests from this IP, please try again after 15 minutes",
  },
  standardHeaders: true,
  legacyHeaders: false,
})

// Strict rate limiter for sensitive/transactional endpoints (contact, bookings, payment)
export const sensitiveLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 15, // Limit each IP to 15 submissions per 15 minutes
  message: {
    success: false,
    message: "Too many attempts from this IP. Please wait 15 minutes before trying again.",
  },
  standardHeaders: true,
  legacyHeaders: false,
})

// In-place HTML/XSS input escaping function (compatible with Express 5 getters)
const sanitizeXSSInPlace = (obj) => {
  if (typeof obj !== "object" || obj === null) return
  for (const key in obj) {
    if (Object.prototype.hasOwnProperty.call(obj, key)) {
      if (key === "pdfBase64") {
        continue
      }
      const val = obj[key]
      if (typeof val === "string") {
        obj[key] = val
          .replace(/&/g, "&amp;")
          .replace(/</g, "&lt;")
          .replace(/>/g, "&gt;")
          .replace(/"/g, "&quot;")
          .replace(/'/g, "&#x27;")
          .replace(/\//g, "&#x2F;")
      } else if (typeof val === "object" && val !== null) {
        sanitizeXSSInPlace(val)
      }
    }
  }
}

// XSS Sanitizer Middleware
export const xssSanitizer = (req, res, next) => {
  if (req.body) sanitizeXSSInPlace(req.body)
  if (req.query) sanitizeXSSInPlace(req.query)
  if (req.params) sanitizeXSSInPlace(req.params)
  next()
}

// In-place NoSQL query injection protection (compatible with Express 5 getters)
const sanitizeNoSQLInPlace = (obj) => {
  if (typeof obj !== "object" || obj === null) return
  for (const key in obj) {
    if (Object.prototype.hasOwnProperty.call(obj, key)) {
      if (key.startsWith("$") || key.includes(".")) {
        console.warn(`[Security] Stripped NoSQL injection key: ${key}`)
        delete obj[key]
        continue
      }
      if (typeof obj[key] === "object" && obj[key] !== null) {
        sanitizeNoSQLInPlace(obj[key])
      }
    }
  }
}

// NoSQL Sanitizer Middleware (replacement for express-mongo-sanitize to support Express 5)
export const nosqlSanitizer = (req, res, next) => {
  if (req.body) sanitizeNoSQLInPlace(req.body)
  if (req.query) sanitizeNoSQLInPlace(req.query)
  if (req.params) sanitizeNoSQLInPlace(req.params)
  next()
}
