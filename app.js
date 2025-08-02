const express = require('express');
const path = require('path');
const app = express();
const PORT = 3000;
const mysql = require('mysql2/promise');

// Middleware
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));

// Set view engine
app.set('view engine', 'ejs');

// Routes
app.get('/', (req, res) => {
  res.render('register'); // render register.ejs
});

// Database connection
const pool = mysql.createPool({
  host: 'localhost',
  user: 'root',
  password: 'non1150',
  database: 'Upam',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});

async function testConnection() {
  try {
    const [rows] = await pool.query('SELECT 1 + 1 AS result');
    console.log('Connection Result:', rows[0].result);
  } catch (err) {
    console.error('Connection failed:', err);
  }
}

testConnection();

// Start server
app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});
