-- =========================================
-- PAYOUT GROUP RULES
-- =========================================

CREATE DATABASE IF NOT EXISTS electroaid;
USE electroaid;

CREATE TABLE IF NOT EXISTS payout_group_rules (
id INT AUTO_INCREMENT PRIMARY KEY,
groupRange VARCHAR(50) UNIQUE,
percentage INT,
createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);