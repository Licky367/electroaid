-- =========================================
-- SUPER ADMIN SEED
-- =========================================

CREATE DATABASE IF NOT EXISTS electroaid;
USE electroaid;

INSERT INTO admins (
ADMIN_NAME,
ADMIN_EMAIL,
ADMIN_PHONE,
ADMIN_PROFILE_IMAGE,
ADMIN_PASSWORD,
role,
status
)
VALUES (
'Licky Wekesa',
'wleakey367@gmail.com',
'0115430166',
NULL,
'$2b$10$wH0sW8Qy9Ck0K8z0YlYwOe6v7nF9p9Yp1G5Z5lqY7lF8z8bJr0m6G',
'SUPER_ADMIN',
'active'
)
ON DUPLICATE KEY UPDATE ADMIN_EMAIL = ADMIN_EMAIL;