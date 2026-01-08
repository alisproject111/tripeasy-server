// import mongoose from "mongoose"

// const customPackageRequestSchema = new mongoose.Schema({
//   full_name: {
//     type: String,
//     required: true,
//   },
//   email: {
//     type: String,
//     required: true,
//     index: true,
//   },
//   phone: {
//     type: String,
//     required: true,
//   },
//   departure_location: {
//     type: String,
//     required: true,
//   },
//   destination: {
//     type: String,
//     required: true,
//   },
//   start_date: Date,
//   duration: String,
//   budget: String,
//   travelers: Number,
//   activities: String,
//   accommodation: String,
//   transportation: String,
//   special_requests: String,
//   estimated_price: Number,
//   status: {
//     type: String,
//     default: "pending",
//     index: true,
//   },
//   request_date: {
//     type: Date,
//     default: Date.now,
//     index: true,
//   },
//   last_updated: {
//     type: Date,
//     default: Date.now,
//   },
// })

// export default mongoose.model("CustomPackageRequest", customPackageRequestSchema)












import mongoose from "mongoose"

const customPackageRequestSchema = new mongoose.Schema({
  full_name: {
    type: String,
    required: true,
  },
  email: {
    type: String,
    required: true,
    index: true,
  },
  phone: {
    type: String,
    required: true,
  },
  departure_location: {
    type: String,
    required: true,
  },
  destination: {
    type: String,
    required: true,
  },
  start_date: Date,
  duration: String,
  budget: String,
  travelers: Number,
  // FIXED: Changed from String to [String]
  activities: [String], // Now accepts array of strings
  accommodation: String,
  transportation: String,
  special_requests: String,
  estimated_price: Number,
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

export default mongoose.model("CustomPackageRequest", customPackageRequestSchema)