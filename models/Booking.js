// import mongoose from "mongoose"

// const bookingSchema = new mongoose.Schema({
//   order_id: {
//     type: String,
//     required: true,
//     unique: true,
//     index: true,
//   },
//   customer_name: String,
//   customer_email: {
//     type: String,
//     index: true,
//   },
//   customer_phone: String,
//   customer_gender: String,
//   customer_age: Number,
//   travel_date: Date,
//   num_travelers: Number,
//   package_id: Number,
//   package_name: String,
//   package_location: String,
//   package_price: Number,
//   total_price: Number,
//   payment_status: String,
//   transaction_id: String,
//   booking_date: {
//     type: Date,
//     default: Date.now,
//   },
//   status: {
//     type: String,
//     default: "confirmed",
//   },
//   additionalTravelers: [
//     {
//       name: String,
//       gender: String,
//       age: Number,
//     },
//   ],
//   createdAt: {
//     type: Date,
//     default: Date.now,
//   },
//   updatedAt: {
//     type: Date,
//     default: Date.now,
//   },
// })

// export default mongoose.model("Booking", bookingSchema)














import mongoose from "mongoose"

const bookingSchema = new mongoose.Schema({
  order_id: {
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
  // FIX: Change from Number to Mixed or String
  package_id: {
    type: mongoose.Schema.Types.Mixed, // Accepts both String and Number
    required: true,
  },
  package_name: String,
  package_location: String,
  package_duration: Number, // Make sure this is included
  package_price: Number,
  total_price: Number,
  payment_status: String,
  transaction_id: String,
  booking_date: {
    type: Date,
    default: Date.now,
  },
  status: {
    type: String,
    default: "confirmed",
  },
  additionalTravelers: [
    {
      name: String,
      gender: String,
      age: Number,
    },
  ],
  createdAt: {
    type: Date,
    default: Date.now,
  },
  updatedAt: {
    type: Date,
    default: Date.now,
  },
})

export default mongoose.model("Booking", bookingSchema)