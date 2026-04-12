module.exports = function requireClient(req, res, next) {
    if (!req.session || !req.session.CLIENT_ID) {
        return res.redirect("/auth/login");
    }
    next();
};