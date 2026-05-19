import express from "express"
import fs from "fs"
import path from "path"
import { upload, uploadsDir } from "../config/multer.js"

const router = express.Router()

// Upload package files (card image, detail image, destination image, brochure PDF)
router.post(
  "/upload-package-files",
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
          
          // For Vercel, return file info without URL
          const fileUrl = process.env.VERCEL === "1" 
            ? `/tmp/${file.filename}` 
            : `/uploads/${file.filename}`

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

// Upload single file (image or PDF)
router.post("/upload", upload.single("file"), (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: "No file uploaded",
      })
    }

    const fileUrl = process.env.VERCEL === "1"
      ? `/tmp/${req.file.filename}`
      : `/uploads/${req.file.filename}`

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

// Upload multiple files
router.post("/upload-multiple", upload.array("files", 10), (req, res) => {
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
        : `/uploads/${file.filename}`
      
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
router.get("/files", (req, res) => {
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

    const targetDir = uploadsDir
    const urlPrefix = "/uploads"

    const isImageFilter = type === "images"
    const isPdfFilter = type === "pdfs"

    const files = fs
      .readdirSync(targetDir)
      .filter((file) => {
        const filePath = path.join(targetDir, file)
        if (!fs.statSync(filePath).isFile()) return false
        if (isImageFilter) {
          return /\.(jpg|jpeg|png|gif|webp)$/i.test(file)
        }
        if (isPdfFilter) {
          return /\.pdf$/i.test(file)
        }
        return true
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
router.delete("/files/:filename", (req, res) => {
  try {
    // For Vercel, file deletion not supported
    if (process.env.VERCEL === "1") {
      return res.json({
        success: true,
        message: "File deletion not supported on Vercel"
      })
    }

    const { filename } = req.params
    const filePath = path.join(uploadsDir, filename)

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

export default router
