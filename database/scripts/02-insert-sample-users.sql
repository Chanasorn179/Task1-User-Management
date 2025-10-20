-- 02-insert-sample-users.sql
PRAGMA foreign_keys = ON;

DELETE FROM users;

-- Admins
INSERT INTO users (username, fullName, role, teamId, status) VALUES
('AD001', 'Admin One', 'Admin', NULL, 'Active'),
('AD002', 'Admin Two', 'Admin', NULL, 'Active');

-- Supervisors (assumes teams 1..3 exist)
INSERT INTO users (username, fullName, role, teamId, status) VALUES
('SP001', 'Supervisor Alpha', 'Supervisor', 1, 'Active'),
('SP002', 'Supervisor Beta', 'Supervisor', 2, 'Active'),
('SP003', 'Supervisor Gamma', 'Supervisor', 3, 'Active');

-- Agents
INSERT INTO users (username, fullName, role, teamId, status) VALUES
('AG001', 'Agent Smith', 'Agent', 1, 'Active'),
('AG002', 'Agent Johnson', 'Agent', 1, 'Active'),
('AG003', 'Agent Williams', 'Agent', 1, 'Active'),
('AG004', 'Agent Brown', 'Agent', 2, 'Active'),
('AG005', 'Agent Davis', 'Agent', 2, 'Active'),
('AG006', 'Agent Miller', 'Agent', 3, 'Active'),
('AG007', 'Agent Wilson', 'Agent', 3, 'Active'),
('AG008', 'Agent Moore', 'Agent', 3, 'Active');