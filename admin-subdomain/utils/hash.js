const bcrypt = require("bcrypt");

const hashPassword = async (password) => {
    return await bcrypt.hash(password, 10);
};

const comparePassword = async (plain, hash) => {
    return await bcrypt.compare(plain, hash);
};

module.exports = { hashPassword, comparePassword };