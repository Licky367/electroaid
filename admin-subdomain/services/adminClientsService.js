/* ================= FETCH CLIENTS ================= */
exports.fetchClients = async ({ page, search }) => {

  const limit = 10;
  const offset = (page - 1) * limit;

  let query = `
    SELECT 
      c.id,
      c.CLIENT_NAME,
      c.CLIENT_EMAIL,
      c.CLIENT_PHONE_NUMBER,
      c.CLIENT_PROFILE_IMAGE,
      c.createdAt,
      COUNT(a.id) AS assignments
    FROM clients c
    LEFT JOIN assignments a 
      ON a.CLIENT_ID = c.id
  `;

  let params = [];

  if (search) {
    query += `
      WHERE 
        c.CLIENT_NAME LIKE ? OR
        c.CLIENT_EMAIL LIKE ? OR
        c.CLIENT_PHONE_NUMBER LIKE ?
    `;
    params.push(`%${search}%`, `%${search}%`, `%${search}%`);
  }

  query += `
    GROUP BY c.id
    ORDER BY c.createdAt DESC
    LIMIT ? OFFSET ?
  `;

  params.push(limit, offset);

  const [clients] = await db.query(query, params);

  return clients;
};

/* ================= DELETE CLIENT ================= */
exports.removeClient = async (id) => {
  await db.query("DELETE FROM clients WHERE id = ?", [id]);
};