// utils/exchangeRate.js

const axios = require("axios");

let cachedRate = null;
let lastFetched = null;

const CACHE_DURATION = 1000 * 60 * 10; // 10 minutes

async function getUSDtoKES() {
  try {
    // Use fallback if disabled
    if (process.env.USE_LIVE_EXCHANGE !== "true") {
      return Number(process.env.FALLBACK_USD_TO_KES);
    }

    const now = Date.now();

    // ✅ Return cached value if still valid
    if (cachedRate && lastFetched && (now - lastFetched < CACHE_DURATION)) {
      return cachedRate;
    }

    // ✅ Fetch new rate
    const res = await axios.get(process.env.EXCHANGE_RATE_API);

    const rate = res.data?.rates?.KES;

    if (!rate) throw new Error("Invalid exchange rate");

    // Cache it
    cachedRate = rate;
    lastFetched = now;

    console.log("✅ Live exchange rate fetched:", rate);

    return rate;

  } catch (err) {
    console.error("⚠️ Using fallback exchange rate");

    return Number(process.env.FALLBACK_USD_TO_KES);
  }
}

module.exports = { getUSDtoKES };