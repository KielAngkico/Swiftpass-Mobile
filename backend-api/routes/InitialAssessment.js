const express = require('express');
const router = express.Router();
const db = require('../db'); 

router.post('/initial-assessment', async (req, res) => {
  console.log("📥 Received initial assessment payload:", req.body);

  try {
    const {
      member_id,
      rfid_tag,
      username,
      sex,
      age,
      height_cm,
      weight_kg,
      activity_level,
      body_goal,
      goal_type,
      calorie_maintenance,
      calories_target,
      calorie_strategy,
    } = req.body;

    if (!member_id || !rfid_tag || !username || !sex || !age || !height_cm || !weight_kg || !calorie_maintenance || !calories_target) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    const sql = `
      INSERT INTO InitialAssessment 
      (member_id, rfid_tag, username, sex, age, height_cm, weight_kg, activity_level, body_goal, goal_type, calorie_maintenance, calories_target, calorie_strategy) 
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;

    const values = [
      member_id,
      rfid_tag,
      username,
      sex,
      age,
      height_cm,
      weight_kg,
      activity_level || null,
      body_goal || null,
      goal_type || null,
      calorie_maintenance,
      calories_target,
      calorie_strategy || null,
    ];

    await db.query(sql, values);

    res.status(201).json({ message: 'Initial assessment saved successfully' });
  } catch (err) {
    console.error('Error inserting initial assessment:', err);
    res.status(500).json({ error: 'Failed to save initial assessment' });
  }
});

module.exports = router;
