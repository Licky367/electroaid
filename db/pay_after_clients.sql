-- =========================================
-- PAY AFTER CLIENTS
-- =========================================

CREATE DATABASE IF NOT EXISTS electroaid;
USE electroaid;

CREATE TABLE IF NOT EXISTS pay_after_clients (
id INT AUTO_INCREMENT PRIMARY KEY,
clientEmail VARCHAR(255) UNIQUE,
createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);