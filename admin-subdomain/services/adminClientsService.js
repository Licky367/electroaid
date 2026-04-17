const {
    Client,
    Assignment
} = require("../models");

/* ================= FETCH CLIENTS ================= */

exports.fetchClients =
async ({
    page = 1,
    search = ""
}) => {

    const limit = 10;

    const skip =
        (page - 1) * limit;

    let filter = {};

    if (search) {
        filter.$or = [
            {
                CLIENT_NAME: {
                    $regex:
                        search,
                    $options:
                        "i"
                }
            },
            {
                CLIENT_EMAIL: {
                    $regex:
                        search,
                    $options:
                        "i"
                }
            },
            {
                CLIENT_PHONE_NUMBER:
                {
                    $regex:
                        search,
                    $options:
                        "i"
                }
            }
        ];
    }

    const clients =
        await Client.find(
            filter
        )
            .select(
                "_id CLIENT_NAME CLIENT_EMAIL CLIENT_PHONE_NUMBER CLIENT_PROFILE_IMAGE createdAt"
            )
            .sort({
                createdAt: -1
            })
            .skip(skip)
            .limit(limit)
            .lean();

    const result =
        await Promise.all(
            clients.map(
                async client => {

                    const assignments =
                        await Assignment.countDocuments(
                            {
                                CLIENT_ID:
                                    client._id
                            }
                        );

                    return {
                        id: client._id,

                        CLIENT_NAME:
                            client.CLIENT_NAME,

                        CLIENT_EMAIL:
                            client.CLIENT_EMAIL,

                        CLIENT_PHONE_NUMBER:
                            client.CLIENT_PHONE_NUMBER,

                        CLIENT_PROFILE_IMAGE:
                            client.CLIENT_PROFILE_IMAGE,

                        createdAt:
                            client.createdAt,

                        assignments
                    };
                }
            )
        );

    return result;
};

/* ================= DELETE CLIENT ================= */

exports.removeClient =
async id => {

    await Client.findByIdAndDelete(
        id
    );
};