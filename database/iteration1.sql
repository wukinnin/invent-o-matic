
-- Iteration 1: Core Authentication & Read-Only MVP
-- SQL Script for initial database setup

-- Table for essential user authentication and role identification
CREATE TABLE `users` (
  `id` INT PRIMARY KEY NOT NULL AUTO_INCREMENT,
  `name` VARCHAR(100) NOT NULL,
  `email` VARCHAR(150) NOT NULL UNIQUE,
  `password_hash` VARCHAR(255) NOT NULL,
  `role` ENUM('Admin', 'Staff') NOT NULL
);

-- Table for the central repository for all supply and material data
CREATE TABLE `inventory_items` (
  `id` INT PRIMARY KEY NOT NULL AUTO_INCREMENT,
  `supplier_id` INT NOT NULL,
  `name` VARCHAR(255) NOT NULL,
  `description` TEXT NULLABLE,
  `quantity` INT NOT NULL DEFAULT 0,
  `category` VARCHAR(100) NULLABLE,
  `min_stock_threshold` INT NOT NULL DEFAULT 0,
  `last_updated` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

