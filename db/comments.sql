CREATE DATABASE IF NOT EXISTS electroaid;
USE electroaid;

CREATE TABLE IF NOT EXISTS comments (
    id INT AUTO_INCREMENT PRIMARY KEY,

    reference VARCHAR(100) NOT NULL,
    message TEXT NOT NULL,

    isClient BOOLEAN DEFAULT TRUE,

    createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    INDEX idx_reference (reference),
    INDEX idx_createdAt (createdAt),

    CONSTRAINT fk_comments_assignment
    FOREIGN KEY (reference)
    REFERENCES assignments(reference)
    ON DELETE CASCADE
);