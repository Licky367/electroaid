require("dotenv").config({ path: "./config.env" });

const express = require("express");
const path = require("path");
const session = require("express-session");
const MySQLStore = require("express-mysql-session")(session);
const http = require("http");
const { Server } = require("socket.io");

const db = require("./db");

const app = express();
const server = http.createServer(app);

/* ================= ENV ================= */
const isProduction = process.env.NODE_ENV === "production";

/* ===================================================== */
/* ================= SOCKET.IO ========================== */
/* ===================================================== */

const io = new Server(server, {
    cors: {
        origin: process.env.ADMIN_URL,
        credentials: true
    }
});

/* Make io accessible in routes */
app.set("io", io);

/* ===================================================== */
/* ================= SOCKET MODULE ====================== */
/* ===================================================== */

require("./admin-subdomain/sockets/adminChatSocket")(io);

/* ===================================================== */
/* ================= BASIC SOCKET ======================= */
/* ===================================================== */

io.on("connection", (socket) => {

    console.log("Admin Socket Connected:", socket.id);

    socket.on("joinAdmin", () => {
        socket.join("admin_room");
    });

    socket.on("joinClientRoom", (room) => {
        socket.join(room);
    });

    socket.on("disconnect", () => {
        console.log("Socket disconnected:", socket.id);
    });
});

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

const sessionMiddleware = session({
    key: "admin_sid",
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
});

app.use(sessionMiddleware);

/* 🔥 SHARE SESSION WITH SOCKET */
io.use((socket, next) => {
    sessionMiddleware(socket.request, {}, next);
});

/* ===================================================== */
/* ================= STATIC FILES ======================= */
/* ===================================================== */

/* Use ENV uploads directory */
app.use("/uploads", express.static(
    path.join(__dirname, process.env.UPLOADS_DIR)
));

/* Optional: public assets */
app.use("/sounds", express.static(path.join(__dirname, "public/sounds")));

/* ===================================================== */
/* ================= VIEW ENGINE ======================== */
/* ===================================================== */

app.set("views", path.join(__dirname, "admin-subdomain/views"));
app.set("view engine", "ejs");

/* ===================================================== */
/* ================= BASE ROUTE ========================= */
/* ===================================================== */

const adminBase = "/admin";

/* ===================================================== */
/* ================= ROUTES ============================= */
/* ===================================================== */

/* ===== AUTH (FIRST) ===== */
app.use(`${adminBase}/auth`, require("./admin-subdomain/routes/auth"));

/* ===== PROFILE ===== */
app.use(adminBase, require("./admin-subdomain/routes/admin-profile"));

/* ===== CREATE ADMIN ===== */
app.use(`${adminBase}/create`, require("./admin-subdomain/routes/create"));

/* ===== ADMIN MANAGEMENT ===== */
app.use(adminBase, require("./admin-subdomain/routes/admin-management"));

/* ===== EXPERTS ===== */
app.use(adminBase, require("./admin-subdomain/routes/admin-experts"));

/* ===== EXPERT APPROVAL ===== */
app.use(adminBase, require("./admin-subdomain/routes/admin-expert-approval"));

/* ===== CLIENTS ===== */
app.use(adminBase, require("./admin-subdomain/routes/admin-clients"));

/* ===== PAYMENT METHODS ===== */
app.use(adminBase, require("./admin-subdomain/routes/admin-payment-methods"));

/* ===== PAYOUT MANAGEMENT ===== */
app.use(adminBase, require("./admin-subdomain/routes/admin-payout-management"));

/* ===== ADMIN STATS ===== */
app.use(adminBase, require("./admin-subdomain/routes/admin-stats"));

/* ===================================================== */
/* ================= FINANCE ============================ */
/* ===================================================== */

app.use(`${adminBase}/invoice`, require("./admin-subdomain/routes/admin-invoice"));
app.use(`${adminBase}/invoice-history`, require("./admin-subdomain/routes/admin-invoice-history"));

/* ===================================================== */
/* ================= ASSIGNMENTS ======================== */
/* ===================================================== */

app.use(adminBase, require("./admin-subdomain/routes/admin-assignments"));
app.use(adminBase, require("./admin-subdomain/routes/admin-pending"));
app.use(adminBase, require("./admin-subdomain/routes/admin-pending-approval"));
app.use(adminBase, require("./admin-subdomain/routes/admin-waiting"));
app.use(adminBase, require("./admin-subdomain/routes/admin-work"));
app.use(adminBase, require("./admin-subdomain/routes/admin-completed"));
app.use(adminBase, require("./admin-subdomain/routes/admin-declined"));

/* ===================================================== */
/* ================= ADMIN CHAT ========================= */
/* ===================================================== */

app.use(adminBase, require("./admin-subdomain/routes/admin-chats"));

/* ===================================================== */
/* ================= HOME (LAST) ======================== */
/* ===================================================== */

app.use(adminBase, require("./admin-subdomain/routes/admin"));

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

const PORT = process.env.ADMIN_PORT || 5001;

server.listen(PORT, () => {
    console.log(`✅ Admin server running on port ${PORT}`);
});