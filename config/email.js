import nodemailer from "nodemailer"
import dotenv from "dotenv"

dotenv.config()

// Email transporter configuration
export const transporter = nodemailer.createTransport({
  service: process.env.EMAIL_SERVICE || "gmail",
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASSWORD,
  },
  tls: {
    rejectUnauthorized: false,
  },
  secure: true,
  pool: true, // Use pooled connections
  maxConnections: 1, // Limit to 1 connection to prevent parallel sends
  maxMessages: 1, // Limit to 1 message per connection
})

// Test email connection on startup
transporter.verify((error, success) => {
  if (error) {
    console.error("Email server connection error:", error)
  } else {
    console.log("Email server connection successful")
  }
})

// Contact email transporter configuration
export const contactTransporter = nodemailer.createTransport({
  service: process.env.EMAIL_SERVICE || "gmail",
  auth: {
    user: process.env.CONTACT_EMAIL_USER || "contact.us.tripeasy@gmail.com",
    pass: process.env.CONTACT_EMAIL_PASSWORD || "",
  },
  tls: {
    rejectUnauthorized: false,
  },
  secure: true,
  pool: true,
  maxConnections: 1,
  maxMessages: 1,
})

// Test contact email connection on startup (only if password is provided)
if (process.env.CONTACT_EMAIL_PASSWORD) {
  contactTransporter.verify((error, success) => {
    if (error) {
      console.error("Contact email server connection error:", error)
    } else {
      console.log("Contact email server connection successful")
    }
  })
}

// Helper to choose the right transporter for contact form emails
export const getContactTransporter = () => {
  if (process.env.CONTACT_EMAIL_PASSWORD && process.env.CONTACT_EMAIL_USER) {
    return {
      transporter: contactTransporter,
      from: `"TripEasy Contact" <${process.env.CONTACT_EMAIL_USER}>`
    }
  }
  console.warn("CONTACT_EMAIL_PASSWORD not set in environment variables. Falling back to default booking email transporter.")
  return {
    transporter: transporter,
    from: `"TripEasy Contact" <${process.env.EMAIL_USER}>`
  }
}

// Track emails sent to prevent duplicates
export const emailsSent = new Set()
