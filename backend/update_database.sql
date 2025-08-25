-- Add work_mode column to personnel table
ALTER TABLE personnel ADD COLUMN work_mode ENUM('Office', 'Remote', 'Hybrid') DEFAULT 'Office';

-- Add location_type column to pdks_entry table
ALTER TABLE pdks_entry ADD COLUMN location_type ENUM('Office', 'Remote', 'Hybrid') DEFAULT 'Office';

-- Create remote_work_requests table
CREATE TABLE IF NOT EXISTS `remote_work_requests` (
  `request_id` int(11) NOT NULL AUTO_INCREMENT,
  `personnel_per_id` int(11) NOT NULL,
  `request_date` date NOT NULL,
  `work_mode` enum('Remote','Hybrid') NOT NULL,
  `request_reason` text DEFAULT NULL,
  `status` enum('Pending','Approved','Rejected') DEFAULT 'Pending',
  `approved_by` int(11) DEFAULT NULL,
  `approved_at` timestamp NULL DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`request_id`),
  KEY `personnel_per_id` (`personnel_per_id`),
  KEY `approved_by` (`approved_by`),
  CONSTRAINT `remote_work_requests_ibfk_1` FOREIGN KEY (`personnel_per_id`) REFERENCES `personnel` (`per_id`) ON DELETE CASCADE,
  CONSTRAINT `remote_work_requests_ibfk_2` FOREIGN KEY (`approved_by`) REFERENCES `admin_users` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
