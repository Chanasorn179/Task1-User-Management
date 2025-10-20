// repositories/userRepository.js
const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const fs = require('fs');

const dbPath = process.env.SQLITE_DB_PATH
  || path.resolve(__dirname, '..', '..', 'database', 'sqlite', 'wallboard.db');

fs.mkdirSync(path.dirname(dbPath), { recursive: true });
console.log('[UserRepository] SQLite DB path =', dbPath);

class UserRepository {
  constructor() {
    this.db = new sqlite3.Database(dbPath, (err) => {
      if (err) {
        console.error('Error connecting to database:', err);
      } else {
        console.log('✅ UserRepository connected to SQLite database');
        this.db.run('PRAGMA foreign_keys = ON');
      }
    });
  }

  async findAll(filters = {}) {
    return new Promise((resolve, reject) => {
      let query = `
        SELECT 
          u.id,
          u.username,
          u.fullName,
          u.role,
          u.teamId,
          t.team_name as teamName,
          u.status,
          u.createdAt,
          u.updatedAt,
          u.lastLoginAt
        FROM users u
        LEFT JOIN teams t ON u.teamId = t.team_id
        WHERE u.deletedAt IS NULL
      `;
      
      const params = [];
      
      if (filters.role) { query += ' AND u.role = ?'; params.push(filters.role); }
      if (filters.status) { query += ' AND u.status = ?'; params.push(filters.status); }
      if (filters.teamId) { query += ' AND u.teamId = ?'; params.push(filters.teamId); }
      
      query += ' ORDER BY u.createdAt DESC';
      
      this.db.all(query, params, (err, rows) => err ? reject(err) : resolve(rows));
    });
  }

  async findById(userId) {
    return new Promise((resolve, reject) => {
      const q = `
        SELECT 
          u.id, u.username, u.fullName, u.role, u.teamId,
          t.team_name as teamName, u.status, u.createdAt, u.updatedAt, u.lastLoginAt
        FROM users u
        LEFT JOIN teams t ON u.teamId = t.team_id
        WHERE u.id = ? AND u.deletedAt IS NULL
      `;
      this.db.get(q, [userId], (err, row) => err ? reject(err) : resolve(row));
    });
  }

  async findByUsername(username) {
    return new Promise((resolve, reject) => {
      const q = `
        SELECT 
          u.id, u.username, u.fullName, u.role, u.teamId,
          t.team_name as teamName, u.status, u.createdAt, u.updatedAt, u.lastLoginAt
        FROM users u
        LEFT JOIN teams t ON u.teamId = t.team_id
        WHERE u.username = ? AND u.deletedAt IS NULL
      `;
      this.db.get(q, [username], (err, row) => err ? reject(err) : resolve(row));
    });
  }

  async create(userData) {
    return new Promise((resolve, reject) => {
      const q = `
        INSERT INTO users (username, fullName, role, teamId, status)
        VALUES (?, ?, ?, ?, ?)
      `;
      const p = [
        userData.username,
        userData.fullName,
        userData.role,
        userData.teamId || null,
        userData.status || 'Active'
      ];
      this.db.run(q, p, function(err) {
        if (err) return reject(err);
        resolve({ id: this.lastID, ...userData });
      });
    });
  }

  // Fully implemented dynamic update
  async update(userId, userData) {
    return new Promise((resolve, reject) => {
      let setClause = 'updatedAt = CURRENT_TIMESTAMP';
      const params = [];

      if (userData.fullName !== undefined) { setClause += ', fullName = ?'; params.push(userData.fullName); }
      if (userData.role !== undefined) { setClause += ', role = ?'; params.push(userData.role); }
      if (userData.teamId !== undefined) { setClause += ', teamId = ?'; params.push(userData.teamId || null); }
      if (userData.status !== undefined) { setClause += ', status = ?'; params.push(userData.status); }

      params.push(userId);

      const q = `UPDATE users SET ${setClause} WHERE id = ? AND deletedAt IS NULL`;
      this.db.run(q, params, function(err) {
        if (err) return reject(err);
        if (this.changes === 0) return reject(new Error('User not found or already deleted'));
        resolve({ id: userId, ...userData });
      });
    });
  }

  async softDelete(userId) {
    return new Promise((resolve, reject) => {
      const q = `
        UPDATE users 
        SET status = 'Inactive', deletedAt = CURRENT_TIMESTAMP, updatedAt = CURRENT_TIMESTAMP
        WHERE id = ? AND deletedAt IS NULL
      `;
      this.db.run(q, [userId], function(err) {
        if (err) return reject(err);
        if (this.changes === 0) return reject(new Error('User not found or already deleted'));
        resolve({ success: true, changes: this.changes });
      });
    });
  }

  async updateLastLogin(userId) {
    return new Promise((resolve, reject) => {
      const q = `UPDATE users SET lastLoginAt = CURRENT_TIMESTAMP WHERE id = ?`;
      this.db.run(q, [userId], function(err) {
        if (err) return reject(err);
        resolve({ success: true });
      });
    });
  }

  async usernameExists(username) {
    return new Promise((resolve, reject) => {
      const q = `SELECT COUNT(*) as count FROM users WHERE username = ? AND deletedAt IS NULL`;
      this.db.get(q, [username], (err, row) => err ? reject(err) : resolve(row.count > 0));
    });
  }
}

module.exports = new UserRepository();