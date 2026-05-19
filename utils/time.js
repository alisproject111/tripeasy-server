// Function to get current time in IST
export function getCurrentTimeInIST() {
  const now = new Date()
  const utc = now.getTime() + now.getTimezoneOffset() * 60000
  const ist = new Date(utc + 3600000 * 5.5) // IST is UTC+5:30
  return ist.toISOString().slice(0, 19).replace("T", " ") // Format as YYYY-MM-DD HH:MM:SS
}
