require('dotenv').config({ path: require('path').resolve(__dirname, '../.env') });
console.log("DB_USER:", process.env.DB_USER); // should print 'root'
const mysql = require("mysql2/promise");

const pool = mysql.createPool({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
});

// ✅ Generic query function for cleaner SQL execution
const db = {
  pool,

  query: async (sql, params = []) => {
    try {
      const [rows] = await pool.execute(sql, params);
      return rows;
    } catch (error) {
      console.error("❌ DB Query Error:", error);
      throw error;
    }
  },

  getUserByEmail: async (email) => {
    try {
      const result = await db.query(
        "SELECT * FROM MembersAccounts WHERE email = ?",
        [email]
      );
      return result.length ? result[0] : null;
    } catch (error) {
      console.error("❌ getUserByEmail Error:", error);
      return null;
    }
  },

  // ---------------- OTP and Trusted Device Functions ----------------

  isDeviceTrusted: async (userId, deviceId) => {
    const rows = await db.query(
      "SELECT * FROM TrustedDevices WHERE user_id = ? AND device_id = ? AND expires_at > NOW()",
      [userId, deviceId]
    );
    return rows.length > 0;
  },

  saveOtp: async (userId, otp, minutesValid = 10, type = "login") => {
    const sql = `
      INSERT INTO UserOtp (user_id, otp, type, expires_at)
      VALUES (?, ?, ?, DATE_ADD(NOW(), INTERVAL ? MINUTE))
      ON DUPLICATE KEY UPDATE
        otp = VALUES(otp),
        expires_at = VALUES(expires_at),
        created_at = CURRENT_TIMESTAMP
    `;
    await db.query(sql, [userId, otp, type, minutesValid]);
  },

  verifyOtp: async (userId, otp, type = null) => {
    let sql = "SELECT * FROM UserOtp WHERE user_id = ? AND otp = ? AND expires_at > NOW()";
    const params = [userId, otp];
    if (type) {
      sql += " AND type = ?";
      params.push(type);
    }
    const rows = await db.query(sql, params);
    return rows.length > 0;
  },

  trustDevice: async (userId, deviceId) => {
    const sql = `
      INSERT INTO TrustedDevices (user_id, device_id, expires_at)
      VALUES (?, ?, DATE_ADD(NOW(), INTERVAL 24 HOUR))
      ON DUPLICATE KEY UPDATE
        expires_at = DATE_ADD(NOW(), INTERVAL 24 HOUR),
        created_at = CURRENT_TIMESTAMP
    `;
    await db.query(sql, [userId, deviceId]);
  },
};

module.exports = db;
