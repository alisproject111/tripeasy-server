import express from "express"
import BookingRequest from "../models/BookingRequest.js"
import Traveler from "../models/Traveler.js"
import { transporter, emailsSent } from "../config/email.js"
import {
  generateCustomerBookingEmailHTML,
  generateAdminBookingEmailHTML,
} from "../utils/emailTemplates.js"

const router = express.Router()

// Submit booking request (legacy endpoint or custom workflow)
router.post("/submit-booking-request", async (req, res) => {
  try {
    const { bookingDetails, packageDetails, totalPrice } = req.body

    // Validate required fields
    if (!bookingDetails || !packageDetails) {
      return res.status(400).json({
        success: false,
        message: "Missing required fields for booking request",
      })
    }

    if (!bookingDetails.fullName || !bookingDetails.email || !bookingDetails.phone) {
      return res.status(400).json({
        success: false,
        message: "Missing required customer details",
      })
    }

    const requestId = `REQ_${Date.now()}_${Math.floor(Math.random() * 1000)}`

    // Create booking request
    const newBookingRequest = new BookingRequest({
      request_id: requestId,
      customer_name: bookingDetails.fullName,
      customer_email: bookingDetails.email,
      customer_phone: bookingDetails.phone,
      customer_gender: bookingDetails.gender || null,
      customer_age: bookingDetails.age || null,
      travel_date: new Date(bookingDetails.travelDate),
      num_travelers: bookingDetails.travelers,
      package_name: packageDetails.name,
      package_location: packageDetails.location,
      package_duration: packageDetails.duration,
      package_price: packageDetails.price,
      total_price: totalPrice,
      special_requests: bookingDetails.specialRequests || null,
      request_date: new Date(),
      status: "pending",
    })

    await newBookingRequest.save()
    console.log(`Booking request saved with ID: ${requestId}`)

    // Prepare email content
    let travellersList = `1. ${bookingDetails.fullName} (Lead Traveller)`
    if (bookingDetails.additionalTravelers && bookingDetails.additionalTravelers.length > 0) {
      bookingDetails.additionalTravelers.forEach((traveler, index) => {
        travellersList += `\n${index + 2}. ${traveler.fullName}`
      })
    }

    const emailHtml = generateCustomerBookingEmailHTML(
      bookingDetails,
      packageDetails,
      totalPrice,
      requestId,
      travellersList,
    )

    const emailKey = `${bookingDetails.email}_${requestId}`
    if (!emailsSent.has(emailKey)) {
      const mailOptions = {
        from: `"TripEasy Travel" <${process.env.EMAIL_USER}>`,
        to: bookingDetails.email,
        subject: `Booking Request Received - ${packageDetails.name} | TripEasy`,
        html: emailHtml,
      }

      await transporter.sendMail(mailOptions)
      emailsSent.add(emailKey)
      console.log(`Confirmation email sent to ${bookingDetails.email} for request ${requestId}`)
    }

    res.json({
      success: true,
      message: "Booking request submitted successfully",
      requestId: requestId,
    })
  } catch (error) {
    console.error("Error submitting booking request:", error)
    res.status(500).json({
      success: false,
      message: "Failed to submit booking request",
      error: error.message,
    })
  }
})

