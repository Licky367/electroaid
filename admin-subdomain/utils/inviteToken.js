const crypto = require("crypto");

/**
 * Generate secure invite token
 * @returns {string}
 */
function generateInviteToken() {
    return crypto.randomBytes(32).toString("hex");
}

module.exports = {
    generateInviteToken
};