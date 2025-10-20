-- 01-create-users-table.sql
PRAGMA foreign_keys = ON;

DROP TABLE IF EXISTS users;

CREATE TABLE users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT NOT NULL UNIQUE,
    fullName TEXT NOT NULL,
    role TEXT NOT NULL CHECK(role IN ('Agent', 'Supervisor', 'Admin')),
    teamId INTEGER,
    status TEXT NOT NULL DEFAULT 'Active' CHECK(status IN ('Active', 'Inactive')),
    createdAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updatedAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    lastLoginAt DATETIME,
    deletedAt DATETIME,
    FOREIGN KEY (teamId) REFERENCES teams(team_id)
);

CREATE INDEX IF NOT EXISTS idx_users_username ON users(username);
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);
CREATE INDEX IF NOT EXISTS idx_users_status ON users(status);
CREATE INDEX IF NOT EXISTS idx_users_teamId ON users(teamId);
CREATE INDEX IF NOT EXISTS idx_users_deletedAt ON users(deletedAt);

CREATE TRIGGER IF NOT EXISTS update_users_timestamp 
AFTER UPDATE ON users
FOR EACH ROW
BEGIN
    UPDATE users SET updatedAt = CURRENT_TIMESTAMP WHERE id = NEW.id;
END;