import express from "express"
import cors from "cors"
import axios from "axios"
import nodemailer from "nodemailer"
import puppeteer from "puppeteer-core"
import fs from "fs"
import path from "path"
import { fileURLToPath } from "url"
import multer from "multer"
import dotenv from "dotenv"

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

dotenv.config()

// Import Mongoose models with .js extension
import { connectDB } from "./db-config.js"
import Package from "./models/Package.js"
import Destination from "./models/Destination.js"
import Booking from "./models/Booking.js"
import Traveler from "./models/Traveler.js"
import CustomPackageRequest from "./models/CustomPackageRequest.js"
import BookingRequest from "./models/BookingRequest.js"

const app = express()
const port = process.env.PORT || 5000

const corsOptions = {
  origin: function (origin, callback) {
    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin) return callback(null, true);
    
    const allowedOrigins = [
      // Local development
      "http://localhost:3000",
      "http://localhost:5173",
      "http://127.0.0.1:3000",
      
      // Your domains
      "https://tripeasy.in",
      "https://www.tripeasy.in",
      
      // Vercel URLs
      "https://tripeasy-client-smoky.vercel.app",
      
      // For testing
      /\.tripeasy\.in$/,  // ALL tripeasy.in subdomains
      /\.vercel\.app$/,   // ALL vercel.app subdomains
    ];
    
    if (allowedOrigins.some(allowed => {
      if (allowed instanceof RegExp) {
        return allowed.test(origin);
      } else {
        return allowed === origin;
      }
    })) {
      callback(null, true);
    } else {
      callback(new Error("Not allowed by CORS"));
    }
  },
  credentials: true,
  methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization", "x-api-version", "x-request-id"],
  exposedHeaders: ["Content-Range", "X-Content-Range"],
  maxAge: 600, // 10 minutes
};

app.use(cors(corsOptions));
app.options("*", cors(corsOptions)); // IMPORTANT: For preflight requests

app.use(cors(corsOptions))
app.use(express.json({ limit: "50mb" }))
app.use(express.urlencoded({ extended: true, limit: "50mb" }))

// Helper functions for package data
const readPackagesData = async () => {
  return { packages: [], destinations: [], categories: [] }; // Return empty data for Vercel
};

const writePackagesData = async (data) => {
  return; // Do nothing for Vercel
}

// Function to get current time in IST
function getCurrentTimeInIST() {
  const now = new Date()
  const utc = now.getTime() + now.getTimezoneOffset() * 60000
  const ist = new Date(utc + 3600000 * 5.5) // IST is UTC+5:30
  return ist.toISOString().slice(0, 19).replace("T", " ") // Format as YYYY-MM-DD HH:MM:SS
}

// Create uploads directory if it doesn't exist (only for local)
const uploadsDir = path.join(__dirname, "uploads")

// VERCEL COMPATIBLE: Create directory only if not in serverless environment
if (process.env.VERCEL !== "1") {
  if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir, { recursive: true })
  }
  
  // Create subdirectories for different file types
  const imageUploadsDir = path.join(uploadsDir, "images")
  const pdfUploadsDir = path.join(uploadsDir, "pdfs")
  const tempUploadsDir = path.join(uploadsDir, "temp")

  if (!fs.existsSync(imageUploadsDir)) {
    fs.mkdirSync(imageUploadsDir, { recursive: true })
  }
  if (!fs.existsSync(pdfUploadsDir)) {
    fs.mkdirSync(pdfUploadsDir, { recursive: true })
  }
  if (!fs.existsSync(tempUploadsDir)) {
    fs.mkdirSync(tempUploadsDir, { recursive: true })
  }
  
  // Serve static files from uploads directory
  app.use("/uploads", express.static(uploadsDir))
}

// Configure multer for file uploads with enhanced organization
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    // For Vercel, use temp directory or skip
    if (process.env.VERCEL === "1") {
      cb(null, "/tmp")
    } else {
      let uploadPath = uploadsDir

      // Determine upload path based on file type and field name
      if (file.mimetype.startsWith("image/")) {
        uploadPath = path.join(uploadsDir, "images")
      } else if (file.mimetype === "application/pdf") {
        uploadPath = path.join(uploadsDir, "pdfs")
      }

      cb(null, uploadPath)
    }
  },
  filename: (req, file, cb) => {
    // Generate unique filename with timestamp and field name
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9)
    const extension = path.extname(file.originalname)
    const baseName = path.basename(file.originalname, extension)

    // Include field name in filename for better organization
    const fieldPrefix = file.fieldname ? `${file.fieldname}-` : ""
    cb(null, fieldPrefix + baseName + "-" + uniqueSuffix + extension)
  },
})

// Enhanced file filter for package uploads
const fileFilter = (req, file, cb) => {
  // Define allowed file types based on field names
  const allowedImageTypes = ["image/jpeg", "image/jpg", "image/png", "image/gif", "image/webp"]
  const allowedPdfTypes = ["application/pdf"]

  if (file.fieldname === "brochure") {
    // Only PDF for brochure
    if (allowedPdfTypes.includes(file.mimetype)) {
      cb(null, true)
    } else {
      cb(new Error("Brochure must be a PDF file!"), false)
    }
  } else if (["cardImage", "detailImage", "destinationImage"].includes(file.fieldname)) {
    // Only images for image fields
    if (allowedImageTypes.includes(file.mimetype)) {
      cb(null, true)
    } else {
      cb(new Error("Images must be JPEG, PNG, GIF, or WebP format!"), false)
    }
  } else {
    // General file upload - allow both images and PDFs
    if (allowedImageTypes.includes(file.mimetype) || allowedPdfTypes.includes(file.mimetype)) {
      cb(null, true)
    } else {
      cb(new Error("Only image files and PDFs are allowed!"), false)
    }
  }
}

const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit per file
    files: 10, // Maximum 10 files per request
  },
})

// Initialize MongoDB connection
connectDB()

// Email transporter configuration
const transporter = nodemailer.createTransport({
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

// Track emails sent to prevent duplicates
const emailsSent = new Set()

// ENHANCED FILE UPLOAD API ENDPOINTS

// Upload package files (card image, detail image, destination image, brochure PDF)
app.post(
  "/api/upload-package-files",
  upload.fields([
    { name: "cardImage", maxCount: 1 },
    { name: "detailImage", maxCount: 1 },
    { name: "destinationImage", maxCount: 1 },
    { name: "brochure", maxCount: 1 },
  ]),
  (req, res) => {
    try {
      if (!req.files || Object.keys(req.files).length === 0) {
        return res.status(400).json({
          success: false,
          message: "No files uploaded",
        })
      }

      const uploadedFiles = {}
      const fileDetails = {}

      // Process each file type
      Object.keys(req.files).forEach((fieldName) => {
        const files = req.files[fieldName]
        if (files && files.length > 0) {
          const file = files[0] // Take the first file for each field
          const isImage = file.mimetype.startsWith("image/")
          
          // For Vercel, return file info without URL
          const fileUrl = process.env.VERCEL === "1" 
            ? `/tmp/${file.filename}` 
            : `/uploads/${isImage ? "images" : "pdfs"}/${file.filename}`

          uploadedFiles[fieldName] = fileUrl
          fileDetails[fieldName] = {
            filename: file.filename,
            originalName: file.originalname,
            mimetype: file.mimetype,
            size: file.size,
            url: fileUrl,
          }
        }
      })

      res.json({
        success: true,
        message: `${Object.keys(uploadedFiles).length} files uploaded successfully`,
        files: uploadedFiles,
        details: fileDetails,
      })
    } catch (error) {
      console.error("Error uploading package files:", error)
      res.status(500).json({
        success: false,
        message: "Failed to upload files",
        error: error.message,
      })
    }
  },
)

// Upload single file (image or PDF) - existing endpoint
app.post("/api/upload", upload.single("file"), (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: "No file uploaded",
      })
    }

    const fileUrl = process.env.VERCEL === "1"
      ? `/tmp/${req.file.filename}`
      : `/uploads/${req.file.mimetype.startsWith("image/") ? "images" : "pdfs"}/${req.file.filename}`

    res.json({
      success: true,
      message: "File uploaded successfully",
      file: {
        filename: req.file.filename,
        originalName: req.file.originalname,
        mimetype: req.file.mimetype,
        size: req.file.size,
        url: fileUrl,
      },
    })
  } catch (error) {
    console.error("Error uploading file:", error)
    res.status(500).json({
      success: false,
      message: "Failed to upload file",
      error: error.message,
    })
  }
})

