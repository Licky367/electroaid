const { generateReference } = require("../utils/referenceGenerator");
const { convertDeadline } = require("../utils/deadlineConverter");

exports.createAssignment = async (connection, data) => {

    const {
        clientId,
        clientName,
        clientEmail,
        body,
        files
    } = data;

    const {
        type,
        subject,
        title,
        instructions,
        deadline,
        timezone,
        budget
    } = body;

    if (!type || !title || !deadline || !budget || !timezone) {
        throw new Error("Missing required fields");
    }

    const { reference, counts } =
        await generateReference(connection, type);

    const { utcDate, eatDate } =
        convertDeadline(deadline);

    /* INSERT */
    await connection.query(`
        INSERT INTO assignments (
            CLIENT_ID, CLIENT_NAME, reference,
            subject, title, instructions,
            deadline, _dueDate, dueDate,
            timezone, budget, status
        ) VALUES (?,?,?,?,?,?,?,?,?,?,?,?)`,
        [
            clientId,
            clientName,
            reference,
            subject,
            title,
            instructions,
            deadline,
            utcDate,
            eatDate,
            timezone,
            budget,
            "pending"
        ]
    );

    /* FILES */
    if (files && files.length) {
        for (let file of files) {
            await connection.query(`
                INSERT INTO assignment_files (reference, fileUrl, fileName)
                VALUES (?,?,?)`,
                [
                    reference,
                    `/uploads/assignments/${file.filename}`,
                    file.originalname
                ]
            );
        }
    }

    /* COUNTS */
    let { academicCount, articleCount, codingCount, totalCount } = counts;

    if (type === "academic") academicCount++;
    if (type === "article") articleCount++;
    if (type === "coding") codingCount++;

    totalCount++;

    await connection.query(`
        UPDATE assignment_daily_counts
        SET academicCount=?, articleCount=?, codingCount=?, totalCount=?
        WHERE date=CURDATE()`,
        [academicCount, articleCount, codingCount, totalCount]
    );

    return { reference, title };
};