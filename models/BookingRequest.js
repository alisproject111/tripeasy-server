import mongoose from "mongoose"

const bookingRequestSchema = new mongoose.Schema({
  request_id: {
    type: String,
    required: true,
    unique: true,
    index: true,
  },
  customer_name: String,
  customer_email: {
    type: String,
    index: true,
  },
  customer_phone: String,
  customer_gender: String,
  customer_age: Number,
  travel_date: Date,
  num_travelers: Number,
  package_name: String,
  package_location: String,
  package_duration: Number,
  package_price: Number,
  total_price: Number,
  special_requests: String,
  status: {
    type: String,
    default: "pending",
    index: true,
  },
  request_date: {
    type: Date,
    default: Date.now,
    index: true,
  },
  last_updated: {
    type: Date,
    default: Date.now,
  },
})

export default mongoose.model("BookingRequest", bookingRequestSchema)
