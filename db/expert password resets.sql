CREATE DATABASE IF NOT EXISTS electroaid;
USE electroaid;

CREATE TABLE IF NOT EXISTS expert_password_resets (
id INT AUTO_INCREMENT PRIMARY KEY,

expertId INT NOT NULL,
token VARCHAR(255) UNIQUE NOT NULL,
expiresAt DATETIME NOT NULL,

createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

INDEX idx_token (token),
INDEX idx_expert (expertId),
INDEX idx_expires (expiresAt),

CONSTRAINT fk_password_reset_expert
FOREIGN KEY (expertId)
REFERENCES experts(id)
ON DELETE CASCADE

);