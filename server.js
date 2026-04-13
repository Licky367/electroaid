/* ================= ENV ================= */
if (process.env.NODE_ENV !== "production") {
    require("dotenv").config({ path: "./config.env" });
}

const express = require("express");
const path = require("path");
const session = require("express-session");
const MySQLStore = require("express-mysql-session")(session);
const http = require("http");
const { Server } = require("socket.io");

const db = require("./db");

/* ================= INIT ================= */
const app = express();
const server = http.createServer(app);

const isProduction = process.env.NODE_ENV === "production";
const PORT = process.env.PORT || 10000;

/* ================= PATHS ================= */
const uploadsDir =
    process.env.UPLOADS_DIR || path.join(__dirname, "uploads");

/* ================= TRUST PROXY ================= */
if (isProduction) {
    app.set("trust proxy", 1);
}

/* ================= SOCKET ================= */
const io = new Server(server, {
    cors: {
        origin: [
            process.env.CLIENT_URL,
            process.env.ADMIN_URL,
            process.env.EXPERT_URL
        ].filter(Boolean),
        credentials: true
    }
});

app.set("io", io);

/* ================= MIDDLEWARE ================= */
app.use(express.urlencoded({ extended: true }));
app.use(express.json({ limit: "10mb" }));

/* ================= VIEW ENGINE ================= */
app.set("view engine", "ejs");
app.set("views", [
    path.join(__dirname, "client-subdomain/views"),
    path.join(__dirname, "admin-subdomain/views"),
    path.join(__dirname, "expert-subdomain/views")
]);

/* ================= SESSION ================= */
const sessionStore = new MySQLStore(
    {
        expiration: 1000 * 60 * 60 * 24,
        createDatabaseTable: true
    },
    db.pool
);

const sessionMiddleware = session({
    key: "electroaid_sid",
    secret: process.env.SESSION_SECRET || "fallback_secret_change_me",
    store: sessionStore,
    resave: false,
    saveUninitialized: false,
    proxy: isProduction,
    cookie: {
        maxAge: 1000 * 60 * 60 * 24,
        httpOnly: true,
        secure: isProduction,
        sameSite: isProduction ? "none" : "lax",
        domain: isProduction
            ? (process.env.COOKIE_DOMAIN || ".onrender.com")
            : undefined
    }
});

app.use(sessionMiddleware);

io.use((socket, next) => {
    sessionMiddleware(socket.request, {}, next);
});

/* ================= STATIC ================= */
app.use("/uploads", express.static(uploadsDir));
app.use("/sounds", express.static(path.join(__dirname, "public/sounds")));
app.use("/header", express.static(path.join(__dirname, "expert-subdomain/header")));

/* ================= GLOBALS ================= */
app.use((req, res, next) => {
    res.locals.SUPPORT_EMAIL = process.env.SUPPORT_EMAIL || "";
    res.locals.SUPPORT_PHONE = process.env.SUPPORT_PHONE || "";
    res.locals.SUPPORT_WHATSAPP = process.env.SUPPORT_WHATSAPP || "";
    next();
});

/* ===================================================== */
/* ================= CLIENT APP ========================= */
/* ===================================================== */
const clientApp = express.Router();

clientApp.use("/", require("./client-subdomain/routes/home"));
clientApp.use("/guidelines", require("./client-subdomain/routes/guidelines"));
clientApp.use("/profile", require("./client-subdomain/routes/profile"));
clientApp.use("/auth", require("./client-subdomain/routes/auth"));

clientApp.use("/assignments", require("./client-subdomain/routes/assignments"));
clientApp.use("/assignments/insert", require("./client-subdomain/routes/insert"));
clientApp.use("/assignments/create", require("./client-subdomain/routes/create-assignment"));
clientApp.use("/assignments/pending", require("./client-subdomain/routes/pending"));
clientApp.use("/assignments/accepted", require("./client-subdomain/routes/accepted"));
clientApp.use("/assignments/work", require("./client-subdomain/routes/work"));
clientApp.use("/assignments/completed", require("./client-subdomain/routes/completed"));
clientApp.use("/assignments/declined", require("./client-subdomain/routes/declined"));
clientApp.use("/assignments", require("./client-subdomain/routes/pay"));

clientApp.use("/", require("./client-subdomain/routes/paypal-success"));
clientApp.use("/", require("./client-subdomain/routes/intasend-webhook"));

clientApp.use("/notifications", require("./client-subdomain/routes/notifications"));
clientApp.use("/chats", require("./client-subdomain/routes/clientChats"));
clientApp.use("/api", require("./client-subdomain/routes/clientChats"));

