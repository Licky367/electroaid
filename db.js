const mongoose = require("mongoose");

/* ===================================================== */
/* ================= CONNECTION ======================== */
/* ===================================================== */
async function connectDB() {
    try {
        await mongoose.connect(process.env.MONGO_URI);

        console.log("✅ MongoDB connected successfully");
        console.log("📦 Database:", mongoose.connection.name);

        mongoose.connection.on("error", (err) => {
            console.error("❌ MongoDB error:", err.message);
        });

        mongoose.connection.on("disconnected", () => {
            console.warn("⚠️ MongoDB disconnected");
        });

    } catch (err) {
        console.error("❌ MongoDB connection failed");
        console.error("Reason:", err.message);

        // stop server if DB is critical
        process.exit(1);
    }
}

/* ===================================================== */
/* ================= EXPORT ============================ */
/* ===================================================== */
module.exports = connectDB;