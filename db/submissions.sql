-- =========================================
-- SUBMISSIONS (FINAL STRUCTURE)
-- =========================================

CREATE DATABASE IF NOT EXISTS electroaid;
USE electroaid;

CREATE TABLE IF NOT EXISTS submissions (
id INT AUTO_INCREMENT PRIMARY KEY,

reference VARCHAR(100) NOT NULL,

/* ============================= */
/* FILE DATA */
/* ============================= */

fileUrl TEXT,
fileName VARCHAR(255),

/* ============================= */
/* TEXT CONTENT */
/* ============================= */

submissionText TEXT,

/* ============================= */
/* TYPE CONTROL (FIXED) */
/* ============================= */

type ENUM(
    'submission',        -- expert work (files + description)
    'comment',           -- chat messages (expert + client)
    'revision_request',  -- client asking for changes
    'feedback'           -- rating / final comment
) NOT NULL DEFAULT 'submission',

/* ============================= */
/* ACTOR CONTROL */
/* ============================= */

isClient BOOLEAN DEFAULT FALSE,
/*
FALSE → expert action
TRUE  → client action
*/

/* ============================= */
/* OPTIONAL METADATA */
/* ============================= */

rating INT NULL,

createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

/* ============================= */
/* INDEXES */
/* ============================= */

INDEX idx_ref (reference),
INDEX idx_type (type),
INDEX idx_ref_type (reference, type),
INDEX idx_createdAt (createdAt),

/* ============================= */
/* RELATION */
/* ============================= */

CONSTRAINT fk_submissions_assignment
FOREIGN KEY (reference)
REFERENCES assignments(reference)
ON DELETE CASCADE

);