/* ===================================================== */
/* ================= ADMIN APP ========================== */
/* ===================================================== */
const adminApp = express.Router();
const adminBase = "/admin";

adminApp.use(`${adminBase}/auth`, require("./admin-subdomain/routes/auth"));
adminApp.use(`${adminBase}/create`, require("./admin-subdomain/routes/create"));

adminApp.use(adminBase, require("./admin-subdomain/routes/admin-profile"));
adminApp.use(adminBase, require("./admin-subdomain/routes/admin-management"));
adminApp.use(adminBase, require("./admin-subdomain/routes/admin-experts"));
adminApp.use(adminBase, require("./admin-subdomain/routes/admin-expert-approval"));
adminApp.use(adminBase, require("./admin-subdomain/routes/admin-clients"));
adminApp.use(adminBase, require("./admin-subdomain/routes/admin-payment-methods"));
adminApp.use(adminBase, require("./admin-subdomain/routes/admin-payout-management"));
adminApp.use(adminBase, require("./admin-subdomain/routes/admin-stats"));

adminApp.use(`${adminBase}/invoice`, require("./admin-subdomain/routes/admin-invoice"));
adminApp.use(`${adminBase}/invoice-history`, require("./admin-subdomain/routes/admin-invoice-history"));

adminApp.use(adminBase, require("./admin-subdomain/routes/admin-assignments"));
adminApp.use(adminBase, require("./admin-subdomain/routes/admin-pending"));
adminApp.use(adminBase, require("./admin-subdomain/routes/admin-pending-approval"));
adminApp.use(adminBase, require("./admin-subdomain/routes/admin-waiting"));
adminApp.use(adminBase, require("./admin-subdomain/routes/admin-work"));
adminApp.use(adminBase, require("./admin-subdomain/routes/admin-completed"));
adminApp.use(adminBase, require("./admin-subdomain/routes/admin-declined"));
adminApp.use(adminBase, require("./admin-subdomain/routes/admin-chats"));
adminApp.use(adminBase, require("./admin-subdomain/routes/admin"));

/* ===================================================== */
/* ================= EXPERT APP ========================= */
/* ===================================================== */
const expertApp = express.Router();
const expertBase = "/expert";

expertApp.use(expertBase, require("./expert-subdomain/routes/expert-login"));
expertApp.use(expertBase, require("./expert-subdomain/routes/expert-signup"));
expertApp.use(expertBase, require("./expert-subdomain/routes/expert-password"));
expertApp.use(expertBase, require("./expert-subdomain/routes/expert-logout"));
expertApp.use(expertBase, require("./expert-subdomain/routes/expert"));
expertApp.use(expertBase, require("./expert-subdomain/routes/expert-profile"));

expertApp.use(`${expertBase}/assignments`, require("./expert-subdomain/routes/expert-work"));
expertApp.use(`${expertBase}/assignments/pending`, require("./expert-subdomain/routes/expert-pending"));
expertApp.use(`${expertBase}/assignments`, require("./expert-subdomain/routes/waiting"));
expertApp.use(`${expertBase}/assignments`, require("./expert-subdomain/routes/expert-completed"));
expertApp.use(`${expertBase}/invoice`, require("./expert-subdomain/routes/expert-invoice"));

/* ===================================================== */
/* ================= SUBDOMAIN ROUTER ================== */
/* ===================================================== */
app.use((req, res, next) => {
    const host = (req.hostname || "").toLowerCase();

    if (host.startsWith("admin.")) {
        return adminApp(req, res, next);
    }

    if (host.startsWith("expert.")) {
        return expertApp(req, res, next);
    }

    return clientApp(req, res, next);
});

/* ===================================================== */
/* ================= SOCKETS ============================ */
/* ===================================================== */
require("./admin-subdomain/sockets/adminChatSocket")(io);
require("./client-subdomain/sockets/clientChatSocket")(io);

/* ===================================================== */
/* ================= ERRORS ============================= */
/* ===================================================== */
app.use((req, res) => {
    res.status(404).send("Page not found");
});

app.use((err, req, res, next) => {
    console.error("🔥 Server Error:", err.stack);
    res.status(500).send(isProduction ? "Something went wrong" : err.stack);
});

/* ===================================================== */
/* ================= START ============================== */
/* ===================================================== */
server.listen(PORT, "0.0.0.0", () => {
    console.log(`🚀 ElectroAid running on port ${PORT}`);
    console.log(`📁 Uploads directory: ${uploadsDir}`);
    console.log(`🌍 Mode: ${process.env.NODE_ENV}`);
});