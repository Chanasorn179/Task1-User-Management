# Task1 - User Management (Full Zip)

## How to run

### Backend
```bash
cd backend-server
npm install
npm run seed
npm run dev
```
You should see:
```
[UserRepository] SQLite DB path = ...
✅ UserRepository connected to SQLite database
✅ Server running on http://localhost:3001
```

### Frontend
```bash
cd admin-panel
npm install
npm start
```
Open http://localhost:3000

Login with: `AD001` or `AD002`

## Notes
- If you want to force DB location: set `SQLITE_DB_PATH` in `backend-server/.env`.
- The seeder creates teams and inserts sample users.