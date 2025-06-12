import { writeFile, mkdir } from "fs/promises"

const API_URL = "https://cpw-tracker.p.rapidapi.com/"
const API_KEY = process.env.RAPIDAPI_KEY

if (!API_KEY) {
  console.error("Error: RAPIDAPI_KEY environment variable is required")
  process.exit(1)
}

/**
 * Get start and end dates for the last week
 * @returns {Object} Object with startTime and endTime ISO strings
 */
function getWeekDates() {
  const now = new Date()
  const endTime = now // Current time
  const startTime = new Date(now)
  startTime.setDate(startTime.getDate() - 7) // 7 days ago
  return {
    startTime: startTime.toISOString(),
    endTime: endTime.toISOString()
  }
}

/**
 * Fetch alerts from the API for the next week
 * @returns {Promise<Array>} Array of alert objects
 */
async function fetchAlerts() {
  const { startTime, endTime } = getWeekDates()
  
  console.log(`Fetching alerts for period: ${startTime} to ${endTime}`)

  const response = await fetch(API_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-rapidapi-host": "cpw-tracker.p.rapidapi.com",
      "x-rapidapi-key": API_KEY,
    },
    body: JSON.stringify({
      entities: "financial custodians",
      topic: "cyberattack",
      industry: "finance",
      startTime,
      endTime
    }),
  })

  if (!response.ok) {
    throw new Error(`API request failed: ${response.status}`)
  }

  const data = await response.json()
  const alerts = Array.isArray(data) ? data : []
  
  console.log(`Found ${alerts.length} alerts`)
  return alerts
}

/**
 * Save alerts to JSON file, sorted by timestamp (newest first)
 * @param {Array} alerts - Array of alert objects
 */
async function saveAlerts(alerts) {
  const sorted = alerts.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))

  await mkdir("data", { recursive: true })
  await writeFile("data/alerts.json", JSON.stringify(sorted, null, 2))

  console.log(`Saved ${sorted.length} alerts`)
}

/**
 * Main update process - fetches and saves alerts
 */
async function updateAlerts() {
  try {
    const alerts = await fetchAlerts()
    await saveAlerts(alerts)
    console.log("Update completed")
  } catch (error) {
    console.error("Update failed:", error.message)
    process.exit(1)
  }
}

updateAlerts()