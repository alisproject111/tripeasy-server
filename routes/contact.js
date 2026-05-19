import express from "express"
import { getContactTransporter } from "../config/email.js"
import {
  generateAdminContactEmailHTML,
  generateCustomerContactEmailHTML,
} from "../utils/emailTemplates.js"

const router = express.Router()

// Contact form submission endpoint
router.post("/contact", async (req, res) => {
  try {
    const { name, email, phone, subject, message } = req.body

    // Validate required fields
    if (!name || !email || !phone || !subject || !message) {
      return res.status(400).json({
        success: false,
        message: "All fields are required",
      })
    }

    const { transporter: activeTransporter, from: fromEmail } = getContactTransporter()

    // 1. Send admin notification email
    const adminEmailHtml = generateAdminContactEmailHTML(name, email, phone, subject, message)

    const adminMailOptions = {
      from: fromEmail,
      to: "contact.us.tripeasy@gmail.com",
      subject: `New Contact Inquiry: ${subject}`,
      html: adminEmailHtml,
    }

    // 2. Send customer confirmation email
    const customerEmailHtml = generateCustomerContactEmailHTML(name, subject, message)

    const customerMailOptions = {
      from: fromEmail,
      to: email,
      subject: `Thanks for contacting TripEasy: ${subject}`,
      html: customerEmailHtml,
    }

    // Send both emails
    await activeTransporter.sendMail(adminMailOptions)
    console.log(`[Contact] Inquiry notification sent to contact.us.tripeasy@gmail.com`)

    try {
      await activeTransporter.sendMail(customerMailOptions)
      console.log(`[Contact] Confirmation email sent to customer: ${email}`)
    } catch (custError) {
      console.error(`[Contact] Error sending confirmation email to customer:`, custError)
    }

    res.status(200).json({
      success: true,
      message: "Message sent successfully",
    })
  } catch (error) {
    console.error("[Contact] Error handling contact form:", error)
    res.status(500).json({
      success: false,
      message: "Failed to send message",
      error: error.message,
    })
  }
})

export default router
