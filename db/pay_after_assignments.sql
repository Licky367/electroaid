-- =========================================
-- PAY AFTER ASSIGNMENTS
-- =========================================

CREATE DATABASE IF NOT EXISTS electroaid;
USE electroaid;

CREATE TABLE IF NOT EXISTS pay_after_assignments (
id INT AUTO_INCREMENT PRIMARY KEY,
reference VARCHAR(100) UNIQUE,
createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

FOREIGN KEY (reference)
REFERENCES assignments(reference)
ON DELETE CASCADE
);