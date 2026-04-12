-- =========================================
-- PAY AFTER RULES
-- =========================================

CREATE DATABASE IF NOT EXISTS electroaid;
USE electroaid;

CREATE TABLE IF NOT EXISTS pay_after_rules (
id INT AUTO_INCREMENT PRIMARY KEY,
assignmentCountThreshold INT,
createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);