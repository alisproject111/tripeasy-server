import mongoose from "mongoose"

export const connectDB = async () => {
  try {
    const mongoDB_URI = process.env.MONGODB_URI || "mongodb://localhost:27017/tripeasy"

    const connection = await mongoose.connect(mongoDB_URI, {
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000,
    })

    console.log("MongoDB connection successful")
    return connection
  } catch (error) {
    console.error("MongoDB connection error:", error.message)
    console.log("Please check your MongoDB Atlas IP whitelist settings")
    process.exit(1)
  }
}

export { mongoose }
