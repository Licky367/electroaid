-- =========================================
-- PAYMENT SETTINGS
-- =========================================

CREATE DATABASE IF NOT EXISTS electroaid;
USE electroaid;

CREATE TABLE IF NOT EXISTS payment_settings (
id INT PRIMARY KEY,
depositPercentage INT DEFAULT 30,
payAfterGlobal BOOLEAN DEFAULT FALSE,
createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

INSERT INTO payment_settings (id, depositPercentage, payAfterGlobal)
VALUES (1, 30, FALSE)
ON DUPLICATE KEY UPDATE depositPercentage = depositPercentage;