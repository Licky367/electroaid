module.exports = (req, res, next) => {
    if (!req.session.clientId) {
        return res.redirect("/auth/login");
    }
    next();
};