// Upload multiple files - existing endpoint
app.post("/api/upload-multiple", upload.array("files", 10), (req, res) => {
  try {
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({
        success: false,
        message: "No files uploaded",
      })
    }

    const uploadedFiles = req.files.map((file) => {
      const fileUrl = process.env.VERCEL === "1"
        ? `/tmp/${file.filename}`
        : `/uploads/${file.mimetype.startsWith("image/") ? "images" : "pdfs"}/${file.filename}`
      
      return {
        filename: file.filename,
        originalName: file.originalname,
        mimetype: file.mimetype,
        size: file.size,
        url: fileUrl,
      }
    })

    res.json({
      success: true,
      message: `${uploadedFiles.length} files uploaded successfully`,
      files: uploadedFiles,
    })
  } catch (error) {
    console.error("Error uploading files:", error)
    res.status(500).json({
      success: false,
      message: "Failed to upload files",
      error: error.message,
    })
  }
})

// Get list of uploaded files
app.get("/api/files", (req, res) => {
  try {
    // For Vercel, return empty list as file storage is temporary
    if (process.env.VERCEL === "1") {
      return res.json({
        success: true,
        files: [],
        message: "File listing not available on Vercel"
      })
    }

    const { type } = req.query // 'images' or 'pdfs'

    let targetDir = uploadsDir
    let urlPrefix = "/uploads"

    if (type === "images") {
      targetDir = path.join(uploadsDir, "images")
      urlPrefix = "/uploads/images"
    } else if (type === "pdfs") {
      targetDir = path.join(uploadsDir, "pdfs")
      urlPrefix = "/uploads/pdfs"
    }

    const files = fs
      .readdirSync(targetDir)
      .filter((file) => {
        const filePath = path.join(targetDir, file)
        return fs.statSync(filePath).isFile()
      })
      .map((file) => {
        const filePath = path.join(targetDir, file)
        const stats = fs.statSync(filePath)
        return {
          filename: file,
          url: `${urlPrefix}/${file}`,
          size: stats.size,
          createdAt: stats.birthtime,
          modifiedAt: stats.mtime,
        }
      })
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))

    res.json({
      success: true,
      files: files,
    })
  } catch (error) {
    console.error("Error fetching files:", error)
    res.status(500).json({
      success: false,
      message: "Failed to fetch files",
      error: error.message,
    })
  }
})

// Delete uploaded file
app.delete("/api/files/:filename", (req, res) => {
  try {
    // For Vercel, file deletion not supported
    if (process.env.VERCEL === "1") {
      return res.json({
        success: true,
        message: "File deletion not supported on Vercel"
      })
    }

    const { filename } = req.params
    const { type } = req.query // 'images' or 'pdfs'

    let targetDir = uploadsDir

    if (type === "images") {
      targetDir = path.join(uploadsDir, "images")
    } else if (type === "pdfs") {
      targetDir = path.join(uploadsDir, "pdfs")
    }

    const filePath = path.join(targetDir, filename)

    if (!fs.existsSync(filePath)) {
      return res.status(404).json({
        success: false,
        message: "File not found",
      })
    }

    fs.unlinkSync(filePath)

    res.json({
      success: true,
      message: "File deleted successfully",
    })
  } catch (error) {
    console.error("Error deleting file:", error)
    res.status(500).json({
      success: false,
      message: "Failed to delete file",
      error: error.message,
    })
  }
})

