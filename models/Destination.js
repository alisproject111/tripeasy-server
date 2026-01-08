import mongoose from "mongoose"

const destinationSchema = new mongoose.Schema({
  id: {
    type: Number,
    required: true,
    unique: true,
  },
  name: {
    type: String,
    required: true,
    index: true,
  },
  image: String,
  description: String,
  location: String,
  favorableMonths: [Number], // Array of month numbers (0-11) when it's best to visit
  createdAt: {
    type: Date,
    default: Date.now,
  },
  updatedAt: {
    type: Date,
    default: Date.now,
  },
})

export default mongoose.model("Destination", destinationSchema)
