-- =========================================
-- ASSIGNMENT DAILY COUNTS
-- =========================================

CREATE DATABASE IF NOT EXISTS electroaid;
USE electroaid;

CREATE TABLE IF NOT EXISTS assignment_daily_counts (
id INT AUTO_INCREMENT PRIMARY KEY,
date DATE UNIQUE,
academicCount INT DEFAULT 0,
articleCount INT DEFAULT 0,
codingCount INT DEFAULT 0,
totalCount INT DEFAULT 0
);