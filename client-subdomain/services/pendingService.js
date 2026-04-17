const { Assignment, AssignmentFile } = require("../../models");

module.exports = {

    getPendingAssignments: async (CLIENT_ID) => {
        return await Assignment.find({
            CLIENT_ID,
            status: "pending"
        })
        .select("reference title")
        .sort({ createdAt: -1 });
    },

    getAssignmentDetails: async (CLIENT_ID, reference) => {
        const assignment = await Assignment.findOne({
            reference,
            CLIENT_ID
        }).select("reference title budget deadline instructions");

        if (!assignment) return null;

        const files = await AssignmentFile.find({
            reference
        }).select("fileName fileUrl");

        return {
            ...assignment.toObject(),
            files
        };
    },

    updateAssignment: async (CLIENT_ID, payload) => {
        const {
            reference,
            budget,
            deadline,
            instructions,
            fileName,
            fileUrl
        } = payload;

        await Assignment.updateOne(
            {
                reference,
                CLIENT_ID
            },
            {
                budget: budget || null,
                deadline: deadline || null,
                instructions: instructions || null
            }
        );

        if (fileName && fileUrl) {
            await AssignmentFile.create({
                reference,
                fileName,
                fileUrl
            });
        }
    }

};