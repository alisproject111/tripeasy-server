// Generate receipt HTML function
export const generateReceiptHTML = (orderData, bookingDetails, packageDetails) => {
  const date = new Date()
  const formattedDate = date.toLocaleDateString("en-IN", {
    year: "numeric",
    month: "long",
    day: "numeric",
  })

  // Ensure we have valid data by providing defaults
  const order = orderData || {
    order_id: "Unknown",
    order_amount: 0,
    order_status: "UNKNOWN",
  }

  const booking = bookingDetails || {
    fullName: "Customer",
    email: "customer@example.com",
    phone: "N/A",
    travelDate: formattedDate,
    travelers: 1,
  }

  const packageInfo = packageDetails || {
    name: "Travel Package",
    location: "Destination",
    duration: "N/A",
    price: order.order_amount || 0,
  }

  // Generate travelers HTML
  let travelersHTML = `
    <div class="traveler-item">
      <div class="traveler-header">Lead Traveler</div>
      <div class="traveler-details">
        <div class="traveler-detail">
          <span class="detail-label">Name:</span>
          <span>${booking.fullName}</span>
        </div>
        <div class="traveler-detail">
          <span class="detail-label">Gender:</span>
          <span>${booking.gender || "Not specified"}</span>
        </div>
        <div class="traveler-detail">
          <span class="detail-label">Age:</span>
          <span>${booking.age || "Not specified"}</span>
        </div>
      </div>
    </div>
  `

  // Add additional travelers if they exist
  if (booking.additionalTravelers && booking.additionalTravelers.length > 0) {
    booking.additionalTravelers.forEach((traveler, index) => {
      travelersHTML += `
        <div class="traveler-item">
          <div class="traveler-header">Traveler ${index + 2}</div>
          <div class="traveler-details">
            <div class="traveler-detail">
              <span class="detail-label">Name:</span>
              <span>${traveler.fullName || traveler.name}</span>
            </div>
            <div class="traveler-detail">
              <span class="detail-label">Gender:</span>
              <span>${traveler.gender || "Not specified"}</span>
            </div>
            <div class="traveler-detail">
              <span class="detail-label">Age:</span>
              <span>${traveler.age || "Not specified"}</span>
            </div>
          </div>
        </div>
      `
    })
  }

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <title>Booking Receipt</title>
      <style>
        * {
          box-sizing: border-box;
          margin: 0;
          padding: 0;
          font-style: normal;
        }
        
        body {
          font-family: Arial, sans-serif;
          line-height: 1.6;
          color: #333;
          margin: 0;
          padding: 0;
          background-color: #fff;
          font-style: normal;
        }
        
        .receipt {
          width: 100%;
          max-width: 800px;
          margin: 0 auto;
          padding: 30px;
          background-color: #fff;
        }
        
        .header {
          display: table;
          width: 100%;
          margin-bottom: 30px;
          border-bottom: 2px solid #e53935;
          padding-bottom: 20px;
        }
        
        .header-row {
          display: table-row;
        }
        
        .logo-cell, .company-cell, .receipt-title-cell {
          display: table-cell;
          vertical-align: top;
          width: 33.33%;
        }
        
        .logo-cell {
          text-align: left;
        }
        
        .company-cell {
          text-align: center;
        }
        
        .receipt-title-cell {
          text-align: right;
        }
        
        .logo {
          font-size: 32px;
          font-weight: 700;
          color: #e53935;
          margin-bottom: 5px;
        }
        
        .logo-tagline {
          font-size: 12px;
          color: #7f8c8d;
        }
        
        .company-info {
          font-size: 13px;
          color: #555;
          line-height: 1.5;
        }
        
        .company-info p {
          margin: 3px 0;
        }
        
        .receipt-title {
          font-size: 24px;
          color: #e53935;
          font-weight: 600;
          margin-bottom: 8px;
        }
        
        .receipt-id {
          font-size: 14px;
          color: #555;
          margin-bottom: 5px;
        }
        
        .receipt-date {
          font-size: 14px;
          color: #555;
        }
        
        .section {
          margin-bottom: 25px;
          background-color: #f9f9f9;
          border-radius: 8px;
          padding: 20px;
          box-shadow: 0 2px 5px rgba(0, 0, 0, 0.05);
          border-left: 4px solid #e53935;
        }
        
        .section-title {
          font-weight: 600;
          margin-bottom: 18px;
          color: #2c3e50;
          border-bottom: 1px solid #ddd;
          padding-bottom: 10px;
          font-size: 18px;
        }
        
        .detail-row {
          display: table;
          width: 100%;
          margin-bottom: 10px;
          padding-bottom: 10px;
          border-bottom: 1px dashed #eee;
        }
        
        .detail-label {
          display: table-cell;
          font-weight: 600;
          color: #444;
          width: 40%;
        }
        
        .detail-value {
          display: table-cell;
          width: 60%;
        }
        
        .total-row {
          font-weight: 700;
          font-size: 18px;
          margin-top: 20px;
          padding-top: 15px;
          border-top: 2px solid #e53935;
          color: #e53935;
        }
        
        .payment-success {
          color: #e53935;
          font-weight: 700;
        }
        
        .traveler-item {
          margin-bottom: 18px;
          border: 1px solid #eee;
          border-radius: 6px;
          overflow: hidden;
        }
        
        .traveler-header {
          background-color: #eef2f7;
          padding: 10px 15px;
          font-weight: 600;
          color: #2c3e50;
          border-bottom: 1px solid #ddd;
        }
        
        .traveler-details {
          padding: 15px;
          display: table;
          width: 100%;
          background-color: #fff;
        }
        
        .traveler-detail {
          display: table-row;
          padding: 8px 0;
        }
        
        .traveler-detail span {
          display: table-cell;
          padding: 5px 10px;
        }
        
        .traveler-detail .detail-label {
          width: 30%;
        }
        
        .additional-travelers {
          margin-top: 15px;
        }
        
        .ticket-note {
          background-color: #feeeee;
          border-left: 4px solid #e53935;
          padding: 15px 20px;
          margin: 25px 0;
          border-radius: 6px;
        }
        
        .ticket-note p {
          margin: 0;
          color: #2c3e50;
          font-weight: 500;
        }
        
        .footer {
          margin-top: 35px;
          border-top: 1px solid #ddd;
          padding-top: 25px;
          font-size: 13px;
          color: #555;
        }
        
        .terms {
          margin-bottom: 20px;
        }
        
        .terms h4 {
          margin-top: 0;
          margin-bottom: 10px;
          color: #2c3e50;
          font-size: 16px;
        }
        
        .terms ul {
          margin: 0;
          padding-left: 20px;
        }
        
        .terms li {
          margin-bottom: 6px;
        }
        
        .contact {
          text-align: center;
          margin-top: 25px;
          padding-top: 20px;
          border-top: 1px dashed #eee;
        }
        
        .contact p {
          margin: 6px 0;
        }
        
        @media print {
          .receipt {
            padding: 15px;
            max-width: 100%;
          }
          
          .section {
            page-break-inside: avoid;
          }
          
          .header, .footer {
            page-break-inside: avoid;
          }
          
          .traveler-item {
            page-break-inside: avoid;
          }
        }
      </style>
    </head>
    <body>
      <div class="receipt">
        <div class="header">
          <div class="header-row">
            <div class="logo-cell">
              <div class="logo">TripEasy</div>
              <div class="logo-tagline">Explore. Experience. Enjoy.</div>
            </div>
            <div class="company-cell">
              <div class="company-info">
                <p>TripEasy Travel Services </p>
                <p>Shop No 16, 2nd Floor,</p>
                <p>VED TransCube opposite the Main Railway Station, Vadodara,</p>
                <p>GST: 07AABCT1234Z1ZL</p>
              </div>
            </div>
            <div class="receipt-title-cell">
              <div class="receipt-title">Booking Receipt</div>
              <div class="receipt-id">Receipt #${order.order_id}</div>
              <div class="receipt-date">Date: ${formattedDate}</div>
            </div>
          </div>
        </div>
        
        <div class="section">
          <div class="section-title">Customer Information</div>
          <div class="detail-row">
            <span class="detail-label">Name:</span>
            <span class="detail-value">${booking.fullName}</span>
          </div>
          <div class="detail-row">
            <span class="detail-label">Email:</span>
            <span class="detail-value">${booking.email}</span>
          </div>
          <div class="detail-row">
            <span class="detail-label">Phone:</span>
            <span class="detail-value">${booking.phone}</span>
          </div>
        </div>
        
        <div class="section">
          <div class="section-title">Package Details</div>
          <div class="detail-row">
            <span class="detail-label">Package Name:</span>
            <span class="detail-value">${packageInfo.name}</span>
          </div>
          <div class="detail-row">
            <span class="detail-label">Destination:</span>
            <span class="detail-value">${packageInfo.location}</span>
          </div>
          <div class="detail-row">
            <span class="detail-label">Duration:</span>
            <span class="detail-value">${packageInfo.duration} Days</span>
          </div>
          <div class="detail-row">
            <span class="detail-label">Travel Date:</span>
            <span class="detail-value">${booking.travelDate}</span>
          </div>
          <div class="detail-row">
            <span class="detail-label">Number of Travelers:</span>
            <span class="detail-value">${booking.travelers}</span>
          </div>
        </div>
        
        <div class="section">
          <div class="section-title">Traveler Details</div>
          ${travelersHTML}
        </div>
        
        <div class="section">
          <div class="section-title">Payment Information</div>
          <div class="detail-row">
            <span class="detail-label">Order ID:</span>
            <span class="detail-value">${order.order_id}</span>
          </div>
          <div class="detail-row">
            <span class="detail-label">Payment Status:</span>
            <span class="detail-value payment-success">${order.order_status || "PAID"}</span>
          </div>
          <div class="detail-row">
            <span class="detail-label">Price per Person:</span>
            <span class="detail-value">Rs ${(packageInfo.price || 0).toLocaleString("en-IN")}</span>
          </div>
          <div class="detail-row total-row">
            <span class="detail-label">Total Amount:</span>
            <span class="detail-value">Rs ${(order.order_amount || 0).toLocaleString("en-IN")}</span>
          </div>
        </div>
        
        <div class="ticket-note">
          <p>Your original booking package tickets will be provided within a few hours.</p>
        </div>
        
        <div class="footer">
          <div class="terms">
            <h4>Terms & Conditions</h4>
            <ul>
              <li>This receipt is proof of payment only.</li>
              <li>Cancellation policy: 48 hours notice required for full refund.</li>
              <li>Please carry a valid ID proof for all travelers during the trip.</li>
              <li>Package inclusions are as per the itinerary shared at the time of booking.</li>
            </ul>
          </div>
          <div class="contact">
            <p>Thank you for booking with TripEasy!</p>
            <p>For any queries, please contact us at <strong>booking.tripeasy@gmail.com</strong> or call <strong>+91 7880789486</strong></p>
            <p>© ${new Date().getFullYear()} TripEasy. All rights reserved.</p>
          </div>
        </div>
      </div>
    </body>
    </html>
  `
}

// Generate Receipt Email HTML for customer
export const generateReceiptEmailHTML = (orderData, bookingDetails, packageDetails, attachmentsCount) => {
  return `
    <div style="font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; line-height: 1.6; max-width: 600px; margin: 0 auto; padding: 20px; color: #333; background-color: #ffffff;">
      <div style="text-align: center; margin-bottom: 25px; padding-bottom: 20px; border-bottom: 1px solid #f0f0f0;">
        <h1 style="color: #e53935; margin-bottom: 5px; font-size: 26px; font-weight: 700;">Booking Confirmed!</h1>
        <p style="color: #7f8c8d; font-size: 16px; margin-top: 5px;">Your adventure awaits with TripEasy</p>
      </div>
      
      <div style="background-color: #fdf2f2; border-left: 4px solid #e53935; padding: 15px; margin-bottom: 20px; border-radius: 4px;">
        <p style="margin: 0; font-size: 16px; color: #2c3e50;">Dear <strong>${bookingDetails.fullName}</strong>,</p>
      </div>
      
      <p style="font-size: 15px; color: #555;">Thank you for booking with TripEasy! Your payment has been successfully processed and your booking is confirmed. Below are your booking details:</p>
      
      <!-- Booking Details Card -->
      <div style="background-color: #f9f9f9; border: 1px solid #e0e0e0; border-radius: 8px; padding: 20px; margin: 20px 0;">
        <h3 style="color: #e53935; margin-top: 0; border-bottom: 2px solid #ffcdd2; padding-bottom: 8px; font-size: 18px; font-weight: 600;">
          ✈️ Booking Details
        </h3>
        <table style="width: 100%; border-collapse: collapse; margin-top: 10px; font-size: 14px;">
          <tr>
            <td style="padding: 6px 0; color: #7f8c8d; font-weight: bold; width: 40%;">Order / Booking ID:</td>
            <td style="padding: 6px 0; color: #2c3e50;">#${orderData.order_id}</td>
          </tr>
          <tr>
            <td style="padding: 6px 0; color: #7f8c8d; font-weight: bold;">Package Name:</td>
            <td style="padding: 6px 0; color: #2c3e50; font-weight: bold;">${packageDetails.name}</td>
          </tr>
          <tr>
            <td style="padding: 6px 0; color: #7f8c8d; font-weight: bold;">Destination:</td>
            <td style="padding: 6px 0; color: #2c3e50;">${packageDetails.location}</td>
          </tr>
          <tr>
            <td style="padding: 6px 0; color: #7f8c8d; font-weight: bold;">Travel Date:</td>
            <td style="padding: 6px 0; color: #2c3e50;">${bookingDetails.travelDate}</td>
          </tr>
          <tr>
            <td style="padding: 6px 0; color: #7f8c8d; font-weight: bold;">No. of Travelers:</td>
            <td style="padding: 6px 0; color: #2c3e50;">${bookingDetails.travelers}</td>
          </tr>
          <tr>
            <td style="padding: 6px 0; color: #7f8c8d; font-weight: bold;">Amount Paid:</td>
            <td style="padding: 6px 0; color: #e53935; font-weight: bold; font-size: 16px;">₹${orderData.order_amount.toLocaleString("en-IN")}</td>
          </tr>
        </table>
      </div>
      
      <p style="font-size: 15px; color: #555;"><strong>Important Note:</strong> Your original booking package tickets will be provided within a few hours.</p>
      ${attachmentsCount > 0 ? "<p style='font-size: 15px; color: #555;'>Please find your booking receipt attached to this email.</p>" : ""}
      
      <!-- Thank you contacting & Support section -->
      <div style="background-color: #fcf8e3; border: 1px solid #faebcc; border-radius: 8px; padding: 20px; margin: 20px 0; text-align: center;">
        <p style="font-size: 15px; color: #8a6d3b; margin: 0 0 10px 0; font-weight: bold;">
          🙏 Thank you for contacting TripEasy!
        </p>
        <p style="font-size: 14px; color: #555; margin: 0 0 10px 0;">
          If you have any questions or would like to provide additional information, please don't hesitate to reach out to us:
        </p>
        <p style="font-size: 15px; margin: 5px 0;">
          <strong style="color: #e53935;">📧 booking.tripeasy@gmail.com</strong>
        </p>
        <p style="font-size: 15px; margin: 5px 0;">
          <strong style="color: #e53935;">📞 +91 7880789486</strong>
        </p>
      </div>
      
      <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #eee; text-align: center; color: #7f8c8d; font-size: 14px;">
        <p style="margin-bottom: 5px;">We look forward to providing you with an amazing travel experience!</p>
        <p style="margin-top: 5px; margin-bottom: 25px;">Best regards,<br><strong style="color: #2c3e50;">TripEasy Team</strong></p>
        <p style="font-size: 12px; margin-top: 20px; color: #95a5a6;">© ${new Date().getFullYear()} TripEasy. All rights reserved.</p>
      </div>
    </div>
  `
}

// Generate Admin Receipt Confirmed Booking Email HTML
export const generateAdminReceiptEmailHTML = (orderData, bookingDetails, packageDetails, travelersList) => {
  return `
    <div style="font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; line-height: 1.6; max-width: 600px; margin: 0 auto; padding: 20px; color: #333; background-color: #ffffff;">
      <div style="text-align: center; margin-bottom: 25px; padding-bottom: 20px; border-bottom: 1px solid #f0f0f0;">
        <h1 style="color: #2e7d32; margin-bottom: 5px; font-size: 26px; font-weight: 700;">Booking Confirmed & Paid!</h1>
        <p style="color: #7f8c8d; font-size: 16px; margin-top: 5px;">Payment received for Order #${orderData.order_id}</p>
      </div>
      
      <div style="background-color: #e8f5e9; border-left: 4px solid #2e7d32; padding: 15px; margin-bottom: 20px; border-radius: 4px;">
        <p style="margin: 0; font-size: 16px; color: #1b5e20;">A new booking has been successfully paid and confirmed by <strong>${bookingDetails.fullName}</strong>.</p>
      </div>
      
      <!-- Customer Info Card -->
      <div style="background-color: #f9f9f9; border: 1px solid #e0e0e0; border-radius: 8px; padding: 20px; margin: 20px 0;">
        <h3 style="color: #2e7d32; margin-top: 0; border-bottom: 2px solid #a5d6a7; padding-bottom: 8px; font-size: 18px; font-weight: 600;">
          👤 Customer Details
        </h3>
        <table style="width: 100%; border-collapse: collapse; margin-top: 10px; font-size: 14px;">
          <tr>
            <td style="padding: 6px 0; color: #7f8c8d; font-weight: bold; width: 40%;">Name:</td>
            <td style="padding: 6px 0; color: #2c3e50;">${bookingDetails.fullName}</td>
          </tr>
          <tr>
            <td style="padding: 6px 0; color: #7f8c8d; font-weight: bold;">Email:</td>
            <td style="padding: 6px 0; color: #2c3e50;">${bookingDetails.email}</td>
          </tr>
          <tr>
            <td style="padding: 6px 0; color: #7f8c8d; font-weight: bold;">Phone:</td>
            <td style="padding: 6px 0; color: #2c3e50;">${bookingDetails.phone}</td>
          </tr>
        </table>
      </div>
      
      <!-- Booking Details Card -->
      <div style="background-color: #f9f9f9; border: 1px solid #e0e0e0; border-radius: 8px; padding: 20px; margin: 20px 0;">
        <h3 style="color: #2e7d32; margin-top: 0; border-bottom: 2px solid #a5d6a7; padding-bottom: 8px; font-size: 18px; font-weight: 600;">
          ✈️ Package & Travel Details
        </h3>
        <table style="width: 100%; border-collapse: collapse; margin-top: 10px; font-size: 14px;">
          <tr>
            <td style="padding: 6px 0; color: #7f8c8d; font-weight: bold; width: 40%;">Package Name:</td>
            <td style="padding: 6px 0; color: #2c3e50; font-weight: bold;">${packageDetails.name}</td>
          </tr>
          <tr>
            <td style="padding: 6px 0; color: #7f8c8d; font-weight: bold;">Destination:</td>
            <td style="padding: 6px 0; color: #2c3e50;">${packageDetails.location}</td>
          </tr>
          <tr>
            <td style="padding: 6px 0; color: #7f8c8d; font-weight: bold;">Travel Date:</td>
            <td style="padding: 6px 0; color: #2c3e50;">${bookingDetails.travelDate}</td>
          </tr>
          <tr>
            <td style="padding: 6px 0; color: #7f8c8d; font-weight: bold;">No. of Travelers:</td>
            <td style="padding: 6px 0; color: #2c3e50;">${bookingDetails.travelers}</td>
          </tr>
        </table>
      </div>

      <!-- Payment Details Card -->
      <div style="background-color: #f9f9f9; border: 1px solid #e0e0e0; border-radius: 8px; padding: 20px; margin: 20px 0;">
        <h3 style="color: #2e7d32; margin-top: 0; border-bottom: 2px solid #a5d6a7; padding-bottom: 8px; font-size: 18px; font-weight: 600;">
          💳 Payment Details
        </h3>
        <table style="width: 100%; border-collapse: collapse; margin-top: 10px; font-size: 14px;">
          <tr>
            <td style="padding: 6px 0; color: #7f8c8d; font-weight: bold; width: 40%;">Order ID:</td>
            <td style="padding: 6px 0; color: #2c3e50;">${orderData.order_id}</td>
          </tr>
          <tr>
            <td style="padding: 6px 0; color: #7f8c8d; font-weight: bold;">Amount Paid:</td>
            <td style="padding: 6px 0; color: #2e7d32; font-weight: bold;">₹${orderData.order_amount.toLocaleString("en-IN")}</td>
          </tr>
          <tr>
            <td style="padding: 6px 0; color: #7f8c8d; font-weight: bold;">Payment Status:</td>
            <td style="padding: 6px 0; color: #2e7d32; font-weight: bold;">${orderData.order_status || "PAID"}</td>
          </tr>
          <tr>
            <td style="padding: 6px 0; color: #7f8c8d; font-weight: bold;">Payment Time:</td>
            <td style="padding: 6px 0; color: #2c3e50;">${orderData.payment_time ? new Date(orderData.payment_time).toLocaleString("en-IN") : new Date().toLocaleString("en-IN")}</td>
          </tr>
        </table>
      </div>

      <!-- Travelers List Card -->
      <div style="background-color: #f9f9f9; border: 1px solid #e0e0e0; border-radius: 8px; padding: 20px; margin: 20px 0;">
        <h3 style="color: #2e7d32; margin-top: 0; border-bottom: 2px solid #a5d6a7; padding-bottom: 8px; font-size: 18px; font-weight: 600;">
          👥 Travelers List
        </h3>
        <div style="color: #2c3e50; font-size: 14px; white-space: pre-line; margin-top: 10px; line-height: 1.6;">${travelersList}</div>
      </div>
      
      <!-- Special Requests Card (if present) -->
      ${
        bookingDetails.specialRequests
          ? `
      <div style="background-color: #fffde7; border: 1px solid #fff59d; border-radius: 8px; padding: 20px; margin: 20px 0;">
        <h3 style="color: #fbc02d; margin-top: 0; border-bottom: 2px solid #fff59d; padding-bottom: 8px; font-size: 18px; font-weight: 600;">
          ✍️ Special Requests
        </h3>
        <p style="color: #5d4037; font-size: 14px; margin: 10px 0 0 0; white-space: pre-line;">${bookingDetails.specialRequests}</p>
      </div>
      `
          : ""
      }
      
      <p style="font-size: 14px; color: #7f8c8d;">This booking and payment has been successfully recorded in the database. Please process the package further.</p>
      
      <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #eee; text-align: center; color: #7f8c8d; font-size: 14px;">
        <p style="margin-bottom: 5px;">This is an automated notification from the TripEasy system.</p>
        <p style="font-size: 12px; margin-top: 20px; color: #95a5a6;">© ${new Date().getFullYear()} TripEasy. All rights reserved.</p>
      </div>
    </div>
  `
}

// Generate custom package request email notifications
export const generateAdminCustomPackageEmailHTML = (requestData) => {
  return `
    <div style="font-family: Arial, sans-serif; line-height: 1.6; max-width: 600px; margin: 0 auto; padding: 20px; color: #333;">
      <div style="text-align: center; margin-bottom: 20px;">
        <h1 style="color: #e53935; margin-bottom: 5px; font-size: 24px;">New Custom Package Request</h1>
        <p style="color: #7f8c8d; font-size: 16px;">Request ID: #${requestData.requestId}</p>
      </div>
      
      <div style="background-color: #f9f9f9; border-left: 4px solid #e53935; padding: 15px; margin-bottom: 20px; border-radius: 4px;">
        <p style="margin: 0; font-size: 16px;">A new custom package request has been submitted by <strong>${
          requestData.fullName
        }</strong>.</p>
      </div>
      
      <div style="background-color: #f5f5f5; border-radius: 4px; padding: 15px; margin: 20px 0;">
        <h3 style="color: #2c3e50; margin-top: 0; font-size: 18px;">Customer Information:</h3>
        <p><strong>Name:</strong> ${requestData.fullName}</p>
        <p><strong>Email:</strong> ${requestData.email}</p>
        <p><strong>Phone:</strong> ${requestData.phone}</p>
      </div>
      
      <div style="background-color: #f5f5f5; border-radius: 4px; padding: 15px; margin: 20px 0;">
        <h3 style="color: #2c3e50; margin-top: 0; font-size: 18px;">Trip Details:</h3>
        <p><strong>Origin:</strong> ${requestData.origin}</p>
        <p><strong>Destination:</strong> ${requestData.destination}</p>
        <p><strong>Start Date:</strong> ${requestData.startDate}</p>
        <p><strong>Duration:</strong> ${requestData.duration}</p>
        <p><strong>Budget:</strong> ${requestData.budget}</p>
        <p><strong>Travelers:</strong> ${requestData.travelers}</p>
      </div>
      
      <div style="background-color: #f5f5f5; border-radius: 4px; padding: 15px; margin: 20px 0;">
        <h3 style="color: #2c3e50; margin-top: 0; font-size: 18px;">Preferences:</h3>
        <p><strong>Activities:</strong> ${requestData.activities || "None specified"}</p>
        <p><strong>Accommodation:</strong> ${requestData.accommodation}</p>
        <p><strong>Transportation:</strong> ${requestData.transportation}</p>
        <p><strong>Special Requests:</strong> ${requestData.specialRequests || "None"}</p>
      </div>
      
      <p>Please review and respond to this request using the details provided above.</p>
      
      <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #eee; text-align: center; color: #7f8c8d; font-size: 14px;">
        <p>This is an automated notification from the TripEasy system.</p>
        <p>© ${new Date().getFullYear()} TripEasy. All rights reserved.</p>
      </div>
    </div>
  `
}

export const generateCustomerCustomPackageEmailHTML = (requestData, formattedActivities) => {
  return `
    <div style="font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; line-height: 1.6; max-width: 600px; margin: 0 auto; padding: 20px; color: #333; background-color: #ffffff;">
      <div style="text-align: center; margin-bottom: 25px; padding-bottom: 20px; border-bottom: 1px solid #f0f0f0;">
        <h1 style="color: #e53935; margin-bottom: 5px; font-size: 26px; font-weight: 700;">Thank You for Your Request!</h1>
        <p style="color: #7f8c8d; font-size: 16px; margin-top: 5px;">We're excited to plan your dream trip</p>
      </div>
      
      <div style="background-color: #fdf2f2; border-left: 4px solid #e53935; padding: 15px; margin-bottom: 20px; border-radius: 4px;">
        <p style="margin: 0; font-size: 16px; color: #2c3e50;">Dear <strong>${requestData.fullName}</strong>,</p>
      </div>
      
      <p style="font-size: 15px; color: #555;">Thank you for submitting your custom travel package request to TripEasy. We have received your request for a trip to <strong>${
        requestData.destination
      }</strong> starting on <strong>${
        requestData.startDate
      }</strong> for <strong>${requestData.duration}</strong>.</p>
      
      <p style="font-size: 15px; color: #555;">Our travel experts are reviewing your request and will contact you within 24-48 hours with a personalized travel plan tailored to your preferences.</p>
      
      <!-- Trip Details Card -->
      <div style="background-color: #f9f9f9; border: 1px solid #e0e0e0; border-radius: 8px; padding: 20px; margin: 20px 0;">
        <h3 style="color: #e53935; margin-top: 0; border-bottom: 2px solid #ffcdd2; padding-bottom: 8px; font-size: 18px; font-weight: 600;">
          ✈️ Trip Details
        </h3>
        <table style="width: 100%; border-collapse: collapse; margin-top: 10px; font-size: 14px;">
          <tr>
            <td style="padding: 6px 0; color: #7f8c8d; font-weight: bold; width: 40%;">Request ID:</td>
            <td style="padding: 6px 0; color: #2c3e50;">#${requestData.requestId || 'N/A'}</td>
          </tr>
          <tr>
            <td style="padding: 6px 0; color: #7f8c8d; font-weight: bold;">Origin / Departure:</td>
            <td style="padding: 6px 0; color: #2c3e50;">${requestData.origin || 'N/A'}</td>
          </tr>
          <tr>
            <td style="padding: 6px 0; color: #7f8c8d; font-weight: bold;">Destination:</td>
            <td style="padding: 6px 0; color: #2c3e50; font-weight: bold;">${requestData.destination}</td>
          </tr>
          <tr>
            <td style="padding: 6px 0; color: #7f8c8d; font-weight: bold;">Start Date:</td>
            <td style="padding: 6px 0; color: #2c3e50;">${requestData.startDate}</td>
          </tr>
          <tr>
            <td style="padding: 6px 0; color: #7f8c8d; font-weight: bold;">Duration:</td>
            <td style="padding: 6px 0; color: #2c3e50;">${requestData.duration}</td>
          </tr>
          <tr>
            <td style="padding: 6px 0; color: #7f8c8d; font-weight: bold;">Budget per Person:</td>
            <td style="padding: 6px 0; color: #2c3e50;">${requestData.budget || 'N/A'}</td>
          </tr>
          <tr>
            <td style="padding: 6px 0; color: #7f8c8d; font-weight: bold;">No. of Travelers:</td>
            <td style="padding: 6px 0; color: #2c3e50;">${requestData.travelers || '1'}</td>
          </tr>
        </table>
      </div>
      
      <!-- Preferences Card -->
      <div style="background-color: #f9f9f9; border: 1px solid #e0e0e0; border-radius: 8px; padding: 20px; margin: 20px 0;">
        <h3 style="color: #e53935; margin-top: 0; border-bottom: 2px solid #ffcdd2; padding-bottom: 8px; font-size: 18px; font-weight: 600;">
          🌟 Your Preferences
        </h3>
        <table style="width: 100%; border-collapse: collapse; margin-top: 10px; font-size: 14px;">
          <tr>
            <td style="padding: 6px 0; color: #7f8c8d; font-weight: bold; width: 40%;">Activities:</td>
            <td style="padding: 6px 0; color: #2c3e50;">${formattedActivities}</td>
          </tr>
          <tr>
            <td style="padding: 6px 0; color: #7f8c8d; font-weight: bold;">Accommodation:</td>
            <td style="padding: 6px 0; color: #2c3e50; text-transform: capitalize;">${requestData.accommodation || 'standard'}</td>
          </tr>
          <tr>
            <td style="padding: 6px 0; color: #7f8c8d; font-weight: bold;">Transportation:</td>
            <td style="padding: 6px 0; color: #2c3e50; text-transform: capitalize;">${requestData.transportation || 'public'}</td>
          </tr>
          <tr>
            <td style="padding: 6px 0; color: #7f8c8d; font-weight: bold; vertical-align: top;">Special Requests:</td>
            <td style="padding: 6px 0; color: #2c3e50; white-space: pre-line;">${requestData.specialRequests || 'None'}</td>
          </tr>
        </table>
      </div>
      
      <!-- What happens next -->
      <div style="background-color: #f5f5f5; border-radius: 8px; padding: 20px; margin: 20px 0;">
        <h3 style="color: #2c3e50; margin-top: 0; font-size: 18px; font-weight: 600;">What happens next?</h3>
        <ul style="padding-left: 20px; margin-bottom: 0; font-size: 14px; color: #555;">
          <li style="margin-bottom: 8px;">Our travel experts will review your request</li>
          <li style="margin-bottom: 8px;">We'll create a customized itinerary based on your preferences</li>
          <li style="margin-bottom: 8px;">We'll contact you to discuss the details and make any necessary adjustments</li>
          <li style="margin-bottom: 0;">Once you're satisfied, we'll finalize your booking</li>
        </ul>
      </div>
      
      <p style="font-size: 15px; color: #555;">If you have any questions or would like to provide additional information, please don't hesitate to contact us at <strong>booking.tripeasy@gmail.com</strong> or call us at <strong>+91 7880789486</strong>.</p>
      
      <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #eee; text-align: center; color: #7f8c8d; font-size: 14px;">
        <p style="margin-bottom: 5px;">We look forward to creating an unforgettable travel experience for you!</p>
        <p style="margin-top: 5px; margin-bottom: 25px;">Best regards,<br><strong style="color: #2c3e50;">TripEasy Team</strong></p>
        <p style="font-size: 12px; margin-top: 20px; color: #95a5a6;">© ${new Date().getFullYear()} TripEasy. All rights reserved.</p>
      </div>
    </div>
  `
}

// Generate customer booking request email
export const generateCustomerBookingEmailHTML = (bookingDetails, packageDetails, totalPrice, requestId, travellersList) => {
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Booking Request Received</title>
    </head>
    <body style="margin: 0; padding: 0; font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; background-color: #f9f9f9; color: #333;">
      <div style="max-width: 600px; margin: 0 auto; padding: 20px; background-color: #ffffff; border-radius: 8px; box-shadow: 0 4px 15px rgba(0,0,0,0.05); margin-top: 20px; margin-bottom: 20px;">
        <!-- Header -->
        <div style="text-align: center; margin-bottom: 25px; padding-bottom: 20px; border-bottom: 1px solid #f0f0f0;">
          <h1 style="color: #e53935; margin: 0 0 5px 0; font-size: 28px; font-weight: 700;">TripEasy</h1>
          <p style="color: #7f8c8d; margin: 0; font-size: 16px; font-weight: 500;">Your Travel Partner</p>
        </div>
        
        <h2 style="color: #2c3e50; font-size: 22px; margin-top: 0; font-weight: 600; text-align: center;">Booking Request Received</h2>
        
        <div style="background-color: #fdf2f2; border-left: 4px solid #e53935; padding: 15px; margin-bottom: 20px; border-radius: 4px;">
          <p style="margin: 0; font-size: 16px; color: #2c3e50;">Dear <strong>${bookingDetails.fullName}</strong>,</p>
        </div>
        
        <p style="font-size: 15px; color: #555; line-height: 1.6;">
          Thank you for choosing TripEasy! We have successfully received your booking request and our team will contact you soon to confirm your travel arrangements.
        </p>
        
        <!-- Booking Details Card -->
        <div style="background-color: #f9f9f9; border: 1px solid #e0e0e0; border-radius: 8px; padding: 20px; margin: 20px 0;">
          <h3 style="color: #e53935; margin-top: 0; border-bottom: 2px solid #ffcdd2; padding-bottom: 8px; font-size: 18px; font-weight: 600;">
            ✈️ Booking Details
          </h3>
          <table style="width: 100%; border-collapse: collapse; margin-top: 10px; font-size: 14px;">
            <tr>
              <td style="padding: 6px 0; color: #7f8c8d; font-weight: bold; width: 40%;">Request ID:</td>
              <td style="padding: 6px 0; color: #2c3e50;">#${requestId}</td>
            </tr>
            <tr>
              <td style="padding: 6px 0; color: #7f8c8d; font-weight: bold;">Package:</td>
              <td style="padding: 6px 0; color: #2c3e50; font-weight: bold;">${packageDetails.name}</td>
            </tr>
            <tr>
              <td style="padding: 6px 0; color: #7f8c8d; font-weight: bold;">Destination:</td>
              <td style="padding: 6px 0; color: #2c3e50;">${packageDetails.location}</td>
            </tr>
            <tr>
              <td style="padding: 6px 0; color: #7f8c8d; font-weight: bold;">Duration:</td>
              <td style="padding: 6px 0; color: #2c3e50;">${packageDetails.duration} Days</td>
            </tr>
            <tr>
              <td style="padding: 6px 0; color: #7f8c8d; font-weight: bold;">Travel Date:</td>
              <td style="padding: 6px 0; color: #2c3e50;">${new Date(bookingDetails.travelDate).toLocaleDateString("en-IN", {
                year: "numeric",
                month: "long",
                day: "numeric",
              })}</td>
            </tr>
            <tr>
              <td style="padding: 6px 0; color: #7f8c8d; font-weight: bold;">Total Travelers:</td>
              <td style="padding: 6px 0; color: #2c3e50;">${bookingDetails.travelers}</td>
            </tr>
            <tr>
              <td style="padding: 6px 0; color: #7f8c8d; font-weight: bold;">Total Price:</td>
              <td style="padding: 6px 0; color: #e53935; font-weight: bold; font-size: 16px;">₹${totalPrice?.toLocaleString("en-IN") || "To be confirmed"}</td>
            </tr>
          </table>
        </div>
        
        <!-- Travellers List Card -->
        <div style="background-color: #f9f9f9; border: 1px solid #e0e0e0; border-radius: 8px; padding: 20px; margin: 20px 0;">
          <h3 style="color: #e53935; margin-top: 0; border-bottom: 2px solid #ffcdd2; padding-bottom: 8px; font-size: 18px; font-weight: 600;">
            👥 Travelers List
          </h3>
          <div style="color: #2c3e50; font-size: 14px; white-space: pre-line; margin-top: 10px; line-height: 1.6;">${travellersList}</div>
        </div>
        
        <!-- Special Requests Card (if present) -->
        ${
          bookingDetails.specialRequests
            ? `
        <div style="background-color: #fffde7; border: 1px solid #fff59d; border-radius: 8px; padding: 20px; margin: 20px 0;">
          <h3 style="color: #fbc02d; margin-top: 0; border-bottom: 2px solid #fff59d; padding-bottom: 8px; font-size: 18px; font-weight: 600;">
            ✍️ Special Requests
          </h3>
          <p style="color: #5d4037; font-size: 14px; margin: 10px 0 0 0; white-space: pre-line;">${bookingDetails.specialRequests}</p>
        </div>
        `
            : ""
        }
        
        <!-- What's Next Card -->
        <div style="background-color: #f5f5f5; border-radius: 8px; padding: 20px; margin: 20px 0;">
          <h3 style="color: #2c3e50; margin-top: 0; font-size: 18px; font-weight: 600;">What's Next?</h3>
          <ul style="padding-left: 20px; margin-bottom: 0; font-size: 14px; color: #555; line-height: 1.6;">
            <li style="margin-bottom: 8px;">Our travel expert will contact you within 24 hours</li>
            <li style="margin-bottom: 8px;">We'll discuss and finalize your itinerary details</li>
            <li style="margin-bottom: 8px;">Payment and booking confirmation will follow</li>
            <li style="margin-bottom: 0;">You'll receive your complete travel documents</li>
          </ul>
        </div>
        
        <!-- Footer with updated details -->
        <p style="font-size: 15px; color: #555; text-align: center;">
          If you have any questions, please don't hesitate to contact us at:<br>
          <strong style="color: #e53935;">📧 booking.tripeasy@gmail.com</strong> or call us at <strong style="color: #e53935;">📞 +91 7880789486</strong>.
        </p>
        
        <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #eee; text-align: center; color: #7f8c8d; font-size: 14px;">
          <p style="margin-bottom: 5px;">We look forward to creating an unforgettable travel experience for you!</p>
          <p style="margin-top: 5px; margin-bottom: 25px;">Best regards,<br><strong style="color: #2c3e50;">TripEasy Team</strong></p>
          <p style="font-size: 12px; margin-top: 20px; color: #95a5a6;">© ${new Date().getFullYear()} TripEasy. All rights reserved.</p>
        </div>
      </div>
    </body>
    </html>
  `
}

