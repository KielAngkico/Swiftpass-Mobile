const express = require("express");
const router = express.Router();
const db = require("../db");

router.get("/assessment/:rfid_tag", async (req, res) => {
  const raw = req.params.rfid_tag;
  const trimmed = raw.trim();

  try {
    console.log("📩 Received assessment fetch for RFID:", trimmed);

    const [assessments] = await db.pool.execute(
      "SELECT * FROM ExerciseAssessments WHERE rfid_tag = ? ORDER BY completed_at DESC LIMIT 1",
      [trimmed]
    );

    if (assessments.length === 0) {
      console.log("⚠️ No assessment found for RFID:", trimmed);
      return res.status(404).json({ message: "No assessment found" });
    }

    const assessment = assessments[0];
    console.log("✅ Assessment fetched:", assessment);

    if (!assessment.assigned_split_name) {
      console.log("🚫 No assigned_split_name found in assessment.");
      return res.status(400).json({ message: "Assessment has no assigned split" });
    }

    const [splitDays] = await db.pool.execute(
      "SELECT * FROM SplitLibrary WHERE split_name = ? ORDER BY day_number",
      [assessment.assigned_split_name]
    );

    console.log(`📚 Split days fetched for split "${assessment.assigned_split_name}":`, splitDays.length);

    const fullDays = [];

    for (const day of splitDays) {
      const exerciseIds = JSON.parse(day.exercise_ids || "[]");

      let exercises = [];
      if (exerciseIds.length > 0) {
        const placeholders = exerciseIds.map(() => "?").join(",");
        const [exRows] = await db.pool.execute(
          `SELECT * FROM ExerciseLibrary WHERE id IN (${placeholders})`,
          exerciseIds
        );
        exercises = exRows.map(e => ({
  id: e.id,
  name: e.name,
  level: e.level,
  muscle_group: e.muscle_group,
  exercise_type: e.exercise_type,
  sub_target: e.sub_target,
  equipment: e.equipment,
  instructions: e.instructions,
  image_url: e.image_url
    ? `${process.env.EXPO_PUBLIC_MEDIA_URL}/${e.image_url.replace(/^\//, "")}`
    : null,
}));
        console.log(`📦 Exercises fetched for day ${day.day_number}:`, exercises.length);
      }

      fullDays.push({
        day_number: day.day_number,
        day_title: day.day_title,
        exercises,
      });
    }

    const splitDetails = {
      split_name: assessment.assigned_split_name,
      days: fullDays,
    };

    console.log("🎯 Returning full assessment and splitDetails.");
    return res.json({ assessment, splitDetails });

  } catch (error) {
    console.error("❌ Server error during assessment fetch:", error);
    return res.status(500).json({ message: "Server error" });
  }
});

module.exports = router;
