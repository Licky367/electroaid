-- =========================================
-- ADMINS (UPGRADED)
-- =========================================

CREATE DATABASE IF NOT EXISTS electroaid;
USE electroaid;

CREATE TABLE IF NOT EXISTS admins (
    id INT AUTO_INCREMENT PRIMARY KEY,

    ADMIN_NAME VARCHAR(255) NOT NULL,
    ADMIN_EMAIL VARCHAR(255) UNIQUE NOT NULL,
    ADMIN_PHONE VARCHAR(50) UNIQUE,
    ADMIN_PROFILE_IMAGE TEXT,

    ADMIN_PASSWORD VARCHAR(255) NOT NULL,

    role ENUM(
        'SUPER_ADMIN',
        'FINANCIAL_ADMIN',
        'OPERATIONS_ADMIN',
        'OPERATIONAL_ADMIN'
    ) NOT NULL,

    -- 🔐 CONTROLLED STATUS
    status ENUM('active','inactive','suspended') DEFAULT 'active',

    -- 🔐 PASSWORD RESET
    reset_token VARCHAR(255) NULL,
    reset_expires DATETIME NULL,

    -- 🔐 SECURITY TRACKING
    last_login_at DATETIME NULL,
    last_login_ip VARCHAR(100) NULL,

    -- 🔐 AUDIT
    createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

    -- INDEXES
    INDEX idx_email (ADMIN_EMAIL),
    INDEX idx_role (role),
    INDEX idx_status (status),
    INDEX idx_reset_token (reset_token),
    INDEX idx_reset_expires (reset_expires)
);