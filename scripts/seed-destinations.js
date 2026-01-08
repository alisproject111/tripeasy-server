import mongoose from "mongoose"
import path from "path"
import { fileURLToPath } from "url"
import dotenv from "dotenv"

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

dotenv.config({ path: path.join(__dirname, "../.env") })

import Destination from "../models/Destination.js"

const destinationsData = [
  {
    id: 1,
    name: "Goa",
    image: "/assets/packages/Goa1.jpg",
    description: "Explore the beauty and culture of Goa with our curated travel packages.",
    location: "Goa, India",
    favorableMonths: [0, 1, 9, 10, 11], // Jan, Feb, Oct, Nov, Dec
  },
  {
    id: 2,
    name: "Shimla & Manali",
    image: "/assets/packages/Shimla1.jpg",
    description: "Explore the beauty and culture of Shimla & Manali with our curated travel packages.",
    location: "Himachal Pradesh, India",
    favorableMonths: [4, 5, 6, 7], // May, June, July, Aug
  },
  {
    id: 3,
    name: "Daman",
    image: "/assets/packages/Daman1.jpg",
    description: "Explore the beauty and culture of Daman with our curated travel packages.",
    location: "Dadra and Nagar Haveli, India",
    favorableMonths: [0, 1, 9, 10, 11], // Jan, Feb, Oct, Nov, Dec
  },
  {
    id: 4,
    name: "Mount Abu",
    image: "/assets/packages/MountAbu1.jpg",
    description: "Explore the beauty and culture of Mount Abu with our curated travel packages.",
    location: "Rajasthan, India",
    favorableMonths: [0, 1, 9, 10, 11], // Jan, Feb, Oct, Nov, Dec
  },
  {
    id: 5,
    name: "Somnath",
    image: "/assets/packages/Somnath1.jpg",
    description: "Explore the beauty and culture of Somnath with our curated travel packages.",
    location: "Gujarat, India",
    favorableMonths: [0, 1, 9, 10, 11], // Jan, Feb, Oct, Nov, Dec
  },
  {
    id: 6,
    name: "Vietnam",
    image: "/assets/packages/Vietnam1.jpg",
    description: "Explore the beauty and culture of Vietnam with our curated travel packages.",
    location: "Vietnam",
    favorableMonths: [0, 1, 2, 8, 9], // Jan, Feb, Mar, Sept, Oct
  },
  {
    id: 7,
    name: "Bali",
    image: "/assets/packages/Bali1.jpg",
    description: "Explore the beauty and culture of Bali with our curated travel packages.",
    location: "Indonesia",
    favorableMonths: [3, 4, 5, 6, 7], // Apr, May, June, July, Aug
  },
  {
    id: 8,
    name: "Pushkar",
    image: "/assets/packages/Pushkar1.jpg",
    description: "Explore the beauty and culture of Pushkar with our curated travel packages.",
    location: "Rajasthan, India",
    favorableMonths: [10], // November
  },
  {
    id: 9,
    name: "Thailand",
    image: "/assets/packages/Thailand1.jpg",
    description: "Explore the beauty and culture of Thailand with our curated travel packages.",
    location: "Thailand",
    favorableMonths: [0, 1, 9, 10, 11], // Jan, Feb, Oct, Nov, Dec
  },
  {
    id: 10,
    name: "Udaipur",
    image: "/assets/packages/Rajasthan1.jpg",
    description: "Explore the beauty and culture of Udaipur with our curated travel packages.",
    location: "Rajasthan, India",
    favorableMonths: [0, 1, 9, 10, 11], // Jan, Feb, Oct, Nov, Dec
  },
  {
    id: 11,
    name: "Vrindavan",
    image: "/assets/packages/Vrindavan1.jpg",
    description: "Explore the beauty and culture of Vrindavan with our curated travel packages.",
    location: "Uttar Pradesh, India",
    favorableMonths: [0, 1, 9, 10, 11], // Jan, Feb, Oct, Nov, Dec
  },
  {
    id: 12,
    name: "Darjeeling & Gangtok",
    image: "/assets/packages/Shimla2.jpg",
    description: "Explore the beauty and culture of Darjeeling & Gangtok with our curated travel packages.",
    location: "West Bengal, India",
    favorableMonths: [2, 3, 4, 8, 9], // Mar, Apr, May, Sept, Oct
  },
  {
    id: 13,
    name: "Singapore",
    image: "/assets/packages/Singapore1.jpg",
    description: "Explore the beauty and culture of Singapore with our curated travel packages.",
    location: "Singapore",
    favorableMonths: [0, 1, 9, 10, 11], // Jan, Feb, Oct, Nov, Dec
  },
  {
    id: 14,
    name: "Uttarakhand",
    image: "/assets/packages/Uttarakhand1.jpg",
    description: "Explore the beauty and culture of Uttarakhand with our curated travel packages.",
    location: "Uttarakhand, India",
    favorableMonths: [4, 5, 6, 7], // May, June, July, Aug
  },
  {
    id: 15,
    name: "Hong Kong",
    image: "/assets/packages/HongKong1.jpg",
    description: "Explore the beauty and culture of Hong Kong with our curated travel packages.",
    location: "China",
    favorableMonths: [0, 1, 9, 10, 11], // Jan, Feb, Oct, Nov, Dec
  },
  {
    id: 16,
    name: "Oman",
    image: "/assets/packages/Oman1.jpg",
    description: "Explore the beauty and culture of Oman with our curated travel packages.",
    location: "Oman",
    favorableMonths: [0, 1, 9, 10, 11], // Jan, Feb, Oct, Nov, Dec
  },
  {
    id: 17,
    name: "Varanasi",
    image: "/assets/packages/Kashi1.jpg",
    description: "Explore the beauty and culture of Varanasi with our curated travel packages.",
    location: "Uttar Pradesh, India",
    favorableMonths: [0, 1, 9, 10, 11], // Jan, Feb, Oct, Nov, Dec
  },
  {
    id: 18,
    name: "Ujjain",
    image: "/assets/packages/Ujjain1.jpg",
    description: "Explore the beauty and culture of Ujjain with our curated travel packages.",
    location: "Madhya Pradesh, India",
    favorableMonths: [0, 1, 9, 10, 11], // Jan, Feb, Oct, Nov, Dec
  },
  {
    id: 19,
    name: "Matheran",
    image: "/assets/packages/Matheran1.jpg",
    description: "Explore the beauty and culture of Matheran with our curated travel packages.",
    location: "Maharashtra, India",
    favorableMonths: [0, 1, 4, 5, 9, 10], // Jan, Feb, May, June, Oct, Nov
  },
  {
    id: 20,
    name: "Saputara",
    image: "/assets/packages/Saputara1.jpg",
    description: "Explore the beauty and culture of Saputara with our curated travel packages.",
    location: "Gujarat, India",
    favorableMonths: [0, 1, 9, 10, 11], // Jan, Feb, Oct, Nov, Dec
  },
  {
    id: 21,
    name: "Dwarka",
    image: "/assets/packages/Dwarka1.jpg",
    description: "Explore the beauty and culture of Dwarka with our curated travel packages.",
    location: "Gujarat, India",
    favorableMonths: [0, 1, 9, 10, 11], // Jan, Feb, Oct, Nov, Dec
  },
]

