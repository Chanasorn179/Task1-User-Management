require('dotenv').config();
const express = require('express');
const cors = require('cors');

const app = express(); // Ensure app is defined before use

// Middlewares
app.use(cors({ origin: 'http://localhost:3000', credentials: true }));
app.use(express.json());

// Routes
const authRoutes = require('./routes/auth');
const userRoutes = require('./routes/users');

app.get('/', (_req, res) => {
  res.send('User Management Backend is running');
});

app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);

// Start server
const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`✅ Server running on http://localhost:${PORT}`);
});