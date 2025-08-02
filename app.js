const express = require('express');
const path = require('path');
const mysql = require('mysql2/promise');
const app = express();
const PORT = 3000;

// ✅ Middleware
app.use(express.json()); // เพิ่มสำหรับรองรับ JSON
app.use(express.urlencoded({ extended: true })); // รองรับฟอร์ม POST
app.use(express.static(path.join(__dirname, 'public')));

// ✅ View Engine
app.set('view engine', 'ejs');

// ✅ Database Connection
const pool = mysql.createPool({
  host: 'localhost',
  user: 'root',
  password: 'non1150',
  database: 'Upam',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});

// ✅ Test Database
async function testConnection() {
  try {
    const [rows] = await pool.query('SELECT 1 + 1 AS result');
    console.log('✅ Database Connected:', rows[0].result);
  } catch (err) {
    console.error('❌ Database Connection Failed:', err);
  }
}
testConnection();

// ✅ Routes
app.get('/', (req, res) => {
  res.render('register'); // render register.ejs
});

app.post('/register', async (req, res) => {
  console.log('📌 Received Data:', req.body);

  const { title, first_name, last_name, address, birth_date, phone, congenital_disease, drug_allergy } = req.body;

  // ตรวจสอบค่าที่จำเป็น
  if (!title || !first_name || !last_name || !address) {
    return res.status(400).json({ success: false, message: 'กรุณากรอกข้อมูลให้ครบถ้วน' });
  }

  try {
    await pool.execute(
      `INSERT INTO personal_info 
      (title, first_name, last_name, address, birth_date, phone, congenital_disease, drug_allergy) 
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [title, first_name, last_name, address, birth_date, phone, congenital_disease, drug_allergy]
    );

    // ✅ ส่ง JSON กลับ
    res.json({ success: true, message: 'ลงทะเบียนสำเร็จ!' });
  } catch (err) {
    console.error('❌ Database Insert Error:', err.message);
    res.status(500).json({ success: false, message: 'เกิดข้อผิดพลาดในระบบ' });
  }
});


// ✅ Start Server
app.listen(PORT, () => console.log(`🚀 Server running at http://localhost:${PORT}`));
