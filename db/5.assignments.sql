CREATE DATABASE IF NOT EXISTS electroaid;
USE electroaid;

CREATE TABLE IF NOT EXISTS assignments (
    id INT AUTO_INCREMENT PRIMARY KEY,

    CLIENT_ID INT NOT NULL,
    EXPERT_ID INT NULL,
    REG_NO VARCHAR(100),

    reference VARCHAR(100) UNIQUE NOT NULL,
    subject VARCHAR(255),
    title VARCHAR(255),

    status ENUM(
        'pending',
        'accepted',
        'In Progress',
        'Revision Requested',
        'completed',
        'declined'
    ) DEFAULT 'pending',

    deadline DATETIME,
    dueDate DATETIME,
    _dueDate DATETIME,
    timezone VARCHAR(100),

    budget DECIMAL(10,2) DEFAULT 0,
    payout DECIMAL(10,2) DEFAULT 0,
    profit DECIMAL(10,2) DEFAULT 0,

    depositAmount DECIMAL(10,2) DEFAULT 0,

    /* ================= CLIENT PAYMENT TRACKING ================= */
    depositPaid DECIMAL(10,2) DEFAULT 0,
    totalPaid DECIMAL(10,2) DEFAULT 0,

    rating INT,
    feedback TEXT,

    completedAt DATETIME,

    CLIENT_NAME VARCHAR(255),
    EXPERT_NAME VARCHAR(255),

    instructions TEXT,
    acceptedAt DATETIME,

    approvalLocked BOOLEAN DEFAULT FALSE,

    declinedByAdminId INT NULL,
    declineReason TEXT NULL,
    declinedAt DATETIME NULL,

    createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    /* ================= INDEXES ================= */
    INDEX idx_client (CLIENT_ID),
    INDEX idx_expert (EXPERT_ID),
    INDEX idx_reg (REG_NO),
    INDEX idx_status (status),
    INDEX idx_completed (completedAt),
    INDEX idx_declined (declinedAt),
    INDEX idx_declined_admin (declinedByAdminId),

    /* 🔥 PERFORMANCE BOOST FOR PAYROLL QUERIES */
    INDEX idx_expert_completed (EXPERT_ID, completedAt),

    /* ================= FOREIGN KEYS ================= */
    CONSTRAINT fk_assignments_expert
        FOREIGN KEY (EXPERT_ID)
        REFERENCES experts(id)
        ON DELETE SET NULL,

    CONSTRAINT fk_assignments_client
        FOREIGN KEY (CLIENT_ID)
        REFERENCES clients(id)
        ON DELETE CASCADE,

    CONSTRAINT fk_assignments_declined_admin
        FOREIGN KEY (declinedByAdminId)
        REFERENCES admins(id)
        ON DELETE SET NULL
);