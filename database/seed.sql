-- ============================================================================
-- Where Is It? — Campus Lost & Found Management System
-- Seed Data (All passwords hashed with bcrypt)
-- ============================================================================

USE `where_is_it_db`;

-- ----------------------------------------------------------------------------
-- 1. Categories
-- ----------------------------------------------------------------------------
INSERT INTO `categories` (`id`, `name`, `description`) VALUES
(1, 'Electronics', 'Laptops, smartphones, earbuds, power banks, chargers, and calculators'),
(2, 'ID Cards & Documents', 'Student ID cards, faculty badges, passports, certificates, and admit cards'),
(3, 'Keys & Access Cards', 'Dorm keys, locker keys, vehicle key fobs, and RFID building access cards'),
(4, 'Books & Stationery', 'Textbooks, lab notebooks, binders, styluses, and pencil cases'),
(5, 'Bags & Wallets', 'Backpacks, laptop sleeves, purses, cardholders, and wallets'),
(6, 'Clothing & Accessories', 'Jackets, glasses, watches, umbrellas, and headwear'),
(7, 'Lab & Sports Equipment', 'Lab coats, multimeters, rackets, and water bottles/flasks'),
(8, 'Other', 'Miscellaneous campus belongings not covered above');

-- ----------------------------------------------------------------------------
-- 2. Demo Users (passwords hashed via bcrypt, 10 rounds)
--    Admin:   admin@campus.edu         / Admin@1234
--    Student: sadia.rahman@campus.edu  / Student@1234
--    Student: rafiq.ahmed@campus.edu   / Student@1234
--    Faculty: dr.karim@campus.edu      / Faculty@1234
--    Staff:   tariq.mahmood@campus.edu / Staff@1234
-- ----------------------------------------------------------------------------
INSERT INTO `users` (`id`, `full_name`, `email`, `university_id`, `department`, `role`, `password_hash`, `account_status`) VALUES
(1, 'Campus Administrator', 'admin@campus.edu', 'ADM-0001', 'Campus Security & Administration', 'ADMIN', '$2b$10$Nh5Qw7WQxfqUWUHlmSyIke65utUdoWz6SBNXL.M8zOeYNAs48jrGy', 'ACTIVE'),
(2, 'Sadia Rahman', 'sadia.rahman@campus.edu', '221-15-1001', 'Computer Science & Engineering', 'STUDENT', '$2b$10$aS9DGLBzinNmkEbo/dMwiO7Paapm.4nyoMyskmH83O2fUA7vUelia', 'ACTIVE'),
(3, 'Rafiq Ahmed', 'rafiq.ahmed@campus.edu', '221-15-1042', 'Electrical & Electronic Engineering', 'STUDENT', '$2b$10$aS9DGLBzinNmkEbo/dMwiO7Paapm.4nyoMyskmH83O2fUA7vUelia', 'ACTIVE'),
(4, 'Dr. Hasan Karim', 'dr.karim@campus.edu', 'FAC-2014', 'Computer Science & Engineering', 'FACULTY', '$2b$10$XaUZFQGkBC1AALue0J68FeCCdg0CCIB.SxHI/qxy/b/Fxe2dTD.2O', 'ACTIVE'),
(5, 'Tariq Mahmood', 'tariq.mahmood@campus.edu', 'STF-3089', 'Central Library Services', 'STAFF', '$2b$10$1cs/nwKTaOhiEqnk/zRK1eFYth4Dj7nsLQLQHvMLdWir22X0OT8FW', 'ACTIVE');

-- ----------------------------------------------------------------------------
-- 3. Sample Lost & Found Reports
-- ----------------------------------------------------------------------------
INSERT INTO `items`
  (`id`, `user_id`, `category_id`, `item_name`, `description`, `report_type`, `location`, `event_date`, `approximate_time`, `contact_info`, `image_path`, `moderation_status`, `resolution_status`, `rejection_reason`)
