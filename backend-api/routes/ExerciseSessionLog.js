const express = require("express");
const router = express.Router();
const db = require("../db");

router.post("/exercise-session-log", async (req, res) => {
  const { rfid_tag, exercise_id, sets, reps, weight, split_name, log_date } = req.body;

  if (!rfid_tag || !exercise_id || !split_name || !log_date) {
    return res.status(400).json({ error: "Missing required fields." });
  }

  try {

    const [result] = await db.pool.execute(
      `INSERT INTO MemberExerciseLogs 
       (rfid_tag, exercise_id, sets, reps, weight, split_name, log_date) 
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [rfid_tag, exercise_id, sets || 0, reps || 0, weight || 0, split_name, log_date]
    );

    res.status(201).json({ message: "✅ New log saved", insertId: result.insertId });
  } catch (error) {
    console.error("❌ Error saving workout log:", error);
    res.status(500).json({ error: "Server error while saving workout log." });
  }
});


router.get("/exercise-session-logs/:rfid", async (req, res) => {
  const { rfid } = req.params;

  try {
    const [rows] = await db.pool.execute(
      `SELECT rfid_tag, exercise_id, sets, reps, weight, split_name, log_date 
       FROM MemberExerciseLogs WHERE rfid_tag = ?`,
      [rfid]
    );

    const groupedLogs = {};

    rows.forEach(row => {
      const d = new Date(row.log_date);
      const year = d.getFullYear();
      const month = String(d.getMonth() + 1).padStart(2, "0");
      const day = String(d.getDate()).padStart(2, "0");
      const key = `${year}-${month}-${day}`; 

      if (!groupedLogs[key]) groupedLogs[key] = {};
      if (!groupedLogs[key][row.split_name]) groupedLogs[key][row.split_name] = {};
      groupedLogs[key][row.split_name][row.exercise_id.toString()] = {
        sets: row.sets,
        reps: row.reps,
        weight: row.weight,
      };
    });

    res.status(200).json(groupedLogs);
  } catch (error) {
    console.error("❌ Failed to fetch exercise logs:", error);
    res.status(500).json({ error: "Server error fetching logs" });
  }
});





module.exports = router;
	