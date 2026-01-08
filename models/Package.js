import mongoose from "mongoose"

const packageSchema = new mongoose.Schema({
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
  price: {
    type: Number,
    required: true,
  },
  duration: {
    type: Number,
    required: true,
  },
  image: String,
  detailImage: String,
  location: String,
  highlights: [String],
  description: String,
  pdfUrl: String,
  itinerary: [
    {
      day: Number,
      title: String,
      description: String,
      activities: [String],
    },
  ],
  food: [String],
  category: {
    type: String,
    index: true,
  },
  featured: {
    type: Boolean,
    default: false,
  },
  rating: {
    type: Number,
    default: 0,
  },
  reviews: {
    type: Number,
    default: 0,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
  updatedAt: {
    type: Date,
    default: Date.now,
  },
})

export default mongoose.model("Package", packageSchema)
