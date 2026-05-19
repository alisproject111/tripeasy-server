import express from "express"
import Destination from "../models/Destination.js"
import Package from "../models/Package.js"

const router = express.Router()

// Get all destinations (with calculated package counts)
router.get("/destinations", async (req, res) => {
  try {
    const destinations = await Destination.find({})
    
    // Fetch all packages with only name and location fields (lightweight)
    const packages = await Package.find({}, "location name")

    const getPackageCountForDestination = (destination) => {
      if (!destination.name) return 0
      const destinationName = destination.name.toLowerCase()

      const commonWords = [
        "india", "the", "and", "&", "of", "in", "at", "to", "for", "with", "by", "a", "an",
        "escape", "retreat", "tour", "adventure", "getaway", "vacation", "holiday", "trip",
        "experience", "expedition", "journey", "splendor", "bliss", "explorer", "package", "packages"
      ]

      const locationWords = destinationName
        .split(/[\s,&-]+/)
        .filter((word) => word.length > 2 && !commonWords.includes(word))

      const matchingPackages = packages.filter((pkg) => {
        if (!pkg.location) return false
        const packageLocation = pkg.location.toLowerCase()
        const packageName = pkg.name.toLowerCase()
        return locationWords.some((word) => packageLocation.includes(word) || packageName.includes(word))
      })

      return matchingPackages.length
    }

    const destinationsWithCounts = destinations.map((dest) => {
      const destObj = dest.toObject ? dest.toObject() : dest
      return {
        ...destObj,
        count: getPackageCountForDestination(destObj),
      }
    })

    res.json({
      success: true,
      data: {
        destinations: destinationsWithCounts,
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
router.get("/destinations/:id", async (req, res) => {
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
router.get("/destinations/month/:month", async (req, res) => {
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
router.post("/destinations", async (req, res) => {
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
router.put("/destinations/:id", async (req, res) => {
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
router.delete("/destinations/:id", async (req, res) => {
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

// Get packages by destination name
router.get("/destinations/:destinationName/packages", async (req, res) => {
  try {
    const { destinationName } = req.params

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

export default router
