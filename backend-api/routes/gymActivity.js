const express = require('express');
const router = express.Router();
const db = require('../db');

router.get('/active-members/:adminId', async (req, res) => {
  const { adminId } = req.params;

  try {
    const [row] = await db.query(
      `SELECT COUNT(*) AS totalInside FROM AdminEntryLogs WHERE admin_id = ? AND member_status = 'inside'`,
      [adminId]
    );

    res.json({ totalInside: row.totalInside });
  } catch (err) {
    console.error("Error fetching total inside count:", err.message);
    res.status(500).json({ message: "Internal server error" });
  }
});



module.exports = router;
