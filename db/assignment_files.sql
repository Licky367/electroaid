-- =========================================
-- ASSIGNMENT FILES
-- =========================================

CREATE DATABASE IF NOT EXISTS electroaid;
USE electroaid;

CREATE TABLE IF NOT EXISTS assignment_files (
id INT AUTO_INCREMENT PRIMARY KEY,
reference VARCHAR(100) NOT NULL,
fileUrl TEXT,
fileName VARCHAR(255),
createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

INDEX idx_ref (reference),

CONSTRAINT fk_files_assignment
FOREIGN KEY (reference)
REFERENCES assignments(reference)
ON DELETE CASCADE

);