// Generate Admin Booking Notification Email HTML
export const generateAdminBookingEmailHTML = (bookingDetails, packageDetails, totalPrice, requestId, travellersList) => {
  return `
    <div style="font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; line-height: 1.6; max-width: 600px; margin: 0 auto; padding: 20px; color: #333; background-color: #ffffff;">
      <div style="text-align: center; margin-bottom: 25px; padding-bottom: 20px; border-bottom: 1px solid #f0f0f0;">
        <h1 style="color: #e53935; margin-bottom: 5px; font-size: 26px; font-weight: 700;">New Booking Request</h1>
        <p style="color: #7f8c8d; font-size: 16px; margin-top: 5px;">Request ID: #${requestId}</p>
      </div>
      
      <div style="background-color: #fdf2f2; border-left: 4px solid #e53935; padding: 15px; margin-bottom: 20px; border-radius: 4px;">
        <p style="margin: 0; font-size: 16px; color: #2c3e50;">A new booking request has been submitted for <strong>${packageDetails.name}</strong>.</p>
      </div>
      
      <!-- Customer Info Card -->
      <div style="background-color: #f9f9f9; border: 1px solid #e0e0e0; border-radius: 8px; padding: 20px; margin: 20px 0;">
        <h3 style="color: #e53935; margin-top: 0; border-bottom: 2px solid #ffcdd2; padding-bottom: 8px; font-size: 18px; font-weight: 600;">
          👤 Customer Details
        </h3>
        <table style="width: 100%; border-collapse: collapse; margin-top: 10px; font-size: 14px;">
          <tr>
            <td style="padding: 6px 0; color: #7f8c8d; font-weight: bold; width: 40%;">Name:</td>
            <td style="padding: 6px 0; color: #2c3e50;">${bookingDetails.fullName}</td>
          </tr>
          <tr>
            <td style="padding: 6px 0; color: #7f8c8d; font-weight: bold;">Email:</td>
            <td style="padding: 6px 0; color: #2c3e50;">${bookingDetails.email}</td>
          </tr>
          <tr>
            <td style="padding: 6px 0; color: #7f8c8d; font-weight: bold;">Phone:</td>
            <td style="padding: 6px 0; color: #2c3e50;">${bookingDetails.phone}</td>
          </tr>
        </table>
      </div>
      
      <!-- Booking Details Card -->
      <div style="background-color: #f9f9f9; border: 1px solid #e0e0e0; border-radius: 8px; padding: 20px; margin: 20px 0;">
        <h3 style="color: #e53935; margin-top: 0; border-bottom: 2px solid #ffcdd2; padding-bottom: 8px; font-size: 18px; font-weight: 600;">
          ✈️ Booking Details
        </h3>
        <table style="width: 100%; border-collapse: collapse; margin-top: 10px; font-size: 14px;">
          <tr>
            <td style="padding: 6px 0; color: #7f8c8d; font-weight: bold; width: 40%;">Package Name:</td>
            <td style="padding: 6px 0; color: #2c3e50; font-weight: bold;">${packageDetails.name}</td>
          </tr>
          <tr>
            <td style="padding: 6px 0; color: #7f8c8d; font-weight: bold;">Location:</td>
            <td style="padding: 6px 0; color: #2c3e50;">${packageDetails.location}</td>
          </tr>
          <tr>
            <td style="padding: 6px 0; color: #7f8c8d; font-weight: bold;">Travel Date:</td>
            <td style="padding: 6px 0; color: #2c3e50;">${new Date(bookingDetails.travelDate).toLocaleDateString("en-IN")}</td>
          </tr>
          <tr>
            <td style="padding: 6px 0; color: #7f8c8d; font-weight: bold;">No. of Travelers:</td>
            <td style="padding: 6px 0; color: #2c3e50;">${bookingDetails.travelers}</td>
          </tr>
          <tr>
            <td style="padding: 6px 0; color: #7f8c8d; font-weight: bold;">Total Price:</td>
            <td style="padding: 6px 0; color: #e53935; font-weight: bold; font-size: 16px;">₹${totalPrice?.toLocaleString("en-IN") || "To be confirmed"}</td>
          </tr>
        </table>
      </div>

      <!-- Travelers List Card -->
      <div style="background-color: #f9f9f9; border: 1px solid #e0e0e0; border-radius: 8px; padding: 20px; margin: 20px 0;">
        <h3 style="color: #e53935; margin-top: 0; border-bottom: 2px solid #ffcdd2; padding-bottom: 8px; font-size: 18px; font-weight: 600;">
          👥 Travelers List
        </h3>
        <div style="color: #2c3e50; font-size: 14px; white-space: pre-line; margin-top: 10px; line-height: 1.6;">${travellersList}</div>
      </div>
      
      <!-- Special Requests Card (if present) -->
      ${
        bookingDetails.specialRequests
          ? `
      <div style="background-color: #fffde7; border: 1px solid #fff59d; border-radius: 8px; padding: 20px; margin: 20px 0;">
        <h3 style="color: #fbc02d; margin-top: 0; border-bottom: 2px solid #fff59d; padding-bottom: 8px; font-size: 18px; font-weight: 600;">
          ✍️ Special Requests
        </h3>
        <p style="color: #5d4037; font-size: 14px; margin: 10px 0 0 0; white-space: pre-line;">${bookingDetails.specialRequests}</p>
      </div>
      `
          : ""
      }
      
      <p style="font-size: 14px; color: #7f8c8d;">Please review and manage this booking request using the details provided above.</p>
      
      <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #eee; text-align: center; color: #7f8c8d; font-size: 14px;">
        <p style="margin-bottom: 5px;">This is an automated notification from the TripEasy system.</p>
        <p style="font-size: 12px; margin-top: 20px; color: #95a5a6;">© ${new Date().getFullYear()} TripEasy. All rights reserved.</p>
      </div>
    </div>
  `
}

