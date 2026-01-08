import mongoose from "mongoose"
import path from "path"
import { fileURLToPath } from "url"
import { readFile } from "fs/promises"
import dotenv from "dotenv"

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

dotenv.config({ path: path.join(__dirname, "../.env") })

import Package from "../models/Package.js"

const seedDatabase = async () => {
  try {
    const mongoDB_URI = process.env.MONGODB_URI

    if (!mongoDB_URI) {
      console.error("MONGODB_URI not found in .env file")
      process.exit(1)
    }

    console.log("[v0] Connecting to MongoDB with URI:", mongoDB_URI.substring(0, 50) + "...")

    await mongoose.connect(mongoDB_URI, {
      serverSelectionTimeoutMS: 10000,
      socketTimeoutMS: 45000,
    })
    console.log("[v0] Connected to MongoDB successfully!")

    // Load packages data using fs/promises instead of require
    const packagesDataPath = path.join(__dirname, "../../frontend/src/data/packagesData.json")
    console.log("[v0] Loading packages from:", packagesDataPath)

    const fileContent = await readFile(packagesDataPath, "utf-8")
    const packagesData = JSON.parse(fileContent)
    console.log("[v0] Loaded packages data:", {
      total: packagesData.packages?.length || 0,
      hasDestinations: !!packagesData.destinations,
    })

    // Clear existing packages
    console.log("[v0] Clearing existing packages...")
    const deleteResult = await Package.deleteMany({})
    console.log("[v0] Deleted packages:", deleteResult.deletedCount)

    // Insert packages from JSON
    if (packagesData.packages && Array.isArray(packagesData.packages)) {
      console.log("[v0] Inserting packages...")
      const insertedPackages = await Package.insertMany(packagesData.packages)
      console.log("[v0] Successfully inserted " + insertedPackages.length + " packages")

      // Show sample of inserted packages
      console.log("[v0] Sample packages inserted:")
      insertedPackages.slice(0, 3).forEach((pkg) => {
        console.log(`  - ${pkg.name} (ID: ${pkg.id}) - Category: ${pkg.category}`)
      })
    } else {
      console.warn("[v0] No packages found in data or invalid format")
    }

    await new Promise((resolve) => setTimeout(resolve, 1000))

    await mongoose.connection.close()
    console.log("[v0] Disconnected from MongoDB")
    console.log("[v0] Seeding completed successfully!")
    process.exit(0)
  } catch (error) {
    console.error("[v0] Error during seeding:", error.message)
    console.error("[v0] Full error:", error)

    try {
      await mongoose.connection.close()
    } catch (closeError) {
      console.error("[v0] Error closing connection:", closeError.message)
    }

    process.exit(1)
  }
}

seedDatabase()
