# TripEasy - Backend API Server

Welcome to the **TripEasy Backend API Server**, a secure, robust, and scalable Express REST API integrated with MongoDB and MongoDB Atlas, providing endpoints for package details, bookings, payments, and notifications.

---

## 🚀 Features

- **Package & Destination Management**: Dynamic query routes to fetch custom trip packages and travel destinations.
- **Secure Bookings**: Tracks passenger details, custom travel requests, and links them with bookings.
- **Cashfree Payment Gateway Integration**: Real-time order creation, payment status checking, and validation callbacks.
- **Auto-generated Invoice PDFs**: Programmatic generation of receipts/invoices using Puppeteer.
- **Email Notifications**: Automatic emails sent to travelers on successful booking confirmation (via Gmail Nodemailer integration).
- **Security Protections**: Integrated security measures like NoSQL injection prevention, XSS cleaning, compression, rate-limiting, and Helmet headers.

---

## 🛠️ Tech Stack & Libraries

- **Runtime**: [Node.js](https://nodejs.org/) (ES Modules, `type: "module"`)
- **Framework**: [Express.js](https://expressjs.com/) (v5+)
- **Database**: [MongoDB](https://www.mongodb.com/) via [Mongoose](https://mongoosejs.com/)
- **Payments**: Cashfree Payment Gateway SDK / API
- **PDF Generation**: [Puppeteer](https://pptr.dev/)
- **Email Service**: [Nodemailer](https://nodemailer.com/)
- **Security & Helpers**: 
  - `helmet` (Security Headers)
  - `express-rate-limit` (DDoS/Brute force protection)
  - `express-mongo-sanitize` (NoSQL Injection mitigation)
  - `cors` (Cross-Origin Resource Sharing)
  - `compression` (Gzip response compression)
  - `bcryptjs` & `jsonwebtoken` (Auth & encryption utilities)

---

## 📁 Project Structure

```text
server/
├── config/              # Database connection & third-party client configurations
├── middleware/          # Security limiters, request loggers, and sanitizers
├── models/              # Mongoose schemas (Booking, Destination, Package, etc.)
├── routes/              # Express route controllers grouped by resources
├── scripts/             # Data seeding scripts (e.g. destinations, package options)
├── uploads/             # Locally uploaded media/files (ignored in production)
├── utils/               # Shared helper functions (PDF creators, emails, etc.)
├── .env                 # Environment variables
├── package.json         # Server scripts and dependencies
├── server.js            # Main entry point and Express application configuration
└── vercel.json          # Deployment configuration for serverless deployment
```

---

## ⚙️ Setup & Installation

### Prerequisites
Make sure you have [Node.js](https://nodejs.org/) (v18+) and [MongoDB](https://www.mongodb.com/) installed.

### 1. Clone & Navigate to Server Directory
```bash
cd server
```

### 2. Install Dependencies
```bash
npm install
```

### 3. Configure Environment Variables
Create a `.env` file in the root of the `server/` directory and configure the environment variables:

```env
# Server Port
PORT=5000

# MongoDB Connection URI
MONGODB_URI=your_mongodb_connection_string

# Frontend Client URL (for CORS alignment)
FRONTEND_URL=http://localhost:3000

# Nodemailer Email Configuration (For booking notifications)
EMAIL_SERVICE=gmail
EMAIL_USER=your-email@gmail.com
EMAIL_PASSWORD=your-gmail-app-password

# Contact Email Configuration (For inquiries)
CONTACT_EMAIL_USER=your-support-email@gmail.com
CONTACT_EMAIL_PASSWORD=your-gmail-app-password

# Cashfree Payment Gateway Credentials
CASHFREE_APP_ID=your_cashfree_app_id
CASHFREE_SECRET_KEY=your_cashfree_secret_key
```

### 4. Seed the Database
Populate your database with sample destinations and travel packages:
```bash
npm run seed
```

---

## 🏃 Running the Application

### Development Mode (with Nodemon)
Run the server with automatic restart on file changes:
```bash
npm run dev
```

### Production Mode
Run the server in production mode:
```bash
npm start
```
The server will run on [http://localhost:5000](http://localhost:5000) (or the port defined in `.env`).

---

## 🛣️ API Routes & Endpoints

| Resource | Route | Method | Description |
|---|---|---|---|
| **Health Check** | `/` | GET | Check system uptime and health |
| **Packages** | `/api/packages` | GET / POST | Manage travel packages |
| **Destinations** | `/api/destinations` | GET / POST | Manage locations & destinations |
| **Bookings** | `/api/submit-booking-request` | POST | Request a new travel package booking |
| **Custom Requests**| `/api/submit-custom-package` | POST | Submit custom requirements |
| **Payments** | `/api/pay-now` | POST | Create Cashfree payment order |
| **Callbacks** | `/api/payment-status-callback`| POST | Handle webhooks for payment processing |
| **Media Uploads** | `/api/upload` | POST | Handle local file uploads (via Multer) |

---

## 🌐 Deployment (Vercel)

This server is designed to work in a serverless environment and is pre-configured with [vercel.json](file:///c:/Users/ajha2/Desktop/tripeasy/server/vercel.json) to route all requests via `server.js` functions.

To deploy:
1. Run `vercel` in the `server/` directory.
2. Add all environment variables from `.env` inside the Vercel project dashboard.