// Generate Admin Contact Inquiry Email HTML
export const generateAdminContactEmailHTML = (name, email, phone, subject, message) => {
  return `
    <div style="font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; line-height: 1.6; max-width: 600px; margin: 0 auto; padding: 20px; color: #333; background-color: #ffffff;">
      <div style="text-align: center; margin-bottom: 25px; padding-bottom: 20px; border-bottom: 1px solid #f0f0f0;">
        <h1 style="color: #e53935; margin-bottom: 5px; font-size: 26px; font-weight: 700;">New Contact Inquiry</h1>
        <p style="color: #7f8c8d; font-size: 16px; margin-top: 5px;">A user has submitted a contact form on TripEasy</p>
      </div>
      
      <div style="background-color: #f9f9f9; border: 1px solid #e0e0e0; border-radius: 8px; padding: 20px; margin: 20px 0;">
        <h3 style="color: #e53935; margin-top: 0; border-bottom: 2px solid #ffcdd2; padding-bottom: 8px; font-size: 18px; font-weight: 600;">
          👤 Contact Details
        </h3>
        <table style="width: 100%; border-collapse: collapse; margin-top: 10px; font-size: 14px;">
          <tr>
            <td style="padding: 6px 0; color: #7f8c8d; font-weight: bold; width: 30%;">Name:</td>
            <td style="padding: 6px 0; color: #2c3e50; font-weight: bold;">${name}</td>
          </tr>
          <tr>
            <td style="padding: 6px 0; color: #7f8c8d; font-weight: bold;">Email:</td>
            <td style="padding: 6px 0; color: #2c3e50;"><a href="mailto:${email}" style="color: #e53935; text-decoration: none;">${email}</a></td>
          </tr>
          <tr>
            <td style="padding: 6px 0; color: #7f8c8d; font-weight: bold;">Phone:</td>
            <td style="padding: 6px 0; color: #2c3e50;">${phone}</td>
          </tr>
          <tr>
            <td style="padding: 6px 0; color: #7f8c8d; font-weight: bold;">Subject:</td>
            <td style="padding: 6px 0; color: #2c3e50;">${subject}</td>
          </tr>
        </table>
      </div>

      <div style="background-color: #f9f9f9; border: 1px solid #e0e0e0; border-radius: 8px; padding: 20px; margin: 20px 0;">
        <h3 style="color: #e53935; margin-top: 0; border-bottom: 2px solid #ffcdd2; padding-bottom: 8px; font-size: 18px; font-weight: 600;">
          💬 Message
        </h3>
        <p style="color: #2c3e50; font-size: 14px; margin: 10px 0 0 0; white-space: pre-line; line-height: 1.6;">${message}</p>
      </div>
      
      <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #eee; text-align: center; color: #7f8c8d; font-size: 14px;">
        <p style="margin-bottom: 5px;">This is an automated notification from the TripEasy system.</p>
        <p style="font-size: 12px; margin-top: 20px; color: #95a5a6;">© ${new Date().getFullYear()} TripEasy. All rights reserved.</p>
      </div>
    </div>
  `
}

