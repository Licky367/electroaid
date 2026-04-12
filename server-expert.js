require("dotenv").config({ path: "./config.env" });

const express = require("express");
const path = require("path");
const session = require("express-session");
const MySQLStore = require("express-mysql-session")(session);

const db = require("./db");

const app = express();

/* ================= ENV ================= */
const isProduction = process.env.NODE_ENV === "production";

/* ===================================================== */
/* ================= MIDDLEWARE ========================= */
/* ===================================================== */

app.use(express.urlencoded({ extended: true }));
app.use(express.json({ limit: "10mb" }));

/* ===================================================== */
/* ================= TRUST PROXY ======================== */
/* ===================================================== */

if (isProduction) {
    app.set("trust proxy", 1);
}

/* ===================================================== */
/* ================= SESSION STORE ====================== */
/* ===================================================== */

const sessionStore = new MySQLStore({
    expiration: 1000 * 60 * 60 * 24,
    createDatabaseTable: true
}, db.pool);

/* ===================================================== */
/* ================= SESSION ============================ */
/* ===================================================== */

app.use(session({
    key: "expert_sid",
    secret: process.env.SESSION_SECRET,
    store: sessionStore,
    resave: false,
    saveUninitialized: false,
    cookie: {
        maxAge: 1000 * 60 * 60 * 24,
        httpOnly: true,
        secure: isProduction,
        sameSite: isProduction ? "none" : "lax"
    }
}));

/* ===================================================== */
/* ================= STATIC ============================= */
/* ===================================================== */

/* Use ENV uploads directory */
app.use("/uploads", express.static(
    path.join(__dirname, process.env.UPLOADS_DIR)
));

/* Header assets */
app.use("/header", express.static(
    path.join(__dirname, "expert-subdomain/header")
));

/* ===================================================== */
/* ================= VIEW ENGINE ======================== */
/* ===================================================== */

app.set("views", path.join(__dirname, "expert-subdomain/views"));
app.set("view engine", "ejs");

/* ===================================================== */
/* ================= BASE =============================== */
/* ===================================================== */

const expertBase = "/expert";

/* ===================================================== */
/* ================= AUTH ROUTES ======================== */
/* ===================================================== */

app.use(`${expertBase}`, require("./expert-subdomain/routes/expert-login"));
app.use(`${expertBase}`, require("./expert-subdomain/routes/expert-signup"));
app.use(`${expertBase}`, require("./expert-subdomain/routes/expert-password"));
app.use(`${expertBase}`, require("./expert-subdomain/routes/expert-logout"));

/* ===================================================== */
/* ================= HOME =============================== */
/* ===================================================== */

app.use(
    `${expertBase}`,
    require("./expert-subdomain/routes/expert")
);

/* ===================================================== */
/* ================= PROFILE ============================ */
/* ===================================================== */

app.use(
    `${expertBase}`,
    require("./expert-subdomain/routes/expert-profile")
);

/* ===================================================== */
/* ================= ASSIGNMENTS ======================== */
/* ===================================================== */

app.use(
    `${expertBase}/assignments`,
    require("./expert-subdomain/routes/expert-work")
);

app.use(
    `${expertBase}/assignments/pending`,
    require("./expert-subdomain/routes/expert-pending")
);

app.use(
    `${expertBase}/assignments`,
    require("./expert-subdomain/routes/waiting")
);

app.use(
    `${expertBase}/assignments`,
    require("./expert-subdomain/routes/expert-completed")
);

/* ===================================================== */
/* ================= INVOICES =========================== */
/* ===================================================== */

app.use(
    `${expertBase}/invoice`,
    require("./expert-subdomain/routes/expert-invoice")
);

/* ===================================================== */
/* ================= 404 ================================ */
/* ===================================================== */

app.use((req, res) => {
    res.status(404).send("Page not found");
});

/* ===================================================== */
/* ================= ERROR ============================== */
/* ===================================================== */

app.use((err, req, res, next) => {
    console.error(err.stack);

    res.status(500).send(
        isProduction ? "Something went wrong" : err.stack
    );
});

/* ===================================================== */
/* ================= START ============================== */
/* ===================================================== */

const PORT = process.env.EXPERT_PORT || 5002;

app.listen(PORT, () => {
    console.log(`✅ Expert server running on port ${PORT}`);
});