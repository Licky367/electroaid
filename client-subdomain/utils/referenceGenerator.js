exports.generateReference = async (connection, type) => {

    const now = new Date();
    const datePart = now.toISOString().slice(0,10).replace(/-/g,"");

    let prefix = "EA";
    if (type === "academic") prefix = "EA-ACW";
    if (type === "article") prefix = "EA-ART";
    if (type === "coding") prefix = "EA-COD";

    const [rows] = await connection.query(
        `SELECT * FROM assignment_daily_counts WHERE date = CURDATE() FOR UPDATE`
    );

    let counts;

    if (!rows.length) {
        await connection.query(`
            INSERT INTO assignment_daily_counts
            (date,academicCount,articleCount,codingCount,totalCount)
            VALUES (CURDATE(),0,0,0,0)
        `);
        counts = { academicCount:0, articleCount:0, codingCount:0, totalCount:0 };
    } else {
        counts = rows[0];
    }

    let seq = 1;
    if (type === "academic") seq = counts.academicCount + 1;
    if (type === "article") seq = counts.articleCount + 1;
    if (type === "coding") seq = counts.codingCount + 1;

    seq = String(seq).padStart(3,"0");

    return {
        reference: `${prefix}-${datePart}-${seq}`,
        counts
    };
};