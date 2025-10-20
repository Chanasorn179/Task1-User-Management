// scripts/init-db.js
const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const fs = require('fs');

const dbPath = process.env.SQLITE_DB_PATH
  || path.resolve(__dirname, '..', '..', 'database', 'sqlite', 'wallboard.db');

fs.mkdirSync(path.dirname(dbPath), { recursive: true });
console.log('[init-db] SQLite DB path =', dbPath);

const db = new sqlite3.Database(dbPath, (err) => {
  if (err) { console.error(err); process.exit(1); }
});

function exec(sql){ return new Promise((resolve,reject)=> db.exec(sql, (e)=> e?reject(e):resolve())); }
function read(p){ return fs.readFileSync(p, 'utf8'); }

(async () => {
  try {
    await exec('PRAGMA foreign_keys = ON;');

    // Create teams table and seed first
    await exec(`
      CREATE TABLE IF NOT EXISTS teams (
        team_id INTEGER PRIMARY KEY AUTOINCREMENT,
        team_name TEXT NOT NULL UNIQUE
      );
    `);
    await exec(`
      INSERT OR IGNORE INTO teams (team_id, team_name) VALUES
        (1, 'Team Alpha'), (2, 'Team Beta'), (3, 'Team Gamma');
    `);
    console.log('✅ สร้าง/ใส่ข้อมูล teams สำเร็จ');

    // Run users DDL and seed
    const createUsers = read(path.resolve(__dirname, '..', '..', 'database', 'scripts', '01-create-users-table.sql'));
    await exec(createUsers);
    console.log('✅ สร้างตาราง users สำเร็จ');

    const seedUsers = read(path.resolve(__dirname, '..', '..', 'database', 'scripts', '02-insert-sample-users.sql'));
    await exec(seedUsers);
    console.log('✅ ใส่ข้อมูล users ตัวอย่างสำเร็จ');
  } catch (e) {
    console.error('❌ seed ล้มเหลว:', e.message);
  } finally {
    db.close();
  }
})();