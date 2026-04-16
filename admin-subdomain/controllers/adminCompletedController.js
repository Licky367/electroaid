const service = require("../services/adminCompletedService");

/* ================= VIEWS ================= */

exports.renderListPage = (req, res) => {
    res.render("admin-completed");
};

exports.renderViewPage = (req, res) => {
    res.render("admin-completed-view");
};

/* ================= API ================= */

exports.getCompletedList = async (req, res) => {
    try{

        const rows = await service.fetchCompletedList();
        res.json(rows);

    }catch(err){
        console.error(err);
        res.status(500).json({ message: "Server error" });
    }
};

exports.getCompletedSingle = async (req, res) => {
    try{

        const { reference } = req.params;

        const rows = await service.fetchCompletedSingle(reference);

        if(rows.length === 0){
            return res.status(404).json({ message: "Not found" });
        }

        res.json(rows);

    }catch(err){
        console.error(err);
        res.status(500).json({ message: "Server error" });
    }
};