const db = require("../../db");

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
        // ✅ 1. If already stored in session (FAST PATH)
        if (req.session.client) {
            res.locals.client = req.session.client;
            return next();
        }

        // ⚠️ 2. Fallback (older sessions using clientId)
        if (req.session.clientId) {
            const [rows] = await db.pool.query(
                "SELECT id, CLIENT_NAME, CLIENT_PROFILE_IMAGE FROM clients WHERE id = ?",
                [req.session.clientId]
            );

            if (rows.length > 0) {
                const clientData = {
                    id: rows[0].id,
                    name: rows[0].CLIENT_NAME,
                    image: rows[0].CLIENT_PROFILE_IMAGE
                };

                // 🔥 Save to session (prevents future DB hits)
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