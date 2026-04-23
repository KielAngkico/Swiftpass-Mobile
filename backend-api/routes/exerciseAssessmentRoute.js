const express = require("express");
const router = express.Router();
const db = require("../db");

router.post("/exercise-assessments", async (req, res) => {
  console.log("[ExerciseAssessments] POST body:", req.body);
  try {
    const {
      rfid_tag,
      admin_id,
      age,
      gender,
      fitness_level,
      body_goal,
      workout_days,
      assigned_split_name,
    } = req.body;
    if (!rfid_tag || !age || !gender || !body_goal || !workout_days || !assigned_split_name) {
      return res.status(400).json({ message: "Missing required fields." });
    }
    const [memberRows] = await db.pool.execute(
      "SELECT id FROM MembersAccounts WHERE rfid_tag = ?",
      [rfid_tag]
    );

    if (memberRows.length === 0) {
      return res.status(404).json({ message: "Member not found for given RFID." });
    }

    const member_id = memberRows[0].id;
    const sql = `
      INSERT INTO ExerciseAssessments (member_id, rfid_tag, admin_id, age, gender, fitness_level, body_goal, workout_days, assigned_split_name)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
      ON DUPLICATE KEY UPDATE
        admin_id = VALUES(admin_id),
        age = VALUES(age),
        gender = VALUES(gender),
        fitness_level = VALUES(fitness_level),
        body_goal = VALUES(body_goal),
        workout_days = VALUES(workout_days),
        assigned_split_name = VALUES(assigned_split_name),
        completed_at = CURRENT_TIMESTAMP
    `;

    await db.pool.execute(sql, [
      member_id,
      rfid_tag,
      admin_id || null,
      age,
      gender,
      fitness_level || null,
      body_goal,
      workout_days,
      assigned_split_name,
    ]);

    res.json({ message: "Assessment saved successfully." });
  } catch (err) {
    console.error("🔥 Error saving assessment:", err);
    res.status(500).json({ message: "Server error." });
  }
});

module.exports = router;
