'use strict';
const path = require('path');
const fs = require('fs');
const sqlite3 = require('sqlite3').verbose();
const mongoose = require('mongoose');

// ---------- helpers ----------
function resolveMonorepoRoot() {
  // ถ้าไฟล์นี้อยู่ backend-server/config => ขึ้นสองชั้นจะถึงรากโปรเจ็กต์ (Task1-User-Management (2))
  return path.resolve(__dirname, '..', '..');
}

function resolveDbPath() {
  const envPath = process.env.SQLITE_DB_PATH; // absolute/relative ได้ทั้งคู่
  const monorepoRoot = resolveMonorepoRoot();
  const relOrDefault = envPath && envPath.trim().length > 0
    ? envPath
    : './database/sqlite/wallboard.db';
  const abs = path.isAbsolute(relOrDefault)
    ? relOrDefault
    : path.resolve(monorepoRoot, relOrDefault);
  return { monorepoRoot, abs, showEnv: relOrDefault };
}

function ensureDirExists(filePath) {
  const dir = path.dirname(filePath);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
}

function readSqlIfExists(file) {
  try { return fs.readFileSync(file, 'utf8'); } catch { return null; }
}

async function runMigrations(db, scriptsDir) {
  if (!fs.existsSync(scriptsDir)) {
    console.warn('⚠️  Scripts folder not found:', scriptsDir);
    return;
  }
  const files = fs.readdirSync(scriptsDir)
    .filter(f => f.toLowerCase().endsWith('.sql'))
    .sort((a,b) => a.localeCompare(b, undefined, { numeric:true, sensitivity:'base' }));

  if (files.length === 0) {
    console.warn('⚠️  No .sql files in', scriptsDir);
    return;
  }

  await new Promise((resolve, reject) => {
    db.serialize(() => {
      for (const f of files) {
        const full = path.join(scriptsDir, f);
        const sql = readSqlIfExists(full);
        if (!sql) { console.warn('⚠️  Skip missing', full); continue; }
        console.log('🧩 Applying', f);
        db.exec(sql, (err) => {
          if (err) {
            console.error('❌ SQL error in', f, '\n   ', err.message);
            reject(err);
          }
        });
      }
      resolve();
    });
  });
}

// ---------- SQLite ----------
function openSqlite() {
  const { monorepoRoot, abs: dbPath, showEnv } = resolveDbPath();
  console.log('🔍 SQLite Connection Details:');
  console.log('   SQLITE_DB_PATH (env or default):', showEnv);
  console.log('   __dirname:', __dirname);
  console.log('   Monorepo root:', monorepoRoot);
  console.log('   Resolved dbPath:', dbPath);

  ensureDirExists(dbPath);               // สร้างโฟลเดอร์ถ้าไม่มี
  const db = new sqlite3.Database(dbPath);
  db.exec('PRAGMA foreign_keys = ON;');
  return { db, dbPath, monorepoRoot };
}

async function initSQLite() {
  const { db, dbPath, monorepoRoot } = openSqlite();

  // มีตาราง agents ไหม?
  const hasAgents = await new Promise((resolve) => {
    db.get("SELECT name FROM sqlite_master WHERE type='table' AND name='agents';", (err, row) => {
      if (err) {
        console.error('❌ sqlite_master check failed:', err.message);
        return resolve(false);
      }
      resolve(!!row);
    });
  });

  // ถ้าไม่มี => รัน migrations ทั้งโฟลเดอร์ scripts
  if (!hasAgents) {
    console.warn('⚠️  Table "agents" not found. Running migrations...');
    const scriptsDir = path.resolve(monorepoRoot, 'database', 'scripts');
    try {
      await runMigrations(db, scriptsDir);
    } catch (e) {
      console.error('❌ Migration failed:', e.message);
      throw new Error('Database schema error. Please fix SQL scripts and re-run.');
    }
  }

  // sanity check
  const tableCount = await new Promise((resolve, reject) => {
    db.get("SELECT count(*) AS n FROM sqlite_master WHERE type='table';", (err, row) => {
      if (err) return reject(err);
      resolve(row?.n ?? 0);
    });
  });
  console.log(`✅ SQLite ready @ ${dbPath}. Tables: ${tableCount}`);
  return db; // เก็บคอนเนคชันไว้ใช้
}

// ---------- MongoDB ----------
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/wallboard';

async function connectMongoDB() {
  const maxRetries = 5;
  for (let i = 1; i <= maxRetries; i++) {
    try {
      await mongoose.connect(MONGODB_URI, { serverSelectionTimeoutMS: 5000 });
      console.log('✅ Connected to MongoDB:', MONGODB_URI);
      return;
    } catch (err) {
      console.error(`❌ MongoDB connection attempt ${i}/${maxRetries} failed:`, err.message);
      if (i === maxRetries) throw err;
      const wait = Math.min(1000 * (2 ** i), 10000);
      console.log(`⏳ retrying in ${wait/1000}s...`);
      await new Promise(r => setTimeout(r, wait));
    }
  }
}

mongoose.connection.on('connected', () => console.log('📊 Mongoose connected'));
mongoose.connection.on('error', err => console.error('❌ Mongoose error:', err));
mongoose.connection.on('disconnected', () => console.log('⚠️  Mongoose disconnected'));
process.on('SIGINT', async () => { await mongoose.connection.close(); console.log('🔌 MongoDB closed'); process.exit(0); });

// ---------- exports ----------
module.exports = {
  initSQLite,           // async => returns sqlite3.Database
  connectMongoDB,
  getSQLitePath: () => resolveDbPath().abs
};