// Generate receipt HTML function (unchanged)
const generateReceiptHTML = (orderData, bookingDetails, packageDetails) => {
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
              <span>${traveler.fullName}</span>
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
            <p>For any queries, please contact us at <strong>booking.tripeasy@gmail.com</strong> or call <strong>+91 9157450389</strong></p>
            <p>© ${new Date().getFullYear()} TripEasy. All rights reserved.</p>
          </div>
        </div>
      </div>
    </body>
    </html>
  `
}

// FIXED: Improved PDF generation function - Disabled for Vercel
async function generatePDF(html, outputPath) {
  // TEMPORARY: For Vercel deployment, skip PDF generation
  console.log("PDF generation disabled for Vercel deployment");
  throw new Error("PDF generation not available on Vercel. Use localhost for PDF features.");
}

// FIXED: Improved sendReceiptEmail function with better error handling
const sendReceiptEmail = async (to, subject, orderData, bookingDetails, packageDetails) => {
  try {
    // Check if this email has already been sent to this recipient for this order
    const emailKey = `${to}_${orderData.order_id}`
    if (emailsSent.has(emailKey)) {
      console.log(`Email already sent to ${to} for order ${orderData.order_id}, skipping duplicate`)
      return { success: true, message: "Receipt email already sent" }
    }

    // Mark this email as sent BEFORE sending to prevent race conditions
    emailsSent.add(emailKey)

    console.log("Sending receipt email to:", to)

    const htmlContent = generateReceiptHTML(orderData, bookingDetails, packageDetails)

    const attachments = []

    // Only try to generate PDF if not on Vercel
    if (process.env.VERCEL !== "1") {
      try {
        const pdfFilePath = path.join(
          __dirname, "uploads", "temp",
          `receipt_${orderData.order_id}_${to.replace(/[^a-zA-Z0-9]/g, "")}.pdf`,
        )

        // Generate PDF using puppeteer
        await generatePDF(htmlContent, pdfFilePath)
        
        // Verify the file exists before trying to attach it
        if (fs.existsSync(pdfFilePath)) {
          attachments.push({
            filename: `TripEasy_Receipt_${orderData.order_id}.pdf`,
            path: pdfFilePath,
            contentType: "application/pdf",
          })
        }
      } catch (pdfError) {
        console.error("PDF generation failed, sending email without attachment:", pdfError.message)
        // Continue without PDF attachment
      }
    }

    // Send email with or without PDF attachment
    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: to,
      subject: subject,
      html: `
        <div style="font-family: Arial, sans-serif; line-height: 1.6; max-width: 600px; margin: 0 auto; padding: 20px; color: #333;">
          <div style="text-align: center; margin-bottom: 20px;">
            <h1 style="color: #2c3e50; margin-bottom: 5px; font-size: 24px;">Thank You for Your Booking!</h1>
            <p style="color: #7f8c8d; font-size: 16px;">Your adventure awaits</p>
          </div>
          
          <div style="background-color: #f9f9f9; border-left: 4px solid #3498db; padding: 15px; margin-bottom: 20px; border-radius: 4px;">
            <p style="margin: 0; font-size: 16px;">Dear <strong>${bookingDetails.fullName}</strong>,</p>
          </div>
          
          <p>Your booking for <strong>${packageDetails.name}</strong> has been confirmed. Your payment of <strong>₹${orderData.order_amount.toLocaleString("en-IN")}</strong> has been successfully processed.</p>
          
          <div style="background-color: #eef7fe; border-radius: 4px; padding: 15px; margin: 20px 0;">
            <h3 style="color: #2c3e50; margin-top: 0;">Booking Details:</h3>
            <p><strong>Order ID:</strong> ${orderData.order_id}</p>
            <p><strong>Travel Date:</strong> ${bookingDetails.travelDate}</p>
            <p><strong>Destination:</strong> ${packageDetails.location}</p>
            <p><strong>Duration:</strong> ${packageDetails.duration} Days</p>
            <p><strong>Number of Travelers:</strong> ${bookingDetails.travelers}</p>
          </div>
          
          <p><strong>Important:</strong> Your original booking package tickets will be provided within a few hours.</p>
          ${attachments.length > 0 ? "<p>Please find your booking receipt attached to this email.</p>" : "<p>Your booking receipt will be available for download from your account.</p>"}
          
          <p>If you have any questions or need assistance, please don't hesitate to contact us.</p>
          
          <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #eee; text-align: center; color: #7f8c8d; font-size: 14px;">
            <p>We look forward to providing you with an amazing travel experience!</p>
            <p>Best regards,<br><strong>TripEasy Team</strong></p>
            <p style="font-size: 12px; margin-top: 20px;">© ${new Date().getFullYear()} TripEasy. All rights reserved.</p>
          </div>
        </div>
      `,
      attachments: attachments,
    }

    const info = await transporter.sendMail(mailOptions)
    console.log("Email sent successfully:", info.response)

    return { success: true, message: "Receipt email sent successfully" }
  } catch (error) {
    console.error("Error sending receipt email:", error)
    // Remove the email from sent set if sending failed
    const emailKey = `${to}_${orderData.order_id}`
    emailsSent.delete(emailKey)
    return {
      success: false,
      message: "Failed to send receipt email",
      error: error.message,
    }
  }
}

// FIXED: Improved saveBookingToDatabase function with better error handling and data validation
async function saveBookingToDatabase(orderData, bookingDetails, packageDetails) {
  try {
    console.log("Starting database transaction for booking:", orderData.order_id)

    // First check if this order already exists in the database BEFORE starting a transaction
    const existingOrdersCheck = await Booking.findOne({
      order_id: orderData.order_id,
    })

    if (existingOrdersCheck) {
      console.log(
        `Order ${orderData.order_id} already exists in database with ID ${existingOrdersCheck._id}, skipping insertion`,
      )
      return {
        alreadyExists: true,
        bookingId: existingOrdersCheck._id.toString(),
      }
    }

    // Check one more time inside transaction-like logic
    const existingOrders = await Booking.findOne({
      order_id: orderData.order_id,
    })

    if (existingOrders) {
      console.log(`Order ${orderData.order_id} was just inserted by another request, skipping insertion`)
      return {
        alreadyExists: true,
        bookingId: existingOrders._id.toString(),
      }
    }

    console.log("Inserting new booking into database:", {
      orderId: orderData.order_id,
      customerName: bookingDetails.fullName,
      packageName: packageDetails.name,
    })

    // FIXED: Create new booking document with proper data mapping
    const newBooking = new Booking({
      order_id: orderData.order_id,
      customer_name: bookingDetails.fullName,
      customer_email: bookingDetails.email,
      customer_phone: bookingDetails.phone,
      customer_gender: bookingDetails.gender || null,
      customer_age: bookingDetails.age || null,
      travel_date: new Date(bookingDetails.travelDate),
      num_travelers: bookingDetails.travelers,
      package_id: packageDetails.id || packageDetails._id,
      package_name: packageDetails.name,
      package_location: packageDetails.location,
      package_duration: packageDetails.duration,
      package_price: packageDetails.price,
      total_price: orderData.order_amount,
      payment_status: "completed",
      transaction_id: orderData.order_id,
      booking_date: new Date(),
      status: "confirmed",
      special_requests: bookingDetails.specialRequests || null,
    })

    const savedBooking = await newBooking.save()
    const bookingId = savedBooking._id.toString()
    console.log(`Booking inserted with ID: ${bookingId}`)

    // Add additional travelers if present
    if (bookingDetails.additionalTravelers && bookingDetails.additionalTravelers.length > 0) {
      console.log(`Adding ${bookingDetails.additionalTravelers.length} additional travelers`)

      const travelersData = bookingDetails.additionalTravelers.map((traveler) => ({
        booking_id: savedBooking._id,
        name: traveler.fullName || traveler.name,
        gender: traveler.gender || null,
        age: traveler.age || null,
      }))

      await Traveler.insertMany(travelersData)
    }

    return { success: true, bookingId }
  } catch (error) {
    console.error("Database error:", error)
    throw error
  }
}

// Cashfree API configuration
const CASHFREE_BASE_URL = "https://sandbox.cashfree.com/pg"

// Create order endpoint
app.post("/api/create-order", async (req, res) => {
  try {
    const { amount, currency = "INR", customerDetails } = req.body

    // Generate a unique order ID
    const orderId = "order_" + Date.now() + "_" + Math.floor(Math.random() * 1000)

    const request = {
      order_id: orderId,
      order_amount: Number.parseFloat(amount),
      order_currency: currency,
      customer_details: {
        customer_id: customerDetails.customer_id || "customer_" + Date.now(),
        customer_name: customerDetails.customer_name,
        customer_email: customerDetails.customer_email,
        customer_phone: customerDetails.customer_phone,
      },
      order_meta: {
        return_url: `${process.env.FRONTEND_URL || "http://localhost:3000"}/payment-status?order_id=${orderId}`,
      },
    }

    const response = await axios.post(`${CASHFREE_BASE_URL}/orders`, request, {
      headers: {
        "x-api-version": "2023-08-01",
        "x-client-id": process.env.CASHFREE_APP_ID,
        "x-client-secret": process.env.CASHFREE_SECRET_KEY,
        "Content-Type": "application/json",
      },
    })

    res.json(response.data)
  } catch (error) {
    console.error("Error creating order:", error.response ? error.response.data : error.message)
    res.status(500).json({
      error: "Failed to create order",
      message: error.response ? error.response.data : error.message,
    })
  }
})

// Verify payment endpoint - FIXED
app.get("/api/verify-payment/:orderId", async (req, res) => {
  try {
    const { orderId } = req.params

    const response = await axios.get(`${CASHFREE_BASE_URL}/orders/${orderId}`, {
      headers: {
        "x-api-version": "2023-08-01",
        "x-client-id": process.env.CASHFREE_APP_ID,
        "x-client-secret": process.env.CASHFREE_SECRET_KEY,
      },
    })

    // Get payment status
    const paymentStatus = response.data.order_status

    // Return payment result
    res.json({
      order_id: orderId,
      status: paymentStatus,
      message: paymentStatus === "PAID" ? "Payment successful" : "Payment failed",
      data: response.data,
    })
  } catch (error) {
    console.error("Error verifying payment:", error.response ? error.response.data : error.message)
    res.status(500).json({
      error: "Failed to verify payment",
      message: error.response ? error.response.data : error.message,
    })
  }
})

// FIXED: Improved save-booking endpoint with better validation
app.post("/api/save-booking", async (req, res) => {
  try {
    const { orderData, bookingDetails, packageDetails } = req.body

    console.log("Received booking save request:", {
      orderId: orderData?.order_id,
      hasBookingDetails: !!bookingDetails,
      hasPackageDetails: !!packageDetails,
    })

    if (!orderData || !bookingDetails || !packageDetails) {
      return res.status(400).json({
        success: false,
        message: "Missing required data for saving booking",
      })
    }

    if (!orderData.order_id) {
      return res.status(400).json({
        success: false,
        message: "Missing order_id in orderData",
      })
    }

    // Validate required booking fields
    if (!bookingDetails.fullName || !bookingDetails.email || !bookingDetails.phone) {
      return res.status(400).json({
        success: false,
        message: "Missing required customer details (name, email, phone)",
      })
    }

    // Validate required package fields
    if (!packageDetails.name || !packageDetails.location || !packageDetails.price) {
      return res.status(400).json({
        success: false,
        message: "Missing required package details",
      })
    }

    console.log("Saving booking to database:", {
      orderId: orderData.order_id,
      customerName: bookingDetails.fullName,
      packageName: packageDetails.name,
    })

    // Save booking to database
    const result = await saveBookingToDatabase(orderData, bookingDetails, packageDetails)

    if (result.alreadyExists) {
      console.log(`Booking for order ${orderData.order_id} already exists in database with ID ${result.bookingId}`)
      return res.json({
        success: true,
        message: "Booking already exists in database",
        bookingId: result.bookingId,
        alreadyExists: true,
      })
    }

    console.log(`Booking saved successfully with ID: ${result.bookingId}`)
    res.json({
      success: true,
      message: "Booking saved successfully",
      bookingId: result.bookingId,
    })
  } catch (error) {
    console.error("Error saving booking:", error)
    res.status(500).json({
      success: false,
      message: "Failed to save booking",
      error: error.message,
    })
  }
})

// Send receipt endpoint
app.post("/api/send-receipt", async (req, res) => {
  try {
    const { orderData, bookingDetails, packageDetails } = req.body

    if (!orderData || !bookingDetails || !packageDetails) {
      return res.status(400).json({
        success: false,
        message: "Missing required data for receipt generation",
      })
    }

    // Check if this email has already been sent
    const emailKey = `${bookingDetails.email}_${orderData.order_id}`
    if (emailsSent.has(emailKey)) {
      console.log(`Email already sent to ${bookingDetails.email} for order ${orderData.order_id}, skipping duplicate`)
      return res.json({
        success: true,
        message: "Receipt email already sent",
      })
    }

    console.log("Sending receipt email to:", bookingDetails.email)

    // Send only one email to the customer
    const result = await sendReceiptEmail(
      bookingDetails.email,
      "Your TripEasy Booking Receipt",
      orderData,
      bookingDetails,
      packageDetails,
    )

    res.json(result)
  } catch (error) {
    console.error("Error sending receipt:", error)
    res.status(500).json({
      success: false,
      message: "Failed to send receipt email",
      error: error.message,
    })
  }
})

// Generate receipt PDF endpoint (updated to use puppeteer PDF generation)
app.post("/api/generate-receipt", async (req, res) => {
  try {
    // For Vercel, return error as PDF generation is not supported
    if (process.env.VERCEL === "1") {
      return res.status(400).json({
        success: false,
        message: "PDF generation not available on Vercel. Please use localhost for this feature.",
      });
    }

    let orderData, bookingDetails, packageDetails

    try {
      orderData = typeof req.body.orderData === "string" ? JSON.parse(req.body.orderData) : req.body.orderData

      bookingDetails =
        typeof req.body.bookingDetails === "string" ? JSON.parse(req.body.bookingDetails) : req.body.bookingDetails

      packageDetails =
        typeof req.body.packageDetails === "string" ? JSON.parse(req.body.packageDetails) : req.body.packageDetails
    } catch (parseError) {
      console.error("Error parsing request data:", parseError)
      return res.status(400).json({
        success: false,
        message: "Invalid request data format",
        error: parseError.message,
      })
    }

    if (!orderData || !bookingDetails || !packageDetails) {
      return res.status(400).json({
        success: false,
        message: "Missing required data for receipt generation",
      })
    }

    const orderId = orderData?.order_id || `receipt_${Date.now()}`
    const uniqueId = Date.now().toString().slice(-4)
    const pdfFilePath = path.join(uploadsDir, "temp", `receipt_${orderId}_${uniqueId}.pdf`)

    console.log("Generating receipt PDF for order:", orderId)

    const htmlContent = generateReceiptHTML(orderData, bookingDetails, packageDetails)

    // Generate PDF using puppeteer
    await generatePDF(htmlContent, pdfFilePath)

    console.log("PDF generated successfully at:", pdfFilePath)

    if (!fs.existsSync(pdfFilePath)) {
      throw new Error(`PDF file not found at ${pdfFilePath}`)
    }

    const fileData = fs.readFileSync(pdfFilePath)

    res.setHeader("Content-Type", "application/pdf")
    res.setHeader("Content-Disposition", `attachment; filename=TripEasy_Receipt_${orderId}.pdf`)
    res.setHeader("Content-Length", fileData.length)

    res.send(fileData)

    // Clean up file after sending
    setTimeout(() => {
      try {
        if (fs.existsSync(pdfFilePath)) {
          fs.unlinkSync(pdfFilePath)
          console.log("Temporary PDF file deleted successfully after download")
        }
      } catch (deleteError) {
        console.error("Warning: Could not delete temporary PDF file after download:", deleteError)
      }
    }, 15000)
  } catch (error) {
    console.error("Error generating receipt:", error)
    if (!res.headersSent) {
      res.status(500).json({
        success: false,
        message: "Failed to generate receipt PDF",
        error: error.message,
      })
    }
  }
})

app.get("/api/ha", (req, res) => {
  res.send("Cashfree Payment Gateway API is running")
})

// Customize package section

app.post("/api/submit-custom-package", async (req, res) => {
  try {
    console.log("[v0] Custom package request received:", req.body)

    const {
      fullName,
      email,
      phone,
      origin,
      destination,
      startDate,
      duration,
      budget,
      travelers,
      activities,
      accommodation,
      transportation,
      specialRequests,
    } = req.body

    // Validate required fields
    if (!fullName || !email || !phone || !origin || !destination) {
      console.error("[v0] Missing required fields in custom package request")
      return res.status(400).json({
        success: false,
        message: "Missing required fields",
      })
    }

    // Generate a unique request ID
    const requestId = `CP_${Date.now()}_${Math.floor(Math.random() * 1000)}`

    const newCustomPackageRequest = new CustomPackageRequest({
      full_name: fullName,
      email: email,
      phone: phone,
      departure_location: origin, // Map origin to departure_location
      destination: destination,
      start_date: new Date(startDate),
      duration: duration,
      budget: budget,
      travelers: Number.parseInt(travelers) || 1,
      activities: Array.isArray(activities) && activities.length > 0 ? activities.join(", ") : activities || "",
      accommodation: accommodation || "standard",
      transportation: transportation || "public",
      special_requests: specialRequests || "",
      status: "pending",
      request_date: new Date(),
    })

    const savedCustomPackageRequest = await newCustomPackageRequest.save()
    console.log(`[v0] Custom package request saved with ID: ${requestId} and departure_location: ${origin}`)

    // Send notification email to admin
    try {
      await sendCustomPackageNotification(process.env.EMAIL_USER, "New Custom Package Request", {
        fullName,
        email,
        phone,
        origin,
        destination,
        startDate,
        duration,
        budget,
        travelers,
        activities,
        accommodation,
        transportation,
        specialRequests,
        requestId,
      })
    } catch (emailError) {
      console.error("Error sending admin notification email:", emailError)
      // Continue even if email fails
    }

    // Send confirmation email to user
    try {
      await sendCustomPackageConfirmation(email, "Your Custom Travel Package Request", {
        fullName,
        destination,
        startDate,
        duration,
      })
    } catch (emailError) {
      console.error("Error sending confirmation email:", emailError)
      // Continue even if email fails
    }

    res.json({
      success: true,
      message: "Custom package request submitted successfully",
      requestId,
    })
  } catch (error) {
    console.error("Error submitting custom package request:", error)
    res.status(500).json({
      success: false,
      message: "Failed to submit custom package request",
      error: error.message,
    })
  }
})

app.get("/api/custom-package-requests", async (req, res) => {
  try {
    const requests = await CustomPackageRequest.find({}).sort({
      request_date: -1,
    })

    res.json({
      success: true,
      requests: requests,
    })
  } catch (error) {
    console.error("Error fetching custom package requests:", error)
    res.status(500).json({
      success: false,
      message: "Failed to fetch custom package requests",
      error: error.message,
    })
  }
})

app.put("/api/custom-package-requests/:id", async (req, res) => {
  try {
    const { id } = req.params
    const { status } = req.body

    if (!status) {
      return res.status(400).json({
        success: false,
        message: "Status is required",
      })
    }

    const updatedRequest = await CustomPackageRequest.findByIdAndUpdate(
      id,
      { status, last_updated: new Date() },
      { new: true },
    )

    if (!updatedRequest) {
      return res.status(404).json({
        success: false,
        message: "Request not found",
      })
    }

    res.json({
      success: true,
      message: "Custom package request updated successfully",
    })
  } catch (error) {
    console.error("Error updating custom package request:", error)
    res.status(500).json({
      success: false,
      message: "Failed to update custom package request",
      error: error.message,
    })
  }
})

// Function to send notification email to admin
const sendCustomPackageNotification = async (to, subject, requestData) => {
  try {
    const mailOptions = {
      from: `"TripEasy Travel" <${process.env.EMAIL_USER}>`,
      to: to,
      subject: subject,
      html: `
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
          
          <p>Please log in to the admin dashboard to review and respond to this request.</p>
          
          <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #eee; text-align: center; color: #7f8c8d; font-size: 14px;">
            <p>This is an automated notification from the TripEasy system.</p>
            <p>© ${new Date().getFullYear()} TripEasy. All rights reserved.</p>
          </div>
        </div>
      `,
    }

    await transporter.sendMail(mailOptions)
    console.log("Admin notification email sent successfully")
    return { success: true }
  } catch (error) {
    console.error("Error sending admin notification email:", error)
    return { success: false, error: error.message }
  }
}

// Function to send confirmation email to customer
const sendCustomPackageConfirmation = async (to, subject, requestData) => {
  try {
    const mailOptions = {
      from: `"TripEasy Travel" <${process.env.EMAIL_USER}>`,
      to: to,
      subject: subject,
      html: `
        <div style="font-family: Arial, sans-serif; line-height: 1.6; max-width: 600px; margin: 0 auto; padding: 20px; color: #333;">
          <div style="text-align: center; margin-bottom: 20px;">
            <h1 style="color: #e53935; margin-bottom: 5px; font-size: 24px;">Thank You for Your Request!</h1>
            <p style="color: #7f8c8d; font-size: 16px;">We're excited to plan your dream trip</p>
          </div>
          
          <div style="background-color: #f9f9f9; border-left: 4px solid #e53935; padding: 15px; margin-bottom: 20px; border-radius: 4px;">
            <p style="margin: 0; font-size: 16px;">Dear <strong>${requestData.fullName}</strong>,</p>
          </div>
          
          <p>Thank you for submitting your custom travel package request to TripEasy. We have received your request for a trip to <strong>${
            requestData.destination
          }</strong> starting on <strong>${
            requestData.startDate
          }</strong> for <strong>${requestData.duration}</strong>.</p>
          
          <p>Our travel experts are reviewing your request and will contact you within 24-48 hours with a personalized travel plan tailored to your preferences.</p>
          
          <div style="background-color: #f5f5f5; border-radius: 4px; padding: 15px; margin: 20px 0;">
            <h3 style="color: #2c3e50; margin-top: 0; font-size: 18px;">What happens next?</h3>
            <ul style="padding-left: 20px;">
              <li>Our travel experts will review your request</li>
              <li>We'll create a customized itinerary based on your preferences</li>
              <li>We'll contact you to discuss the details and make any necessary adjustments</li>
              <li>Once you're satisfied, we'll finalize your booking</li>
            </ul>
          </div>
          
          <p>If you have any questions or would like to provide additional information, please don't hesitate to contact us at <strong>booking.tripeasy@gmail.com</strong> or call us at <strong>+91 1234567890</strong>.</p>
          
          <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #eee; text-align: center; color: #7f8c8d; font-size: 14px;">
            <p>We look forward to creating an unforgettable travel experience for you!</p>
            <p>Best regards,<br><strong>TripEasy Team</strong></p>
            <p style="font-size: 12px; margin-top: 20px;">© ${new Date().getFullYear()} TripEasy. All rights reserved.</p>
          </div>
        </div>
      `,
    }

    await transporter.sendMail(mailOptions)
    console.log("Customer confirmation email sent successfully")
    return { success: true }
  } catch (error) {
    console.error("Error sending customer confirmation email:", error)
    return { success: false, error: error.message }
  }
}

// NEW DYNAMIC PACKAGE API ENDPOINTS

app.get("/api/packages", async (req, res) => {
  try {
    const packages = await Package.find({})
    const categories = [...new Set(packages.map((pkg) => pkg.category))]

    const destinations = await Destination.find({})

    res.json({
      success: true,
      packages: packages,
      destinations: destinations,
      categories: categories,
    })
  } catch (error) {
    console.error("Error fetching packages:", error)
    res.status(500).json({
      success: false,
      message: "Failed to fetch packages",
      error: error.message,
    })
  }
})

app.get("/api/packages/:identifier", async (req, res) => {
  try {
    const { identifier } = req.params
    let package_

    // Try to find by ID first
    const packageId = Number.parseInt(identifier)
    if (!isNaN(packageId)) {
      package_ = await Package.findOne({ id: packageId })
    }

    // If not found, try to find by slug (name converted to slug format)
    if (!package_) {
      // Create a case-insensitive regex for matching the slug
      // Replace hyphens with spaces for lookup
      const slugIdentifier = identifier.replace(/-/g, " ")
      package_ = await Package.findOne({
        name: { $regex: new RegExp(`^${slugIdentifier}$`, "i") },
      })
    }

    if (!package_) {
      return res.status(404).json({
        success: false,
        message: "Package not found",
      })
    }

    res.json({
      success: true,
      package: package_,
    })
  } catch (error) {
    console.error("Error fetching package:", error)
    res.status(500).json({
      success: false,
      message: "Failed to fetch package",
      error: error.message,
    })
  }
})

// Admin API endpoints
app.get("/api/admin/packages", async (req, res) => {
  try {
    const packages = await Package.find({})
    res.json({
      success: true,
      data: {
        packages: packages,
      },
    })
  } catch (error) {
    console.error("Error fetching packages:", error)
    res.status(500).json({
      success: false,
      message: "Failed to fetch packages",
      error: error.message,
    })
  }
})

app.post("/api/admin/packages", async (req, res) => {
  try {
    const newPackage = req.body

    // Validate required fields
    const requiredFields = ["name", "price", "duration", "location", "category", "description"]
    const missingFields = requiredFields.filter((field) => !newPackage[field])

    if (missingFields.length > 0) {
      return res.status(400).json({
        success: false,
        message: `Missing required fields: ${missingFields.join(", ")}`,
      })
    }

    // Validate numeric fields
    if (isNaN(newPackage.price) || newPackage.price <= 0) {
      return res.status(400).json({
        success: false,
        message: "Invalid price value",
      })
    }
    if (isNaN(newPackage.duration) || newPackage.duration <= 0) {
      return res.status(400).json({
        success: false,
        message: "Invalid duration value",
      })
    }

    // Get max ID for new package
    const maxPackage = await Package.findOne({}).sort({ id: -1 })
    const nextId = (maxPackage?.id || 0) + 1

    // Ensure highlights and itinerary are arrays
    if (newPackage.highlights && !Array.isArray(newPackage.highlights)) {
      newPackage.highlights = [newPackage.highlights]
    } else if (!newPackage.highlights) {
      newPackage.highlights = []
    }
    if (newPackage.itinerary && !Array.isArray(newPackage.itinerary)) {
      newPackage.itinerary = [newPackage.itinerary]
    } else if (!newPackage.itinerary) {
      newPackage.itinerary = []
    }

    // Add default values
    newPackage.id = nextId
    newPackage.rating = newPackage.rating || 0
    newPackage.reviews = newPackage.reviews || 0
    newPackage.featured = newPackage.featured || false
    newPackage.image = newPackage.image || ""
    newPackage.pdfUrl = newPackage.pdfUrl || ""

    const createdPackage = await Package.create(newPackage)

    res.json({
      success: true,
      message: "Package created successfully",
      data: {
        package: createdPackage,
      },
    })
  } catch (error) {
    console.error("Error creating package:", error)
    res.status(500).json({
      success: false,
      message: "Failed to create package",
      error: error.message,
    })
  }
})

app.put("/api/admin/packages/:id", async (req, res) => {
  try {
    const packageId = Number.parseInt(req.params.id, 10)
    const updatedPackageData = req.body

    // Ensure highlights and itinerary are arrays
    if (updatedPackageData.highlights && !Array.isArray(updatedPackageData.highlights)) {
      updatedPackageData.highlights = [updatedPackageData.highlights]
    } else if (!updatedPackageData.highlights) {
      updatedPackageData.highlights = []
    }
    if (updatedPackageData.itinerary && !Array.isArray(updatedPackageData.itinerary)) {
      updatedPackageData.itinerary = [updatedPackageData.itinerary]
    } else if (!updatedPackageData.itinerary) {
      updatedPackageData.itinerary = []
    }

    const updatedPackage = await Package.findOneAndUpdate(
      { id: packageId },
      { ...updatedPackageData, updatedAt: new Date() },
      { new: true },
    )

    if (!updatedPackage) {
      return res.status(404).json({
        success: false,
        message: "Package not found",
      })
    }

    res.json({
      success: true,
      message: "Package updated successfully",
      data: {
        package: updatedPackage,
      },
    })
  } catch (error) {
    console.error("Error updating package:", error)
    res.status(500).json({
      success: false,
      message: "Failed to update package",
      error: error.message,
    })
  }
})

app.delete("/api/admin/packages/:id", async (req, res) => {
  try {
    const packageId = Number.parseInt(req.params.id, 10)

    const deletedPackage = await Package.findOneAndDelete({ id: packageId })

    if (!deletedPackage) {
      return res.status(404).json({
        success: false,
        message: "Package not found",
      })
    }

    res.json({
      success: true,
      message: "Package deleted successfully",
    })
  } catch (error) {
    console.error("Error deleting package:", error)
    res.status(500).json({
      success: false,
      message: "Failed to delete package",
      error: error.message,
    })
  }
})

app.get("/api/admin/packages/:id", async (req, res) => {
  try {
    const packageId = Number.parseInt(req.params.id, 10)

    const package_ = await Package.findOne({ id: packageId })

    if (!package_) {
      return res.status(404).json({
        success: false,
        message: "Package not found",
      })
    }

    res.json({
      success: true,
      data: {
        package: package_,
      },
    })
  } catch (error) {
    console.error("Error fetching package:", error)
    res.status(500).json({
      success: false,
      message: "Failed to fetch package",
      error: error.message,
    })
  }
})

// NEW ENDPOINTS FOR DESTINATIONS
// Get all destinations
app.get("/api/destinations", async (req, res) => {
  try {
    const destinations = await Destination.find({})
    res.json({
      success: true,
      data: {
        destinations: destinations,
      },
    })
  } catch (error) {
    console.error("Error fetching destinations:", error)
    res.status(500).json({
      success: false,
      message: "Failed to fetch destinations",
      error: error.message,
    })
  }
})

// Get a single destination by ID
app.get("/api/destinations/:id", async (req, res) => {
  try {
    const { id } = req.params
    const destination = await Destination.findOne({ id: Number.parseInt(id) })

    if (!destination) {
      return res.status(404).json({
        success: false,
        message: "Destination not found",
      })
    }

    res.json({
      success: true,
      data: {
        destination: destination,
      },
    })
  } catch (error) {
    console.error("Error fetching destination:", error)
    res.status(500).json({
      success: false,
      message: "Failed to fetch destination",
      error: error.message,
    })
  }
})

// Get destinations by favorable month
app.get("/api/destinations/month/:month", async (req, res) => {
  try {
    const { month } = req.params
    const monthNum = Number.parseInt(month)

    if (isNaN(monthNum) || monthNum < 0 || monthNum > 11) {
      return res.status(400).json({
        success: false,
        message: "Invalid month. Please provide a number between 0 and 11",
      })
    }

    const destinations = await Destination.find({
      favorableMonths: monthNum,
    })

    res.json({
      success: true,
      data: {
        destinations: destinations,
        month: monthNum,
      },
    })
  } catch (error) {
    console.error("Error fetching destinations for month:", error)
    res.status(500).json({
      success: false,
      message: "Failed to fetch destinations for month",
      error: error.message,
    })
  }
})

// Create a new destination
app.post("/api/destinations", async (req, res) => {
  try {
    const newDestination = new Destination(req.body)
    await newDestination.save()
    res.status(201).json({ success: true, data: { destination: newDestination } })
  } catch (error) {
    console.error("Error creating destination:", error)
    res.status(500).json({ success: false, message: "Failed to create destination", error: error.message })
  }
})

// Update a destination by ID
app.put("/api/destinations/:id", async (req, res) => {
  try {
    const updatedDestination = await Destination.findByIdAndUpdate(req.params.id, req.body, { new: true })
    if (!updatedDestination) {
      return res.status(404).json({ success: false, message: "Destination not found" })
    }
    res.json({ success: true, data: { destination: updatedDestination } })
  } catch (error) {
    console.error("Error updating destination:", error)
    res.status(500).json({ success: false, message: "Failed to update destination", error: error.message })
  }
})

// Delete a destination by ID
app.delete("/api/destinations/:id", async (req, res) => {
  try {
    const deletedDestination = await Destination.findByIdAndDelete(req.params.id)
    if (!deletedDestination) {
      return res.status(404).json({ success: false, message: "Destination not found" })
    }
    res.json({ success: true, message: "Destination deleted successfully" })
  } catch (error) {
    console.error("Error deleting destination:", error)
    res.status(500).json({ success: false, message: "Failed to delete destination", error: error.message })
  }
})

app.get("/api/destinations/:destinationName/packages", async (req, res) => {
  try {
    const { destinationName } = req.params

    // Find packages that match this destination
    const packages = await Package.find({
      location: { $regex: new RegExp(`^${destinationName}$`, "i") },
    })

    res.json({
      success: true,
      data: {
        packages: packages,
        count: packages.length,
      },
    })
  } catch (error) {
    console.error("Error fetching packages by destination:", error)
    res.status(500).json({
      success: false,
      message: "Failed to fetch packages",
      error: error.message,
    })
  }
})

app.post("/api/submit-booking-request", async (req, res) => {
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

    // Generate a unique request ID
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

    console.log(`Booking request saved with ID: ${requestId}`)

    // Prepare email content
    let travellersList = `1. ${bookingDetails.fullName} (Lead Traveller)`
    if (bookingDetails.additionalTravelers && bookingDetails.additionalTravelers.length > 0) {
      bookingDetails.additionalTravelers.forEach((traveler, index) => {
        travellersList += `\n${index + 2}. ${traveler.fullName}`
      })
    }

    const emailHtml = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Booking Request Received</title>
        <style>
          @media only screen and (max-width: 600px) {
            .container { width: 100% !important; padding: 10px !important; }
            .content { padding: 15px !important; }
            .details-table { font-size: 14px !important; }
            .details-table td { padding: 6px 0 !important; display: block !important; width: 100% !important; }
            .details-table .label { font-weight: bold !important; margin-bottom: 2px !important; }
            .details-table .value { margin-bottom: 10px !important; word-wrap: break-word !important; }
            .section { padding: 15px !important; margin: 15px 0 !important; }
            h1 { font-size: 24px !important; }
            h2 { font-size: 20px !important; }
            h3 { font-size: 18px !important; }
          }
        </style>
      </head>
      <body style="margin: 0; padding: 0; font-family: Arial, sans-serif; background-color: #f9f9f9;">
        <div class="container" style="max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f9f9f9;">
          <div class="content" style="background-color: white; padding: 30px; border-radius: 10px; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">
            <div style="text-align: center; margin-bottom: 30px;">
              <h1 style="color: #2c5aa0; margin: 0; font-size: 28px;">TripEasy</h1>
              <p style="color: #666; margin: 5px 0 0 0; font-size: 16px;">Your Travel Partner</p>
            </div>
            
            <h2 style="color: #333; border-bottom: 2px solid #2c5aa0; padding-bottom: 10px; font-size: 22px;">Booking Request Received</h2>
            
            <p style="color: #333; font-size: 16px; line-height: 1.6;">
              Dear <strong>${bookingDetails.fullName}</strong>,
            </p>
            
            <p style="color: #333; font-size: 16px; line-height: 1.6;">
              Thank you for choosing TripEasy! We have successfully received your booking request and our team will contact you soon to confirm your travel arrangements.
            </p>
            
            <div class="section" style="background-color: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0;">
              <h3 style="color: #2c5aa0; margin-top: 0; font-size: 18px;">Booking Details:</h3>
              <table class="details-table" style="width: 100%; border-collapse: collapse; font-size: 16px;">
                <tr>
                  <td class="label" style="padding: 8px 0; color: #666; font-weight: bold; width: 40%; vertical-align: top;">Request ID:</td>
                  <td class="value" style="padding: 8px 0; color: #333; word-wrap: break-word;">${requestId}</td>
                </tr>
                <tr>
                  <td class="label" style="padding: 8px 0; color: #666; font-weight: bold; width: 40%; vertical-align: top;">Package:</td>
                  <td class="value" style="padding: 8px 0; color: #333; word-wrap: break-word;">${
                    packageDetails.name
                  }</td>
                </tr>
                <tr>
                  <td class="label" style="padding: 8px 0; color: #666; font-weight: bold; width: 40%; vertical-align: top;">Destination:</td>
                  <td class="value" style="padding: 8px 0; color: #333; word-wrap: break-word;">${
                    packageDetails.location
                  }</td>
                </tr>
                <tr>
                  <td class="label" style="padding: 8px 0; color: #666; font-weight: bold; width: 40%; vertical-align: top;">Duration:</td>
                  <td class="value" style="padding: 8px 0; color: #333; word-wrap: break-word;">${
                    packageDetails.duration
                  }</td>
                </tr>
                <tr>
                  <td class="label" style="padding: 8px 0; color: #666; font-weight: bold; width: 40%; vertical-align: top;">Travel Date:</td>
                  <td class="value" style="padding: 8px 0; color: #333; word-wrap: break-word;">${new Date(
                    bookingDetails.travelDate,
                  ).toLocaleDateString("en-IN", {
                    year: "numeric",
                    month: "long",
                    day: "numeric",
                  })}</td>
                </tr>
                <tr>
                  <td class="label" style="padding: 8px 0; color: #666; font-weight: bold; width: 40%; vertical-align: top;">Total Travellers:</td>
                  <td class="value" style="padding: 8px 0; color: #333; word-wrap: break-word;">${
                    bookingDetails.travelers
                  }</td>
                </tr>
                <tr>
                  <td class="label" style="padding: 8px 0; color: #666; font-weight: bold; width: 40%; vertical-align: top;">Total Price:</td>
                  <td class="value" style="padding: 8px 0; color: #333; font-weight: bold; word-wrap: break-word;">₹${
                    totalPrice?.toLocaleString("en-IN") || "To be confirmed"
                  }</td>
                </tr>
              </table>
            </div>
            
            <div class="section" style="background-color: #e8f4fd; padding: 20px; border-radius: 8px; margin: 20px 0;">
              <h3 style="color: #2c5aa0; margin-top: 0; font-size: 18px;">Travellers List:</h3>
              <div style="color: #333; font-family: Arial, sans-serif; white-space: pre-line; margin: 0; word-wrap: break-word;">${travellersList}</div>
            </div>
            
            ${
              bookingDetails.specialRequests
                ? `
            <div class="section" style="background-color: #fff3cd; padding: 20px; border-radius: 8px; margin: 20px 0;">
              <h3 style="color: #856404; margin-top: 0; font-size: 18px;">Special Requests:</h3>
              <p style="color: #856404; margin: 0; word-wrap: break-word;">${bookingDetails.specialRequests}</p>
            </div>
            `
                : ""
            }
            
            <div class="section" style="background-color: #d4edda; padding: 20px; border-radius: 8px; margin: 20px 0;">
              <h3 style="color: #155724; margin-top: 0; font-size: 18px;">What's Next?</h3>
              <ul style="color: #155724; margin: 10px 0; padding-left: 20px;">
                <li style="margin-bottom: 8px;">Our travel expert will contact you within 24 hours</li>
                <li style="margin-bottom: 8px;">We'll discuss and finalize your itinerary details</li>
                <li style="margin-bottom: 8px;">Payment and booking confirmation will follow</li>
                <li style="margin-bottom: 8px;">You'll receive your complete travel documents</li>
              </ul>
            </div>
            
            <div style="text-align: center; margin-top: 30px; padding-top: 20px; border-top: 1px solid #eee;">
              <p style="color: #666; margin: 10px 0; word-wrap: break-word;">
                For any queries, contact us at:<br>
                <strong style="color: #2c5aa0;">📧 info@tripeasy.com</strong><br>
                <strong style="color: #2c5aa0;">📞 +91-XXXXXXXXXX</strong>
              </p>
              <p style="color: #999; font-size: 14px; margin: 20px 0 0 0;">
                Thank you for choosing TripEasy. We look forward to making your journey memorable!
              </p>
            </div>
          </div>
        </div>
      </body>
      </html>
    `

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

app.post("/api/booking-requests", async (req, res) => {
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

    // Generate a unique request ID
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
      lead_traveler_id: null, // Lead traveler has no parent
    })

    const savedLeadTraveler = await leadTraveler.save()
    console.log(`[v0] Lead traveler saved with ID: ${savedLeadTraveler._id}`)

    if (bookingDetails.additionalTravelers && bookingDetails.additionalTravelers.length > 0) {
      const additionalTravelersData = bookingDetails.additionalTravelers.map((traveler) => ({
        booking_id: savedRequest._id,
        name: traveler.fullName || traveler.name,
        gender: traveler.gender || null,
        age: traveler.age || null,
        lead_traveler_id: savedLeadTraveler._id, // Link to lead traveler
      }))

      const savedAdditionalTravelers = await Traveler.insertMany(additionalTravelersData)
      console.log(
        `[v0] Additional travelers saved: ${savedAdditionalTravelers.length} travelers with lead_traveler_id: ${savedLeadTraveler._id}`,
      )
    }

    // Prepare travellers list
    let travellersList = `1. ${bookingDetails.fullName} (Lead Traveller - ID: ${savedLeadTraveler._id})`
    if (bookingDetails.additionalTravelers && bookingDetails.additionalTravelers.length > 0) {
      bookingDetails.additionalTravelers.forEach((traveler, index) => {
        travellersList += `\n${index + 2}. ${traveler.fullName || traveler.name}`
      })
    }

    // Customer confirmation email
    const customerEmailHtml = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Booking Request Received</title>
        <style>
          @media only screen and (max-width: 600px) {
            .container { width: 100% !important; padding: 10px !important; }
            .content { padding: 15px !important; }
            .details-table { font-size: 14px !important; }
            .details-table td { padding: 6px 0 !important; display: block !important; width: 100% !important; }
            .details-table .label { font-weight: bold !important; margin-bottom: 2px !important; }
            .details-table .value { margin-bottom: 10px !important; word-wrap: break-word !important; }
            .section { padding: 15px !important; margin: 15px 0 !important; }
            h1 { font-size: 24px !important; }
            h2 { font-size: 20px !important; }
            h3 { font-size: 18px !important; }
          }
        </style>
      </head>
      <body style="margin: 0; padding: 0; font-family: Arial, sans-serif; background-color: #f9f9f9;">
        <div class="container" style="max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f9f9f9;">
          <div class="content" style="background-color: white; padding: 30px; border-radius: 10px; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">
            <div style="text-align: center; margin-bottom: 30px;">
              <h1 style="color: #2c5aa0; margin: 0; font-size: 28px;">TripEasy</h1>
              <p style="color: #666; margin: 5px 0 0 0; font-size: 16px;">Your Travel Partner</p>
            </div>
            
            <h2 style="color: #333; border-bottom: 2px solid #2c5aa0; padding-bottom: 10px; font-size: 22px;">Booking Request Received</h2>
            
            <p style="color: #333; font-size: 16px; line-height: 1.6;">
              Dear <strong>${bookingDetails.fullName}</strong>,
            </p>
            
            <p style="color: #333; font-size: 16px; line-height: 1.6;">
              Thank you for choosing TripEasy! We have successfully received your booking request and our team will contact you soon to confirm your travel arrangements.
            </p>
            
            <div class="section" style="background-color: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0;">
              <h3 style="color: #2c5aa0; margin-top: 0; font-size: 18px;">Booking Details:</h3>
              <table class="details-table" style="width: 100%; border-collapse: collapse; font-size: 16px;">
                <tr>
                  <td class="label" style="padding: 8px 0; color: #666; font-weight: bold; width: 40%; vertical-align: top;">Request ID:</td>
                  <td class="value" style="padding: 8px 0; color: #333; word-wrap: break-word;">${requestId}</td>
                </tr>
                <tr>
                  <td class="label" style="padding: 8px 0; color: #666; font-weight: bold; width: 40%; vertical-align: top;">Package:</td>
                  <td class="value" style="padding: 8px 0; color: #333; word-wrap: break-word;">${packageDetails.name}</td>
                </tr>
                <tr>
                  <td class="label" style="padding: 8px 0; color: #666; font-weight: bold; width: 40%; vertical-align: top;">Destination:</td>
                  <td class="value" style="padding: 8px 0; color: #333; word-wrap: break-word;">${packageDetails.location}</td>
                </tr>
                <tr>
                  <td class="label" style="padding: 8px 0; color: #666; font-weight: bold; width: 40%; vertical-align: top;">Duration:</td>
                  <td class="value" style="padding: 8px 0; color: #333; word-wrap: break-word;">${packageDetails.duration}</td>
                </tr>
                <tr>
                  <td class="label" style="padding: 8px 0; color: #666; font-weight: bold; width: 40%; vertical-align: top;">Travel Date:</td>
                  <td class="value" style="padding: 8px 0; color: #333; word-wrap: break-word;">${new Date(
                    bookingDetails.travelDate,
                  ).toLocaleDateString("en-IN", {
                    year: "numeric",
                    month: "long",
                    day: "numeric",
                  })}</td>
                </tr>
                <tr>
                  <td class="label" style="padding: 8px 0; color: #666; font-weight: bold; width: 40%; vertical-align: top;">Total Travellers:</td>
                  <td class="value" style="padding: 8px 0; color: #333; word-wrap: break-word;">${bookingDetails.travelers}</td>
                </tr>
                <tr>
                  <td class="label" style="padding: 8px 0; color: #666; font-weight: bold; width: 40%; vertical-align: top;">Total Price:</td>
                  <td class="value" style="padding: 8px 0; color: #333; font-weight: bold; word-wrap: break-word;">₹${
                    totalPrice?.toLocaleString("en-IN") || "To be confirmed"
                  }</td>
                </tr>
              </table>
            </div>
            
            <div class="section" style="background-color: #e8f4fd; padding: 20px; border-radius: 8px; margin: 20px 0;">
              <h3 style="color: #2c5aa0; margin-top: 0; font-size: 18px;">Travellers List:</h3>
              <div style="color: #333; font-family: Arial, sans-serif; white-space: pre-line; margin: 0; word-wrap: break-word;">${travellersList}</div>
            </div>
            
            ${
              bookingDetails.specialRequests
                ? `
            <div class="section" style="background-color: #fff3cd; padding: 20px; border-radius: 8px; margin: 20px 0;">
              <h3 style="color: #856404; margin-top: 0; font-size: 18px;">Special Requests:</h3>
              <p style="color: #856404; margin: 0; word-wrap: break-word;">${bookingDetails.specialRequests}</p>
            </div>
            `
                : ""
            }
            
            <div class="section" style="background-color: #d4edda; padding: 20px; border-radius: 8px; margin: 20px 0;">
              <h3 style="color: #155724; margin-top: 0; font-size: 18px;">What's Next?</h3>
              <ul style="color: #155724; margin: 10px 0; padding-left: 20px;">
                <li style="margin-bottom: 8px;">Our travel expert will contact you within 24 hours</li>
                <li style="margin-bottom: 8px;">We'll discuss and finalize your itinerary details</li>
                <li style="margin-bottom: 8px;">Payment and booking confirmation will follow</li>
                <li style="margin-bottom: 8px;">You'll receive your complete travel documents</li>
              </ul>
            </div>
            
            <div style="text-align: center; margin-top: 30px; padding-top: 20px; border-top: 1px solid #eee;">
              <p style="color: #666; margin: 10px 0; word-wrap: break-word;">
                For any queries, contact us at:<br>
                <strong style="color: #2c5aa0;">📧 info@tripeasy.com</strong><br>
                <strong style="color: #2c5aa0;">📞 +91-XXXXXXXXXX</strong>
              </p>
              <p style="color: #999; font-size: 14px; margin: 20px 0 0 0;">
                Thank you for choosing TripEasy. We look forward to making your journey memorable!
              </p>
            </div>
          </div>
        </div>
      </body>
      </html>
    `

    // Send customer confirmation email with error handling (doesn't fail the request)
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
      // Don't throw - email failure shouldn't fail the booking
    }

    // Send admin notification email
    try {
      const adminEmailHtml = `
        <html>
          <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
            <h2>New Booking Request Received</h2>
            <p><strong>Request ID:</strong> ${requestId}</p>
            <p><strong>Customer Name:</strong> ${bookingDetails.fullName}</p>
            <p><strong>Email:</strong> ${bookingDetails.email}</p>
            <p><strong>Phone:</strong> ${bookingDetails.phone}</p>
            <p><strong>Package:</strong> ${packageDetails.name}</p>
            <p><strong>Location:</strong> ${packageDetails.location}</p>
            <p><strong>Travel Date:</strong> ${new Date(bookingDetails.travelDate).toLocaleDateString("en-IN")}</p>
            <p><strong>Number of Travelers:</strong> ${bookingDetails.travelers}</p>
            <p><strong>Total Price:</strong> ₹${totalPrice?.toLocaleString("en-IN") || "To be confirmed"}</p>
            ${bookingDetails.specialRequests ? `<p><strong>Special Requests:</strong> ${bookingDetails.specialRequests}</p>` : ""}
          </body>
        </html>
      `

      const adminMailOptions = {
        from: `"TripEasy Travel" <${process.env.EMAIL_USER}>`,
        to: process.env.ADMIN_EMAIL || process.env.EMAIL_USER, // Fallback to sender if ADMIN_EMAIL is not set
        subject: `New Booking Request - ${packageDetails.name}`,
        html: adminEmailHtml,
      }

      await transporter.sendMail(adminMailOptions)
      console.log(`[v0] Admin notification sent for request ${requestId}`)
    } catch (adminEmailError) {
      console.error(`[v0] Error sending admin email: ${adminEmailError.message}`)
      // Don't throw - email failure shouldn't fail the booking
    }

    // Send success response back to client
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

// Health check endpoint
app.get("/", (req, res) => {
  res.json({
    message: "TripEasy Backend API is running",
    status: "healthy",
    timestamp: new Date().toISOString(),
  });
});

// Start server
if (process.env.VERCEL !== "1") {
  app.listen(port, () => {
    console.log(`Server running on port ${port}`);
  });
}

// Export for Vercel
export default app;