const {
    fetchExpertInvites,
    createExpertInvite
} = require("../services/adminExpertApprovalService");

/* ================= PAGE LOAD ================= */
exports.getExpertApprovalPage = async (req, res) => {
    try {
        const adminId = req.session?.adminId;
        if (!adminId) return res.redirect("/admin-login");

        const experts = await fetchExpertInvites();

        res.render("admin-expert-approval", { experts });

    } catch (err) {
        console.error(err);
        res.status(500).send("Server Error");
    }
};

/* ================= GENERATE INVITE ================= */
exports.generateExpertInvite = async (req, res) => {
    try {
        const adminId = req.session?.adminId;
        const role = req.session?.role;
        const { EXPERT_EMAIL } = req.body;

        const result = await createExpertInvite({
            adminId,
            role,
            email: EXPERT_EMAIL
        });

        if (result.error) {
            return res.status(result.status).json({ message: result.error });
        }

        res.json({ REG_NO: result.REG_NO });

    } catch (err) {
        console.error(err);
        res.status(500).json({ message: "Server error" });
    }
};