VALUES
(1, 2, 1, 'Sony WF-1000XM4 Wireless Earbuds', 'Matte black charging case with a small silver scratch near the USB-C port. Lost after the afternoon Algorithms lecture.', 'LOST', 'Academic Building 3 - Room 402', DATE_SUB(CURDATE(), INTERVAL 4 DAY), '03:30 PM', 'Campus Desk or sadia.rahman@campus.edu', '/uploads/items/demo-earbuds.svg', 'APPROVED', 'OPEN', NULL),
(2, 3, 4, 'Casio fx-991EX Scientific Calculator', 'Black ClassWiz calculator inside a grey slide-on protective cover. Has a small blue sticker on the back.', 'LOST', 'EEE Lab Block - 2nd Floor', DATE_SUB(CURDATE(), INTERVAL 6 DAY), '11:15 AM', 'Meet at EEE Department Office', '/uploads/items/demo-calculator.svg', 'APPROVED', 'OPEN', NULL),
(3, 4, 6, 'Rectangular Titanium Eyeglasses', 'Gunmetal half-rim prescription eyeglasses inside a dark navy hard shell case.', 'LOST', 'Faculty Lounge - Admin Block', DATE_SUB(CURDATE(), INTERVAL 2 DAY), '01:00 PM', 'CSE Faculty Office Room 510', '/uploads/items/demo-glasses.svg', 'APPROVED', 'OPEN', NULL),
(4, 2, 5, 'Charcoal Grey 14-inch Laptop Sleeve', 'Padded Tomtoc zip sleeve containing a wireless mouse and HDMI dongle. Left near the study carrels.', 'LOST', 'Central Library - 3rd Floor Quiet Zone', DATE_SUB(CURDATE(), INTERVAL 1 DAY), '05:45 PM', 'Campus Lost & Found Desk', '/uploads/items/demo-sleeve.svg', 'APPROVED', 'OPEN', NULL),
(5, 5, 2, 'University Student ID Card (Found)', 'Found a laminated student ID card with a blue university lanyard near the main library turnstile.', 'FOUND', 'Central Library - Main Entrance', DATE_SUB(CURDATE(), INTERVAL 3 DAY), '10:20 AM', 'Handed to Central Library Front Desk', '/uploads/items/demo-idcard.svg', 'APPROVED', 'OPEN', NULL),
(6, 3, 3, 'Silver Dorm Keyring with Blue Tag', 'Set of three silver keys attached to a numbered blue plastic key tag and a mini carabiner.', 'FOUND', 'Campus Cafeteria - Outdoor Seating', DATE_SUB(CURDATE(), INTERVAL 2 DAY), '02:10 PM', 'Deposited at Campus Security Desk', '/uploads/items/demo-keys.svg', 'APPROVED', 'OPEN', NULL),
(7, 5, 7, 'Matte Navy Insulated Steel Water Flask', '750ml stainless steel flask with university robotics club sticker near the base.', 'FOUND', 'Engineering Auditorium', DATE_SUB(CURDATE(), INTERVAL 5 DAY), '04:00 PM', 'Library Lost & Found Locker #4', '/uploads/items/demo-flask.svg', 'APPROVED', 'OPEN', NULL),
(8, 4, 4, 'Introduction to Algorithms (CLRS 4th Ed.)', 'Hardcover textbook left on the seminar table after the departmental colloquium.', 'FOUND', 'CSE Seminar Hall - Room 201', DATE_SUB(CURDATE(), INTERVAL 7 DAY), '12:30 PM', 'CSE Department Office', '/uploads/items/demo-book.svg', 'APPROVED', 'RETURNED', NULL),
(9, 2, 1, 'Anker 20,000mAh Power Bank', 'Black matte portable charger with braided USB-C cable tucked into the mesh pouch.', 'FOUND', 'Student Union Common Room', DATE_SUB(CURDATE(), INTERVAL 1 DAY), '06:00 PM', 'Campus Lost & Found Desk', '/uploads/items/demo-powerbank.svg', 'PENDING_REVIEW', 'OPEN', NULL),
(10, 3, 6, 'Navy Rainproof Windbreaker Jacket', 'Size M zip-up windbreaker left on the bleachers after evening intramural practice.', 'LOST', 'University Sports Complex', DATE_SUB(CURDATE(), INTERVAL 3 DAY), '07:15 PM', 'rafiq.ahmed@campus.edu', NULL, 'PENDING_REVIEW', 'OPEN', NULL);

