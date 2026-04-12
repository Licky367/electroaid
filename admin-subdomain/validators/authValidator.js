exports.validateSignup = (req, res, next) => {
    const { token, ADMIN_NAME, ADMIN_PASSWORD } = req.body;

    if (!token || !ADMIN_NAME || !ADMIN_PASSWORD) {
        return res.status(400).json({ message: "Missing required fields" });
    }

    next();
};

exports.validateLogin = (req, res, next) => {
    const { ADMIN_EMAIL, ADMIN_PASSWORD } = req.body;

    if (!ADMIN_EMAIL || !ADMIN_PASSWORD) {
        return res.status(400).json({ message: "All fields required" });
    }

    next();
};