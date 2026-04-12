-- =========================================
-- CHAT MESSAGES
-- =========================================

CREATE DATABASE IF NOT EXISTS electroaid;
USE electroaid;

CREATE TABLE IF NOT EXISTS chat_messages (
id INT AUTO_INCREMENT PRIMARY KEY,

CLIENT_ID INT NOT NULL,
ADMIN_ID INT NULL,

senderRole ENUM('client','admin') NOT NULL,

message TEXT NOT NULL,

isRead BOOLEAN DEFAULT FALSE,

createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

INDEX idx_client (CLIENT_ID),
INDEX idx_admin (ADMIN_ID),
INDEX idx_sender (senderRole),
INDEX idx_read (isRead),
INDEX idx_created (createdAt),

FOREIGN KEY (CLIENT_ID) REFERENCES clients(id) ON DELETE CASCADE,
FOREIGN KEY (ADMIN_ID) REFERENCES admins(id) ON DELETE SET NULL

);