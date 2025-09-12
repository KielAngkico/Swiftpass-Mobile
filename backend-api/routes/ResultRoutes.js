const express = require("express");
const router = express.Router();
const db = require("../db");

router.get("/:rfid_tag", async (req, res) => {
  console.log("✅ Received request for RFID:", req.params.rfid_tag);
  const { rfid_tag } = req.params;

  try {

    const [assessmentRows] = await db.pool.execute(
      `SELECT * FROM ExerciseAssessments 
       WHERE rfid_tag = ? 
       ORDER BY completed_at DESC 
       LIMIT 1`,
      [rfid_tag]
    );

    if (assessmentRows.length === 0) {
      return res.status(404).json({ message: "No assessment found for this RFID tag" });
    }

    const assessment = assessmentRows[0];
    const assignedSplit = assessment.assigned_split_name;

    if (!assignedSplit) {
      return res.status(400).json({ message: "Assigned split name is not set in assessment" });
    }


    const [splitDays] = await db.pool.execute(
      `SELECT * FROM SplitLibrary WHERE split_name = ? ORDER BY day_number ASC`,
      [assignedSplit]
    );

    if (splitDays.length === 0) {
      return res.status(404).json({ message: "Split not found in SplitLibrary" });
    }


    const workoutPlan = {};

    for (const day of splitDays) {

      const exerciseIds = JSON.parse(day.exercise_ids);

  
      if (!exerciseIds.length) {
        workoutPlan[day.day_title] = [];
        continue;
      }

      const placeholders = exerciseIds.map(() => "?").join(",");
      const [exercises] = await db.pool.execute(
        `SELECT * FROM ExerciseLibrary WHERE id IN (${placeholders})`,
        exerciseIds
      );

      workoutPlan[day.day_title] = exercises;
    }


    res.json({
      assessment,
      split: {
        name: assignedSplit,
        days: splitDays.map((d) => d.day_title),
      },
      workoutPlan,
    });
  } catch (err) {
    console.error("❌ Error fetching workout plan:", err);
    res.status(500).json({ message: "Server error" });
  }
});

module.exports = router;
