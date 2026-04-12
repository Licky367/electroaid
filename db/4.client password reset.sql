CREATE DATABASE IF NOT EXISTS electroaid;
USE electroaid;

CREATE TABLE IF NOT EXISTS client_password_resets (
id INT AUTO_INCREMENT PRIMARY KEY,

clientId INT NOT NULL,
token VARCHAR(255) UNIQUE NOT NULL,
expiresAt DATETIME NOT NULL,

createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

INDEX idx_token (token),
INDEX idx_client (clientId),
INDEX idx_expires (expiresAt),

CONSTRAINT fk_client_password_reset
FOREIGN KEY (clientId)
REFERENCES clients(id)
ON DELETE CASCADE

);