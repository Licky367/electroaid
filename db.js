const mysql = require("mysql2");

/* ===================================================== */
/* ================= CONFIG ============================= */
/* ===================================================== */
const dbConfig = {
    host: process.env.DB_HOST,
    port: Number(process.env.DB_PORT) || 3306,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,

    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0,

    connectTimeout: 10000,
    enableKeepAlive: true,
    keepAliveInitialDelay: 0
};

/* ===================================================== */
/* ================= SSL (OPTIONAL) ==================== */
/* ===================================================== */
/*
If using external cloud DB that requires SSL,
uncomment below:

dbConfig.ssl = {
    rejectUnauthorized: false
};
*/

/* ===================================================== */
/* ================= POOL ============================== */
/* ===================================================== */
const pool = mysql.createPool(dbConfig);
const promisePool = pool.promise();

/* ===================================================== */
/* ================= TEST CONNECTION =================== */
/* ===================================================== */
async function testConnection() {
    try {
        const conn = await promisePool.getConnection();

        console.log("✅ Database connected successfully");
        console.log(`📦 DB Host: ${process.env.DB_HOST}`);
        console.log(`🗄️ Database: ${process.env.DB_NAME}`);

        conn.release();
    } catch (err) {
        console.error("❌ Database connection failed");
        console.error("Reason:", err.message);

        // Critical in production:
        // prevents app from staying in broken loading state
        process.exit(1);
    }
}

/* Run startup test */
testConnection();

/* ===================================================== */
/* ================= EXPORT ============================ */
/* ===================================================== */
module.exports = {
    pool: promisePool
};