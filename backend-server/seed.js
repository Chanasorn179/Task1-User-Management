const sqlite3 = require("sqlite3").verbose();
const db = new sqlite3.Database("../database/sqlite/wallboard.db", (err) => {
  if (err) {
    console.error("❌ Cannot open database:", err.message);
    return;
  }
});

db.serialize(() => {
  try {
    db.run("DELETE FROM agents");
    db.run("DELETE FROM users");
    db.run("DELETE FROM teams");

    // ลบออกหรือคอมเมนต์ไว้ชั่วคราวถ้า error
    // db.run("DELETE FROM sqlite_sequence");

    db.run("INSERT INTO teams (team_id, team_name) VALUES (1, 'Team Alpha')");
    db.run("INSERT INTO teams (team_id, team_name) VALUES (2, 'Team Beta')");
    db.run("INSERT INTO teams (team_id, team_name) VALUES (3, 'Team Gamma')");

    const agents = [
      ["AG001", "Alice Green", "Agent", 1, "Active"],
      ["AG002", "Bob Brown", "Agent", 1, "Active"],
      ["SV001", "Sara V", "Supervisor", 1, "Active"],
      ["AG010", "John Blue", "Agent", 2, "Inactive"],
      ["AD001", "Admin One", "Admin", 3, "Active"],
    ];
    const stmt = db.prepare(
      "INSERT INTO agents (agent_code, full_name, role, team_id, status) VALUES (?, ?, ?, ?, ?)"
    );
    agents.forEach((a) => stmt.run(a));
    stmt.finalize();

    db.run(`INSERT INTO users (username, fullName, role, teamId, status) 
            VALUES ('admin', 'Administrator', 'Admin', 3, 'Active')`);

    console.log("✅ Database seeded successfully.");
  } catch (e) {
    console.error("❌ Error during seeding:", e);
  }
});

db.close((err) => {
  if (err) {
    console.error("❌ Error closing DB:", err.message);
  } else {
    console.log("📦 DB connection closed.");
  }
});
