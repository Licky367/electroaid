CREATE TABLE IF NOT EXISTS expert_weekly_payments (
    id INT AUTO_INCREMENT PRIMARY KEY,

    EXPERT_ID INT NOT NULL,
    REG_NO VARCHAR(100) NOT NULL,

    weekStart DATETIME NOT NULL,
    weekEnd DATETIME NOT NULL,

    amountUSD DECIMAL(10,2) NOT NULL DEFAULT 0.00,
    amountKES DECIMAL(10,2) NOT NULL,

    status ENUM('PENDING','PROCESSING','PAID','FAILED') 
        NOT NULL DEFAULT 'PENDING',

    paymentReference VARCHAR(255) NULL,
    transactionCode VARCHAR(100) NULL,

    /* ================= RETRY SYSTEM ================= */
    retryCount INT NOT NULL DEFAULT 0,
    nextRetryAt DATETIME NULL,

    /* ================= TIMESTAMPS ================= */
    paidAt DATETIME NULL,
    createdAt TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

    /* ================= CONSTRAINTS ================= */
    UNIQUE KEY unique_expert_week (EXPERT_ID, weekStart, weekEnd),

    /* ================= INDEXES ================= */
    INDEX idx_expert (EXPERT_ID),
    INDEX idx_week_range (weekStart, weekEnd),
    INDEX idx_status (status),
    INDEX idx_reg (REG_NO),

    /* 🔥 CRITICAL FOR RETRY WORKER */
    INDEX idx_retry (status, nextRetryAt),

    /* ================= FK ================= */
    CONSTRAINT fk_weekly_expert
        FOREIGN KEY (EXPERT_ID)
        REFERENCES experts(id)
        ON DELETE CASCADE
);