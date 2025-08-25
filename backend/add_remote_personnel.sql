-- Add remote and hybrid working personnel

-- Remote working personnel (ID: 21)
INSERT INTO `personnel` (`per_id`, `per_name`, `per_lname`, `per_department`, `per_role`, `per_status`, `work_mode`, `avatar_url`) 
VALUES (21, 'Deniz', 'Korkmaz', 'IT', 'Senior Developer', 'Active', 'Remote', NULL);

-- Hybrid working personnel (ID: 22)  
INSERT INTO `personnel` (`per_id`, `per_name`, `per_lname`, `per_department`, `per_role`, `per_status`, `work_mode`, `avatar_url`) 
VALUES (22, 'Selin', 'Özkan', 'Finance', 'Senior Accountant', 'Active', 'Hybrid', NULL);

-- Add some sample remote work requests for these personnel
INSERT INTO `remote_work_requests` (`personnel_per_id`, `request_date`, `work_mode`, `request_reason`, `status`, `approved_by`, `approved_at`) 
VALUES 
(21, '2025-01-15', 'Remote', 'Evden çalışma talebi - proje yoğunluğu', 'Approved', 1, NOW()),
(21, '2025-01-16', 'Remote', 'Evden çalışma talebi - proje yoğunluğu', 'Approved', 1, NOW()),
(22, '2025-01-15', 'Hybrid', 'Hibrit çalışma talebi - sabah ofis, öğleden sonra ev', 'Approved', 1, NOW()),
(22, '2025-01-16', 'Hybrid', 'Hibrit çalışma talebi - sabah ofis, öğleden sonra ev', 'Approved', 1, NOW());

-- Add some sample entries for these personnel with location_type
INSERT INTO `pdks_entry` (`pdks_date`, `pdks_checkInTime`, `pdks_checkOutTime`, `personnel_per_id`, `location_type`) 
VALUES 
('2025-01-15', '09:00:00', '17:00:00', 21, 'Remote'),
('2025-01-16', '08:30:00', '17:30:00', 21, 'Remote'),
('2025-01-15', '08:00:00', '12:00:00', 22, 'Office'),
('2025-01-15', '13:00:00', '17:00:00', 22, 'Remote'),
('2025-01-16', '08:00:00', '12:00:00', 22, 'Office'),
('2025-01-16', '13:00:00', '17:00:00', 22, 'Remote');
