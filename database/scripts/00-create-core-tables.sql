-- 00-create-core-tables.sql
PRAGMA foreign_keys = ON;

CREATE TABLE IF NOT EXISTS teams (
  team_id INTEGER PRIMARY KEY,
  team_name TEXT NOT NULL UNIQUE
);

CREATE TABLE IF NOT EXISTS agents (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  agent_code TEXT NOT NULL UNIQUE,
  full_name TEXT NOT NULL,
  role TEXT NOT NULL CHECK(role IN ('Agent','Supervisor','Admin')),
  team_id INTEGER NOT NULL,
  status TEXT NOT NULL DEFAULT 'Active' CHECK(status IN ('Active','Inactive','Break','Away')),
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (team_id) REFERENCES teams(team_id) ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_agents_team ON agents(team_id);
