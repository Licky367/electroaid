CREATE TABLE IF NOT EXISTS payments (
id INT AUTO_INCREMENT PRIMARY KEY,

reference VARCHAR(100) NOT NULL,
CLIENT_ID INT NOT NULL,

method ENUM('mpesa','paypal','card') NOT NULL,
accountIdentifier VARCHAR(255),

amount_USD DECIMAL(10,2) NOT NULL,
amount_KES DECIMAL(10,2) NOT NULL,
exchangeRate DECIMAL(10,4) NOT NULL,

type ENUM('deposit','full','arrears','after') NOT NULL,

status ENUM('INITIATED','PENDING','SUCCESS','FAILED','CANCELLED')
DEFAULT 'INITIATED',

externalRef VARCHAR(255) UNIQUE,
transactionCode VARCHAR(100),

createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP
ON UPDATE CURRENT_TIMESTAMP,

INDEX idx_reference (reference),
INDEX idx_client (CLIENT_ID),
INDEX idx_status (status),
INDEX idx_createdAt (createdAt),
INDEX idx_reference_type (reference, type),
INDEX idx_externalRef (externalRef),

CONSTRAINT fk_payment_assignment
FOREIGN KEY (reference)
REFERENCES assignments(reference)
ON DELETE CASCADE
);