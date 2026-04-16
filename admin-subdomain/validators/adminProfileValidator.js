exports.validateProfileUpdate = (req, res, next) => {

    let { ADMIN_NAME, ADMIN_EMAIL } = req.body;

    if (!ADMIN_NAME || !ADMIN_EMAIL) {
        return res.status(400).send("Name and email required");
    }

    next();
};