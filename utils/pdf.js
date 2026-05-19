import puppeteer from "puppeteer"
import path from "path"
import fs from "fs"

// FIXED: Improved PDF generation function - Enabled for localhost, disabled for Vercel
export async function generatePDF(html, outputPath) {
  if (process.env.VERCEL === "1") {
    console.log("PDF generation disabled for Vercel deployment")
    throw new Error("PDF generation not available on Vercel. Use localhost for PDF features.")
  }

  let browser
  try {
    console.log("Launching Puppeteer for PDF generation...")
    browser = await puppeteer.launch({
      headless: true,
      args: ["--no-sandbox", "--disable-setuid-sandbox"]
    })
    
    const page = await browser.newPage()
    
    // Set page content
    await page.setContent(html, { waitUntil: "networkidle0" })
    
    // Ensure parent directory exists
    const dir = path.dirname(outputPath)
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true })
    }
    
    // Generate PDF
    await page.pdf({
      path: outputPath,
      format: "A4",
      printBackground: true,
      margin: {
        top: "20px",
        right: "20px",
        bottom: "20px",
        left: "20px"
      }
    })
    
    console.log("PDF generated successfully at:", outputPath)
  } catch (error) {
    console.error("Error inside generatePDF helper:", error)
    throw error
  } finally {
    if (browser) {
      await browser.close()
    }
  }
}
