CREATE DATABASE IF NOT EXISTS electroaid;
USE electroaid;

CREATE TABLE IF NOT EXISTS expert_registrations (

id INT AUTO_INCREMENT PRIMARY KEY,

/* ============================= */
/* CORE DATA */
/* ============================= */

REG_NO VARCHAR(100) UNIQUE NOT NULL,
EXPERT_EMAIL VARCHAR(255) NOT NULL,

/* ============================= */
/* ADMIN RELATION */
/* ============================= */

createdByAdminId INT NOT NULL,

/* ============================= */
/* STATUS */
/* ============================= */

used BOOLEAN DEFAULT FALSE,

/* ============================= */
/* TIME CONTROL */
/* ============================= */

createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
expiresAt DATETIME NOT NULL,

/* ============================= */
/* INDEXES */
/* ============================= */

INDEX idx_reg_no (REG_NO),
INDEX idx_email (EXPERT_EMAIL),
INDEX idx_admin (createdByAdminId),
INDEX idx_expiry (expiresAt),
INDEX idx_used (used),

/* ============================= */
/* FOREIGN KEY */
/* ============================= */

CONSTRAINT fk_reg_admin
FOREIGN KEY (createdByAdminId)
REFERENCES admins(id)
ON DELETE CASCADE

);