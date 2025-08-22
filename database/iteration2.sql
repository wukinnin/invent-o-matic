-- Iteration 2: Full CRUD & Transaction Management
-- SQL Script for second iteration database setup

-- Table for supplementary, non-critical user details
CREATE TABLE `user_profiles` (
  `user_id` INT PRIMARY KEY NOT NULL,
  `work_location` VARCHAR(255) NULL,
  `phone_number` VARCHAR(20) NULL,
  FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE
);

-- Table for a static list of all possible granular permissions
CREATE TABLE `permissions` (
  `id` INT PRIMARY KEY NOT NULL AUTO_INCREMENT,
  `name` VARCHAR(100) NOT NULL UNIQUE
);

-- Junction table linking users to their specific assigned permissions
CREATE TABLE `user_permissions` (
  `user_id` INT NOT NULL,
  `permission_id` INT NOT NULL,
  PRIMARY KEY (`user_id`, `permission_id`),
  FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE,
  FOREIGN KEY (`permission_id`) REFERENCES `permissions`(`id`) ON DELETE CASCADE
);

-- Table to manage all information related to vendors
CREATE TABLE `suppliers` (
  `id` INT PRIMARY KEY NOT NULL AUTO_INCREMENT,
  `name` VARCHAR(255) NOT NULL UNIQUE,
  `contact_person` VARCHAR(100) NULL,
  `email` VARCHAR(150) NOT NULL UNIQUE,
  `phone_number` VARCHAR(20) NULL,
  `address` TEXT NULL,
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Table to log every inbound or outbound movement of inventory
CREATE TABLE `transactions` (
  `id` INT PRIMARY KEY NOT NULL AUTO_INCREMENT,
  `item_id` INT NOT NULL,
  `user_id` INT NOT NULL,
  `type` ENUM('INBOUND', 'OUTBOUND') NOT NULL,
  `quantity` INT NOT NULL,
  `reference_number` VARCHAR(100) NULL,
  `transaction_date` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (`item_id`) REFERENCES `inventory_items`(`id`),
  FOREIGN KEY (`user_id`) REFERENCES `users`(`id`)
);

-- Table to provide a chronological record of significant user activities
CREATE TABLE `audit_trail` (
  `id` INT PRIMARY KEY NOT NULL AUTO_INCREMENT,
  `user_id` INT NOT NULL,
  `action` VARCHAR(255) NOT NULL,
  `details` TEXT NULL,
  `timestamp` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (`user_id`) REFERENCES `users`(`id`)
);

-- Add foreign key constraint to existing inventory_items table
ALTER TABLE `inventory_items`
ADD CONSTRAINT `fk_supplier_id`
FOREIGN KEY (`supplier_id`) REFERENCES `suppliers`(`id`);

-- Populate the permissions table with all defined system permissions
INSERT INTO `permissions` (`name`) VALUES
('view_inventory'),
('create_transaction'),
('manage_inventory'),
('manage_suppliers'),
('view_analytics'),
('generate_reports');