-- ----------------------------------------------------------------------------
-- 4. Sample Ownership Claims
-- ----------------------------------------------------------------------------
INSERT INTO `claims`
  (`id`, `item_id`, `claimant_id`, `explanation`, `identifying_details`, `evidence_path`, `status`, `admin_notes`, `reviewed_by`, `reviewed_at`)
VALUES
(1, 5, 2, 'I dropped my student ID lanyard while scanning out of the Central Library on Tuesday morning.', 'The card belongs to CSE Batch 221 and has a small circular library barcode sticker on the reverse side.', NULL, 'PENDING', NULL, NULL, NULL),
(2, 8, 3, 'I left my CLRS Algorithms textbook on the front row table after the seminar.', 'My initials R.A. are written inside the front cover in pencil, and page 112 has a yellow sticky note.', NULL, 'COMPLETED', 'Verified initials inside cover and returned at CSE Office.', 1, DATE_SUB(NOW(), INTERVAL 2 DAY));

-- ----------------------------------------------------------------------------
-- 5. Sample Notifications
-- ----------------------------------------------------------------------------
INSERT INTO `notifications`
  (`user_id`, `title`, `message`, `notification_type`, `related_item_id`, `related_claim_id`, `is_read`)
VALUES
(2, 'Report Approved', 'Your lost item report "Sony WF-1000XM4 Wireless Earbuds" has been approved and is now publicly visible.', 'REPORT_APPROVED', 1, NULL, 1),
(2, 'Ownership Claim Submitted', 'Your ownership claim for "University Student ID Card (Found)" has been submitted and is awaiting administrator verification.', 'CLAIM_SUBMITTED', 5, 1, 0),
(3, 'Item Returned Successfully', 'Handover for "Introduction to Algorithms (CLRS 4th Ed.)" is complete and the item status is now RETURNED.', 'ITEM_RETURNED', 8, 2, 0),
(1, 'New Ownership Claim Pending Review', 'Sadia Rahman submitted a claim for "University Student ID Card (Found)".', 'NEW_CLAIM_ADMIN', 5, 1, 0),
(1, 'New Found Report Pending Review', 'Anker 20,000mAh Power Bank report is awaiting moderation review.', 'NEW_REPORT_ADMIN', 9, NULL, 0);

-- ----------------------------------------------------------------------------
-- 6. Sample Admin Activity Logs
-- ----------------------------------------------------------------------------
INSERT INTO `admin_activity_logs`
  (`admin_id`, `action`, `target_type`, `target_id`, `details`)
VALUES
(1, 'ITEM_APPROVED', 'ITEM', 1, 'Approved LOST report "Sony WF-1000XM4 Wireless Earbuds"'),
(1, 'ITEM_APPROVED', 'ITEM', 5, 'Approved FOUND report "University Student ID Card (Found)"'),
(1, 'CLAIM_RETURN_COMPLETED', 'CLAIM', 2, 'Confirmed safe return for claim #2 ("Introduction to Algorithms (CLRS 4th Ed.)")');

-- ----------------------------------------------------------------------------
-- 7. System Settings
-- ----------------------------------------------------------------------------
INSERT INTO `system_settings` (`setting_key`, `setting_value`, `description`, `updated_by`) VALUES
('campus_name', 'University Central Campus', 'Official institution name shown across the portal', 1),
('lost_found_desk_location', 'Student Center, Ground Floor, Room 104', 'Physical campus Lost & Found verification & pickup desk', 1),
('desk_office_hours', 'Sunday – Thursday, 9:00 AM – 5:00 PM', 'Operating hours for physical item handover', 1),
('support_email', 'lostandfound@campus.edu', 'Official campus Lost & Found support email', 1),
('require_moderation_approval', 'true', 'Require administrator approval before reports appear publicly', 1),
('allow_new_registrations', 'true', 'Allow campus members to register new accounts', 1),
('claim_hold_days', '30', 'Number of days unclaimed found items are held at the desk', 1);

