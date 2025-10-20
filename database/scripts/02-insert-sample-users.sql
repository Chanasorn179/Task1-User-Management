-- 02-insert-sample-users.sql
PRAGMA foreign_keys = ON;

INSERT OR IGNORE INTO teams (team_id, team_name) VALUES
  (1,'Team Alpha'),
  (2,'Team Beta'),
  (3,'Team Gamma');

INSERT OR IGNORE INTO agents (agent_code, full_name, role, team_id, status) VALUES
  ('AG001','Alice Green','Agent',1,'Active'),
  ('AG002','Bob Brown','Agent',1,'Active'),
  ('SV001','Sara V','Supervisor',1,'Active'),
  ('AG010','John Blue','Agent',2,'Inactive'),
  ('AD001','Admin One','Admin',3,'Active');