// Generate customer contact form confirmation email
export const generateCustomerContactEmailHTML = (name, subject, message) => {
  return `
    <div style="font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; line-height: 1.6; max-width: 600px; margin: 0 auto; padding: 20px; color: #333; background-color: #ffffff;">
      <div style="text-align: center; margin-bottom: 25px; padding-bottom: 20px; border-bottom: 1px solid #f0f0f0;">
        <h1 style="color: #e53935; margin-bottom: 5px; font-size: 26px; font-weight: 700;">Thank You for Reaching Out!</h1>
        <p style="color: #7f8c8d; font-size: 16px; margin-top: 5px;">We have received your message</p>
      </div>
      
      <div style="background-color: #fdf2f2; border-left: 4px solid #e53935; padding: 15px; margin-bottom: 20px; border-radius: 4px;">
        <p style="margin: 0; font-size: 16px; color: #2c3e50;">Dear <strong>${name}</strong>,</p>
      </div>
      
      <p style="font-size: 15px; color: #555; line-height: 1.6;">
        Thanks for contacting us. We will read your message and will contact you soon.
      </p>

      <div style="background-color: #f9f9f9; border: 1px solid #e0e0e0; border-radius: 8px; padding: 25px; margin: 25px 0;">
        <h3 style="color: #e53935; margin-top: 0; border-bottom: 2px solid #ffcdd2; padding-bottom: 8px; font-size: 16px; font-weight: 600;">
          Inquiry Summary
        </h3>
        <table style="width: 100%; border-collapse: collapse; margin-top: 10px; font-size: 14px;">
          <tr>
            <td style="padding: 5px 0; color: #7f8c8d; font-weight: bold; width: 30%;">Subject:</td>
            <td style="padding: 5px 0; color: #2c3e50;">${subject}</td>
          </tr>
          <tr>
            <td style="padding: 5px 0; color: #7f8c8d; font-weight: bold; vertical-align: top;">Message:</td>
            <td style="padding: 5px 0; color: #2c3e50; white-space: pre-line;">${message}</td>
          </tr>
        </table>
      </div>
      
      <p style="font-size: 15px; color: #555; line-height: 1.6;">
        If you need urgent assistance, feel free to call us at <a href="tel:+917880789486" style="color: #e53935; text-decoration: none; font-weight: bold;">+91 78807 89486</a>.
      </p>

      <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #eee; text-align: center; color: #7f8c8d; font-size: 14px;">
        <p style="margin-bottom: 5px;">Best Regards,</p>
        <p style="font-weight: bold; color: #2c3e50; margin-top: 5px; margin-bottom: 15px;">Team TripEasy</p>
        <p style="font-size: 12px; color: #95a5a6;">© ${new Date().getFullYear()} TripEasy. All rights reserved.</p>
      </div>
    </div>
  `
}
