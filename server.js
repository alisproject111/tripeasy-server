import express from "express"
import cors from "cors"
import compression from "compression"
import dns from "dns"
import dotenv from "dotenv"

// Import custom middleware & configurations
import { connectDB } from "./config/db.js"
import { requestLogger } from "./middleware/logger.js"
import { uploadsDir } from "./config/multer.js"

// Import express routers
import uploadRouter from "./routes/upload.js"
import paymentRouter from "./routes/payment.js"
import packageRouter from "./routes/package.js"
import destinationRouter from "./routes/destination.js"
import bookingRouter from "./routes/booking.js"
import contactRouter from "./routes/contact.js"

// Resolve Node v17+ IPv6 DNS lookup issues on Windows
dns.setDefaultResultOrder("ipv4first")

dotenv.config()

const app = express()
const port = process.env.PORT || 5000

// Initialize MongoDB connection
connectDB()

// Serve static files from uploads directory (local environment only)
if (process.env.VERCEL !== "1") {
  app.use("/uploads", express.static(uploadsDir))
}

// Global middlewares
app.use(requestLogger)

const allowedOrigins = [
  "http://localhost:3000",
  "http://localhost:5173",
  "http://localhost:5174",
  "http://127.0.0.1:3000",
  "http://127.0.0.1:5173",
  "http://127.0.0.1:5174",
  "https://tripeasy.in",
  "https://www.tripeasy.in",
  "https://tripeasy-client-smoky.vercel.app"
]

// Custom CORS middleware compatible with Express 5
app.use((req, res, next) => {
  const origin = req.headers.origin
  if (origin) {
    const normalizedOrigin = origin.replace(/\/$/, "")
    const isAllowed =
      allowedOrigins.includes(normalizedOrigin) ||
      normalizedOrigin.endsWith(".vercel.app") ||
      normalizedOrigin.startsWith("https://tripeasy-client")

    if (isAllowed) {
      res.setHeader("Access-Control-Allow-Origin", origin)
      res.setHeader("Access-Control-Allow-Credentials", "true")
      res.setHeader("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, PATCH, OPTIONS")
      res.setHeader(
        "Access-Control-Allow-Headers",
        req.headers["access-control-request-headers"] ||
          "Content-Type, Authorization, x-api-version, x-request-id"
      )

      // Intercept preflight OPTIONS request
      if (req.method === "OPTIONS") {
        return res.status(204).end()
      }
    } else {
      console.log(`[CORS] Rejected origin: ${origin}`)
    }
  }
  next()
})

app.use(compression({ level: 6 }))
app.use(express.json({ limit: "50mb" }))
app.use(express.urlencoded({ extended: true, limit: "50mb" }))

// Security headers middleware
app.use((req, res, next) => {
  res.setHeader("X-Frame-Options", "SAMEORIGIN")
  res.setHeader("X-Content-Type-Options", "nosniff")
  res.setHeader("X-XSS-Protection", "1; mode=block")
  res.setHeader(
    "Content-Security-Policy",
    "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval' https://cdn.jsdelivr.net https://cdnjs.cloudflare.com; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com https://cdnjs.cloudflare.com; font-src 'self' https://fonts.gstatic.com; img-src 'self' data: https:; connect-src 'self' https:; frame-ancestors 'self';"
  )
  res.setHeader("Referrer-Policy", "strict-origin-when-cross-origin")
  res.setHeader("Permissions-Policy", "geolocation=(), microphone=(), camera=()")

  if (req.path.match(/\.(css|js|png|jpg|jpeg|gif|svg|woff|woff2|ttf|eot)$/)) {
    res.setHeader("Cache-Control", "public, max-age=2592000, immutable")
  } else if (req.path.match(/\.(html)$/)) {
    res.setHeader("Cache-Control", "public, max-age=0, must-revalidate")
  } else {
    res.setHeader("Cache-Control", "public, max-age=300")
  }

  next()
})

// Mount API routers
app.use("/api", uploadRouter)
app.use("/api", paymentRouter)
app.use("/api", packageRouter)
app.use("/api", destinationRouter)
app.use("/api", bookingRouter)
app.use("/api", contactRouter)

// Health check endpoint
app.get("/", (req, res) => {
  res.json({
    message: "TripEasy Backend API is running",
    status: "healthy",
    timestamp: new Date().toISOString(),
  })
})

// Start server (local environment only)
if (process.env.VERCEL !== "1") {
  app.listen(port, () => {
    console.log(`Server running on port ${port}`)
  })
}

// Export for Vercel
export default app
