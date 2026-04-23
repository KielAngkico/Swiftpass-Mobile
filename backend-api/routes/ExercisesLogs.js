
const express = require("express");
const router = express.Router();
const db = require("../db"); 

router.get("/exercise-logs/weekly", async (req, res) => {
  const { member_id, week_start } = req.query;

  if (!member_id || !week_start) {
    return res.status(400).json({ message: "Missing member_id or week_start." });
  }

  try {
    const [rows] = await db.pool.execute(
      `SELECT * FROM MemberExerciseLogs
       WHERE member_id = ? 
         AND DATE(log_date) BETWEEN ? AND DATE_ADD(?, INTERVAL 6 DAY)`,
      [member_id, week_start, week_start]
    );

    res.json(rows);
  } catch (err) {
    console.error("Error fetching weekly logs:", err);
    res.status(500).json({ message: "Server error" });
  }
});

module.exports = router;
