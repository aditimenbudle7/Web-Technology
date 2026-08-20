CREATE DATABASE IF NOT EXISTS electricity_billing;

USE electricity_billing;


-- ==========================================
-- USERS TABLE
-- ==========================================

CREATE TABLE IF NOT EXISTS users (

    id INT AUTO_INCREMENT PRIMARY KEY,

    name VARCHAR(100) NOT NULL,

    email VARCHAR(150) NOT NULL UNIQUE,

    password VARCHAR(255) NOT NULL,

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP

);


-- ==========================================
-- BILLS TABLE
-- ==========================================

CREATE TABLE IF NOT EXISTS bills (

    id INT AUTO_INCREMENT PRIMARY KEY,

    user_id INT NOT NULL,

    month DATE NOT NULL,

    units DECIMAL(10,2) NOT NULL,

    amount DECIMAL(10,2) NOT NULL,

    payment_status ENUM('Unpaid', 'Paid')
        DEFAULT 'Unpaid',

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    FOREIGN KEY (user_id)
        REFERENCES users(id)
        ON DELETE CASCADE

);