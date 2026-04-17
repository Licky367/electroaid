const { Client } = require("../models");

/* ================= REQUIRE LOGIN (VIEWS) ================= */
function requireClient(req, res, next) {
    if (!req.session || !req.session.client) {
        return res.redirect("/auth/login");
    }
    next();
}

/* ================= API AUTH (JSON RESPONSE) ================= */
function requireClientAPI(req, res, next) {
    if (!req.session || !req.session.client) {
        return res.status(401).json({ error: "Unauthorized" });
    }
    next();
}

/* ================= ATTACH CLIENT (GLOBAL) ================= */
const attachClient = async (req, res, next) => {
    try {
        /* ✅ 1. FAST PATH (already in session) */
        if (req.session.client) {
            res.locals.client = req.session.client;
            return next();
        }

        /* ⚠️ 2. FALLBACK (older sessions using clientId) */
        if (req.session.clientId) {
            const user = await Client.findById(req.session.clientId)
                .select("_id CLIENT_NAME CLIENT_PROFILE_IMAGE");

            if (user) {
                const clientData = {
                    id: user._id, // ✅ Mongo uses _id
                    name: user.CLIENT_NAME,
                    image: user.CLIENT_PROFILE_IMAGE
                };

                /* 🔥 Save to session (avoid future DB hits) */
                req.session.client = clientData;

                res.locals.client = clientData;
            } else {
                res.locals.client = null;
            }
        } else {
            res.locals.client = null;
        }

        next();

    } catch (err) {
        console.error("attachClient error:", err);
        res.locals.client = null;
        next();
    }
};

module.exports = {
    requireClient,
    requireClientAPI,
    attachClient
};