// Booking request (v0 standard endpoint with travelers model records)
router.post("/booking-requests", async (req, res) => {
  try {
    console.log("[v0] Booking request received:", req.body)

    const { bookingDetails, packageDetails, totalPrice } = req.body

    // Validate required fields
    if (!bookingDetails || !packageDetails) {
      console.error("[v0] Missing required fields for booking request")
      return res.status(400).json({
        success: false,
        message: "Missing required fields for booking request",
      })
    }

    if (!bookingDetails.fullName || !bookingDetails.email || !bookingDetails.phone) {
      console.error("[v0] Missing customer details")
      return res.status(400).json({
        success: false,
        message: "Missing required customer details",
      })
    }

    const requestId = `REQ_${Date.now()}_${Math.floor(Math.random() * 1000)}`

    // Create booking request
    const newBookingRequest = new BookingRequest({
      request_id: requestId,
      customer_name: bookingDetails.fullName,
      customer_email: bookingDetails.email,
      customer_phone: bookingDetails.phone,
      customer_gender: bookingDetails.gender || null,
      customer_age: bookingDetails.age || null,
      travel_date: new Date(bookingDetails.travelDate),
      num_travelers: bookingDetails.travelers,
      package_name: packageDetails.name,
      package_location: packageDetails.location,
      package_duration: packageDetails.duration,
      package_price: packageDetails.price,
      total_price: totalPrice,
      special_requests: bookingDetails.specialRequests || null,
      request_date: new Date(),
      status: "pending",
    })

    const savedRequest = await newBookingRequest.save()
    console.log(`[v0] Booking request saved with ID: ${requestId}`)

    const leadTraveler = new Traveler({
      booking_id: savedRequest._id,
      name: bookingDetails.fullName,
      gender: bookingDetails.gender || null,
      age: bookingDetails.age || null,
      lead_traveler_id: null,
    })

    const savedLeadTraveler = await leadTraveler.save()
    console.log(`[v0] Lead traveler saved with ID: ${savedLeadTraveler._id}`)

    if (bookingDetails.additionalTravelers && bookingDetails.additionalTravelers.length > 0) {
      const additionalTravelersData = bookingDetails.additionalTravelers.map((traveler) => ({
        booking_id: savedRequest._id,
        name: traveler.fullName || traveler.name,
        gender: traveler.gender || null,
        age: traveler.age || null,
        lead_traveler_id: savedLeadTraveler._id,
      }))

      const savedAdditionalTravelers = await Traveler.insertMany(additionalTravelersData)
      console.log(
        `[v0] Additional travelers saved: ${savedAdditionalTravelers.length} travelers with lead_traveler_id: ${savedLeadTraveler._id}`,
      )
    }

    // Prepare travellers list
    let travellersList = `1. ${bookingDetails.fullName} (Lead Traveller)`
    if (bookingDetails.additionalTravelers && bookingDetails.additionalTravelers.length > 0) {
      bookingDetails.additionalTravelers.forEach((traveler, index) => {
        travellersList += `\n${index + 2}. ${traveler.fullName || traveler.name}`
      })
    }

    const customerEmailHtml = generateCustomerBookingEmailHTML(
      bookingDetails,
      packageDetails,
      totalPrice,
      requestId,
      travellersList,
    )

    // Send customer confirmation email
    try {
      const mailOptions = {
        from: `"TripEasy Travel" <${process.env.EMAIL_USER}>`,
        to: bookingDetails.email,
        subject: `Booking Request Received - ${packageDetails.name} | TripEasy`,
        html: customerEmailHtml,
      }

      await transporter.sendMail(mailOptions)
      console.log(`[v0] Confirmation email sent to ${bookingDetails.email} for request ${requestId}`)
    } catch (emailError) {
      console.error(`[v0] Error sending customer email: ${emailError.message}`)
    }

    // Send admin notification email
    try {
      const adminEmailHtml = generateAdminBookingEmailHTML(
        bookingDetails,
        packageDetails,
        totalPrice,
        requestId,
        travellersList,
      )

      const adminMailOptions = {
        from: `"TripEasy Travel" <${process.env.EMAIL_USER}>`,
        to: "booking.tripeasy@gmail.com",
        subject: `New Booking Request - ${packageDetails.name}`,
        html: adminEmailHtml,
      }

      await transporter.sendMail(adminMailOptions)
      console.log(`[v0] Admin notification sent for request ${requestId}`)
    } catch (adminEmailError) {
      console.error(`[v0] Error sending admin email: ${adminEmailError.message}`)
    }

    res.status(200).json({
      success: true,
      message: "Booking request submitted successfully",
      requestId: requestId,
    })
  } catch (error) {
    console.error("[v0] Error submitting booking request:", error)
    res.status(500).json({
      success: false,
      message: "Failed to submit booking request",
      error: error.message,
    })
  }
})

export default router