async function seedDestinations() {
  try {
    const mongoDB_URI = process.env.MONGODB_URI

    if (!mongoDB_URI) {
      console.error("MONGODB_URI not found in .env file")
      console.error("Please add MONGODB_URI to your backend/.env file")
      process.exit(1)
    }

    console.log("[v0] Connecting to MongoDB with URI:", mongoDB_URI.substring(0, 50) + "...")

    await mongoose.connect(mongoDB_URI, {
      serverSelectionTimeoutMS: 10000,
      socketTimeoutMS: 45000,
    })
    console.log("[v0] Connected to MongoDB successfully!")

    // Clear existing destinations
    console.log("[v0] Clearing existing destinations...")
    const deleteResult = await Destination.deleteMany({})
    console.log("[v0] Deleted destinations:", deleteResult.deletedCount)

    // Insert new destinations
    console.log("[v0] Inserting destinations...")
    const insertedDestinations = await Destination.insertMany(destinationsData)
    console.log("[v0] Successfully inserted " + insertedDestinations.length + " destinations")

    // Show sample of inserted destinations
    console.log("[v0] Sample destinations inserted:")
    insertedDestinations.slice(0, 5).forEach((dest) => {
      console.log(
        `  - ${dest.name} (ID: ${dest.id}) - Location: ${dest.location} - Best months: ${dest.favorableMonths.join(", ")}`,
      )
    })

    await new Promise((resolve) => setTimeout(resolve, 1000))

    await mongoose.connection.close()
    console.log("[v0] Disconnected from MongoDB")
    console.log("[v0] Seeding completed successfully!")
    process.exit(0)
  } catch (error) {
    console.error("[v0] Error during seeding:", error.message)
    console.error("[v0] Troubleshooting tips:")
    console.error("  1. Verify MONGODB_URI is set correctly in backend/.env")
    console.error("  2. If using MongoDB Atlas, check IP whitelist settings")
    console.error("  3. Ensure your internet connection is stable")
    console.error("  4. If using local MongoDB, ensure it's running: mongod")

    try {
      await mongoose.connection.close()
    } catch (closeError) {
      console.error("[v0] Error closing connection:", closeError.message)
    }

    process.exit(1)
  }
}

seedDestinations()
