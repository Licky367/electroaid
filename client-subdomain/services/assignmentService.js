const { generateReference } = require("../utils/referenceGenerator");
const { convertDeadline } = require("../utils/deadlineConverter");

const { Assignment, AssignmentFile, DailyCount } = require("../../models");

exports.createAssignment = async (data) => {

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

    const { reference, counts } = await generateReference(type);

    const { utcDate, eatDate } = convertDeadline(deadline);

    /* ============================= */
    /* INSERT ASSIGNMENT */
    /* ============================= */
    await Assignment.create({
        CLIENT_ID: clientId,
        CLIENT_NAME: clientName,
        reference,
        subject,
        title,
        instructions,
        deadline,
        _dueDate: utcDate,
        dueDate: eatDate,
        timezone,
        budget,
        status: "pending"
    });

    /* ============================= */
    /* FILES */
    /* ============================= */
    if (files && files.length) {
        const fileDocs = files.map(file => ({
            reference,
            fileUrl: `/uploads/assignments/${file.filename}`,
            fileName: file.originalname
        }));

        await AssignmentFile.insertMany(fileDocs);
    }

    /* ============================= */
    /* COUNTS */
/* ============================= */
    let { academicCount, articleCount, codingCount, totalCount } = counts;

    if (type === "academic") academicCount++;
    if (type === "article") articleCount++;
    if (type === "coding") codingCount++;

    totalCount++;

    await DailyCount.updateOne(
        { date: new Date().toISOString().split("T")[0] },
        {
            academicCount,
            articleCount,
            codingCount,
            totalCount
        },
        { upsert: true }
    );

    return { reference, title };
};