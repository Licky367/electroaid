const {
  fetchClients,
  removeClient
} = require("../services/adminClientsService");

/* ================= GET CLIENTS ================= */
exports.getClientsPage = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const search = req.query.search ? req.query.search.trim() : "";

    const clients = await fetchClients({ page, search });

    res.render("admin-clients", {
      clients,
      page,
      search,
      admin: req.session.admin
    });

  } catch (err) {
    console.error(err);
    res.status(500).send("Server error");
  }
};

/* ================= DELETE CLIENT ================= */
exports.deleteClient = async (req, res) => {
  try {
    const id = req.params.id;

    await removeClient(id);

    res.redirect("/admin/clients");

  } catch (err) {
    console.error(err);
    res.status(500).send("Delete failed");
  }
};