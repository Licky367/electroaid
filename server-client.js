require("dotenv").config({ path: "./config.env" });

const express = require("express");
const path = require("path");
const session = require("express-session");
const MySQLStore = require("express-mysql-session")(session);

/* ================= CORE ================= */
const http = require("http");
const { Server } = require("socket.io");

const db = require("./db");

/* ================= MIDDLEWARE ================= */
const { attachClient } = require("./client-subdomain/middleware/clientAuth");

/* ================= SOCKET ================= */
const clientChatSocket = require("./client-subdomain/sockets/clientChatSocket");

/* ================= INIT ================= */
const app = express();
const server = http.createServer(app);

/* ================= ENV ================= */
const isProduction = process.env.NODE_ENV === "production";

/* ================= SOCKET.IO ================= */
const io = new Server(server, {
    cors: {
        origin: process.env.CLIENT_URL,
        credentials: true
    }
});

/* ================= BASIC MIDDLEWARE ================= */
app.use(express.urlencoded({ extended: true }));
app.use(express.json({ limit: "10mb" }));

/* ================= TRUST PROXY ================= */
if (isProduction) {
    app.set("trust proxy", 1);
}

/* ================= SESSION STORE ================= */
const sessionStore = new MySQLStore({
    expiration: 1000 * 60 * 60 * 24, // 1 day
    createDatabaseTable: true
}, db.pool);

/* ================= SESSION ================= */
const sessionMiddleware = session({
    key: "electroaid_sid",
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

/* ================= SHARE SESSION WITH SOCKET ================= */
io.use((socket, next) => {
    sessionMiddleware(socket.request, {}, next);
});

/* ================= GLOBAL CLIENT ATTACH ================= */
app.use(attachClient);

/* ================= ✅ GLOBAL CONFIG (NEW) ================= */
app.use((req, res, next) => {
    res.locals.SUPPORT_EMAIL = process.env.SUPPORT_EMAIL || "";
    res.locals.SUPPORT_PHONE = process.env.SUPPORT_PHONE || "";
    res.locals.SUPPORT_WHATSAPP = process.env.SUPPORT_WHATSAPP || "";
    next();
});

/* ================= STATIC FILES ================= */
app.use("/uploads", express.static(
    path.join(__dirname, process.env.UPLOADS_DIR)
));

/* ================= VIEW ENGINE ================= */
app.set("views", path.join(__dirname, "client-subdomain/views"));
app.set("view engine", "ejs");

/* ================= ROUTES ================= */

/* ===== HOME ===== */
app.use("/", require("./client-subdomain/routes/home"));

/* ===== GUIDELINES ===== */
app.use("/guidelines", require("./client-subdomain/routes/guidelines"));

/* ===== PROFILE ===== */
app.use("/profile", require("./client-subdomain/routes/profile"));

/* ===== AUTH ===== */
app.use("/auth", require("./client-subdomain/routes/auth"));

/* ===== ASSIGNMENTS ===== */
app.use("/assignments", require("./client-subdomain/routes/assignments"));
app.use("/assignments/insert", require("./client-subdomain/routes/insert"));
app.use("/assignments/create", require("./client-subdomain/routes/create-assignment"));

app.use("/assignments/pending", require("./client-subdomain/routes/pending"));
app.use("/assignments/accepted", require("./client-subdomain/routes/accepted"));
app.use("/assignments/work", require("./client-subdomain/routes/work"));
app.use("/assignments/completed", require("./client-subdomain/routes/completed"));
app.use("/assignments/declined", require("./client-subdomain/routes/declined"));

/* ================= PAYMENTS ================= */

/* ===== PAY PAGE + PROCESS ===== */
app.use("/assignments", require("./client-subdomain/routes/pay"));

/* ===== PAYPAL SUCCESS ===== */
app.use("/", require("./client-subdomain/routes/paypal-success"));

/* ===== INTASEND WEBHOOK ===== */
app.use("/", require("./client-subdomain/routes/intasend-webhook"));

/* ================= NOTIFICATIONS ================= */
app.use("/notifications", require("./client-subdomain/routes/notifications"));

/* ================= CHATS ================= */
app.use("/chats", require("./client-subdomain/routes/clientChats"));

/* ===== API (messages fetch etc.) ===== */
app.use("/api", require("./client-subdomain/routes/clientChats"));

/* ================= SOCKET INIT ================= */
clientChatSocket(io);

/* ================= 404 ================= */
app.use((req, res) => {
    res.status(404).send("Page not found");
});

/* ================= ERROR HANDLER ================= */
app.use((err, req, res, next) => {
    console.error(err.stack);

    res.status(500).send(
        isProduction ? "Something went wrong" : err.stack
    );
});

/* ================= START SERVER ================= */
const PORT = process.env.CLIENT_PORT || 5000;

server.listen(PORT, () => {
    console.log(`✅ Client server running on port ${PORT}`);
});