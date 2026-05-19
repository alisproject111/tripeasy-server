import multer from "multer"
import path from "path"
import fs from "fs"

// Absolute uploads directory path at the root of the server
export const uploadsDir = path.join(process.cwd(), "uploads")

// VERCEL COMPATIBLE: Create directory only if not in serverless environment
if (process.env.VERCEL !== "1") {
  if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir, { recursive: true })
  }
}

// Configure multer for file uploads with enhanced organization
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    // For Vercel, use temp directory
    if (process.env.VERCEL === "1") {
      cb(null, "/tmp")
    } else {
      cb(null, uploadsDir)
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
  const allowedImageTypes = ["image/jpeg", "image/jpg", "image/png", "image/gif", "image/webp"]
  const allowedPdfTypes = ["application/pdf"]

  if (file.fieldname === "brochure") {
    if (allowedPdfTypes.includes(file.mimetype)) {
      cb(null, true)
    } else {
      cb(new Error("Brochure must be a PDF file!"), false)
    }
  } else if (["cardImage", "detailImage", "destinationImage"].includes(file.fieldname)) {
    if (allowedImageTypes.includes(file.mimetype)) {
      cb(null, true)
    } else {
      cb(new Error("Images must be JPEG, PNG, GIF, or WebP format!"), false)
    }
  } else {
    if (allowedImageTypes.includes(file.mimetype) || allowedPdfTypes.includes(file.mimetype)) {
      cb(null, true)
    } else {
      cb(new Error("Only image files and PDFs are allowed!"), false)
    }
  }
}

export const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit per file
    files: 10, // Maximum 10 files per request
  },
})
