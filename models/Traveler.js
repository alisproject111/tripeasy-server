import mongoose from "mongoose"

const travelerSchema = new mongoose.Schema({
  booking_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Booking",
    required: true,
    index: true,
  },
  name: String,
  gender: String,
  age: Number,
  lead_traveler_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Traveler",
    index: true,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
})

export default mongoose.model("Traveler", travelerSchema)
