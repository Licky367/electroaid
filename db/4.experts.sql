CREATE DATABASE IF NOT EXISTS electroaid;
USE electroaid;

CREATE TABLE IF NOT EXISTS experts (
    id INT AUTO_INCREMENT PRIMARY KEY,

    REG_NO VARCHAR(100) UNIQUE NOT NULL,
    EXPERT_NAME VARCHAR(255) NOT NULL,
    EXPERT_EMAIL VARCHAR(255) UNIQUE NOT NULL,
    EXPERT_PHONE VARCHAR(50) UNIQUE NOT NULL,

    EXPERT_PROFILE_IMAGE TEXT,
    EXPERT_PASSWORD VARCHAR(255),

    status ENUM('active','inactive','suspended') DEFAULT 'active',

    createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    /* ================= INDEXES ================= */
    INDEX idx_reg (REG_NO),
    INDEX idx_email (EXPERT_EMAIL),
    INDEX idx_phone (EXPERT_PHONE),
    INDEX idx_status (status),

    /* 🔥 CRITICAL FOR PAYROLL JOINS */
    INDEX idx_id_reg (id, REG_NO)
);