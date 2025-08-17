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

  const { 
    title, first_name, last_name, 
    permanent_address, current_address, use_permanent_as_current,
    birth_date, phone, congenital_disease, drug_allergy,
    newsletter, medical_data_consent
  } = req.body;

  const safe = (val) => (val === undefined ? null : val);

  if (!title || !first_name || !last_name || !permanent_address || !birth_date || !phone) {
    return res.status(400).json({ success: false, message: 'กรุณากรอกข้อมูลให้ครบถ้วน' });
  }

  try {
    await pool.execute(
      `INSERT INTO personal_info 
       (title, first_name, last_name, permanent_address, current_address, use_permanent_as_current,
        birth_date, phone, congenital_disease, drug_allergy, newsletter, medical_data_consent) 
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        safe(title),
        safe(first_name),
        safe(last_name),
        safe(permanent_address),
        safe(current_address),
        safe(use_permanent_as_current),
        safe(birth_date),
        safe(phone),
        safe(congenital_disease),
        safe(drug_allergy),
        safe(newsletter),
        safe(medical_data_consent)
      ]
    );

    res.json({ success: true, message: 'ลงทะเบียนสำเร็จ!' });
  } catch (err) {
    console.error('❌ Database Insert Error:', err.message);
    res.status(500).json({ success: false, message: 'เกิดข้อผิดพลาดในระบบ' });
  }
});




// หน้าเลือกวันและเวลานัด
app.get('/date', (req, res) => {
  res.render('date'); // render booking.ejs
});

// ✅ ดึง slot ที่ถูกจองในวันนั้น
app.get('/date', async (req, res) => {
    const { date } = req.query; // เปลี่ยนจาก req.params เป็น req.query

    if (!date) {
        return res.status(400).json({ error: 'กรุณาระบุวันที่ (appointment_date)' });
    }

    try {
        const [results] = await pool.query(
            `SELECT time_slot FROM appointments WHERE appointment_date = ? AND status != 'cancelled'`,
            [date]
        );
        const timeSlots = results.map(r => r.time_slot);
        res.json(timeSlots);
    } catch (err) {
        console.error('❌ Error querying appointments:', err);
        res.status(500).json({ error: 'เกิดข้อผิดพลาดในระบบ' });
    }
});

// ✅ บันทึกนัดหมายใหม่
app.post('/date', async (req, res) => {
    try {
        const { title, first_name, last_name, address, birth_date, phone, congenital_disease, drug_allergy, service_id, appointment_date, time_slot } = req.body;

        if (!first_name || !last_name || !service_id || !appointment_date || !time_slot) {
            return res.status(400).json({ error: 'กรุณาระบุข้อมูลให้ครบถ้วน' });
        }

        // ✅ 1. บันทึกข้อมูลผู้ป่วยใน personal_info
        const [personalInfoResult] = await pool.execute(
            `INSERT INTO personal_info (title, first_name, last_name, address, birth_date, phone, congenital_disease, drug_allergy)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
            [title, first_name, last_name, address, birth_date, phone, congenital_disease, drug_allergy]
        );

        const newUserId = personalInfoResult.insertId;

        // ✅ 2. บันทึกการนัดหมายโดยใช้ user_id จาก personal_info
        await pool.execute(
            `INSERT INTO appointments (user_id, service_id, appointment_date, time_slot, status, created_at, updated_at)
             VALUES (?, ?, ?, ?, 'จองแล้ว', NOW(), NOW())`,
            [newUserId, service_id, appointment_date, time_slot]
        );

        res.json({ success: true, message: '✅ จองนัดหมายสำเร็จ!' });

    } catch (err) {
        console.error('❌ Error inserting appointment:', err.sqlMessage || err.message);
        res.status(500).json({ error: 'เกิดข้อผิดพลาดในการจอง' });
    }
});





// ✅ Start Server
app.listen(PORT, () => console.log(`🚀 Server running at http://localhost:${PORT}`));

