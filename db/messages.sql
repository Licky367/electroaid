/* ================= DATABASE ================= */

CREATE DATABASE IF NOT EXISTS electroaid;
USE electroaid;


/* ================= CLIENTS TABLE ================= */
/* (Assumed already exists with id, CLIENT_NAME, CLIENT_EMAIL) */


/* ================= MESSAGES TABLE ================= */

CREATE TABLE IF NOT EXISTS messages (
    id INT AUTO_INCREMENT PRIMARY KEY,

    /* ================= RELATION ================= */
    clientId INT NOT NULL,

    /* FUTURE SAFE (OPTIONAL BUT IMPORTANT) */
    conversationId INT DEFAULT NULL,

    /* ================= MESSAGE ================= */
    message TEXT,

    senderRole ENUM('client', 'admin') NOT NULL,

    /* WHO SENT (ADMIN ID SUPPORT) */
    senderId INT DEFAULT NULL,

    /* ================= MESSAGE TYPE ================= */
    messageType ENUM('text', 'file', 'image') DEFAULT 'text',

    /* ================= FILE SUPPORT ================= */
    fileUrl VARCHAR(255) NULL,
    fileName VARCHAR(255) NULL,

    /* ================= STATUS ================= */
    isRead TINYINT(1) DEFAULT 0,
    deliveredAt DATETIME NULL,
    seenAt DATETIME NULL,

    /* ================= TIMESTAMP ================= */
    createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,

    /* ================= INDEXES ================= */
    INDEX idx_clientId (clientId),
    INDEX idx_conversationId (conversationId),
    INDEX idx_senderRole (senderRole),
    INDEX idx_isRead (isRead),
    INDEX idx_createdAt (createdAt)

);


/* ================= FOREIGN KEY ================= */

ALTER TABLE messages
ADD CONSTRAINT fk_messages_client
FOREIGN KEY (clientId)
REFERENCES clients(id)
ON DELETE CASCADE;