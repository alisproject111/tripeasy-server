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
    console.log("Attempting to connect to local MongoDB...")

    // Try local MongoDB as fallback
    try {
      const localURI = "mongodb://localhost:27017/tripeasy"
      const connection = await mongoose.connect(localURI, {
        serverSelectionTimeoutMS: 5000,
        socketTimeoutMS: 45000,
      })
      console.log("Connected to local MongoDB successfully")
      return connection
    } catch (localError) {
      console.error("Local MongoDB connection also failed:", localError.message)
      console.log("Please ensure MongoDB is running locally or check your MongoDB Atlas IP whitelist settings")
      process.exit(1)
    }
  }
}

export { mongoose }
