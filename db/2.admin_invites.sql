-- =========================================
-- ADMIN INVITES (UPGRADED)
-- =========================================

CREATE DATABASE IF NOT EXISTS electroaid;
USE electroaid;

CREATE TABLE IF NOT EXISTS admin_invites (
    id INT AUTO_INCREMENT PRIMARY KEY,

    ADMIN_EMAIL VARCHAR(255) NOT NULL,

    role ENUM(
        'FINANCIAL_ADMIN',
        'OPERATIONS_ADMIN',
        'OPERATIONAL_ADMIN'
    ) NOT NULL,

    /* 🔐 TOKEN SYSTEM */
    token VARCHAR(255) UNIQUE NOT NULL,
    expiresAt DATETIME NOT NULL,

    /* 🔐 STATUS (UPGRADED) */
    status ENUM('pending','used','expired','revoked') DEFAULT 'pending',

    /* 🔐 TRACKING */
    usedAt DATETIME NULL,
    usedBy INT NULL,

    /* 🔐 AUDIT */
    createdBy INT NULL,
    createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

    /* INDEXES */
    INDEX idx_email (ADMIN_EMAIL),
    INDEX idx_token (token),
    INDEX idx_status (status),
    INDEX idx_expires (expiresAt),

    /* FOREIGN KEYS */
    CONSTRAINT fk_invite_created_by
        FOREIGN KEY (createdBy)
        REFERENCES admins(id)
        ON DELETE SET NULL,

    CONSTRAINT fk_invite_used_by
        FOREIGN KEY (usedBy)
        REFERENCES admins(id)
        ON DELETE SET NULL
);