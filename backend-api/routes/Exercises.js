const express = require("express");
const router = express.Router();
const db = require("../db");

router.get("/splits", async (req, res) => {
  try {
    const { workout_days } = req.query;

    if (!workout_days) {
      return res.status(400).json({ message: "Missing workout_days query parameter." });
    }

    const [splits] = await db.pool.execute(
      `SELECT id, split_name, day_number, day_title, exercise_ids
       FROM SplitLibrary
       WHERE workout_days = ?`,
      [workout_days]
    );

    const detailedSplits = await Promise.all(
      splits.map(async (split) => {
        let exerciseIds = [];

        if (split.exercise_ids) {
          try {
            exerciseIds = JSON.parse(split.exercise_ids);
          } catch {
            exerciseIds = [];
          }
        }

        let exerciseData = [];

        if (exerciseIds.length > 0) {
          const placeholders = exerciseIds.map(() => '?').join(', ');
          const query = `
            SELECT id, name, muscle_group, equipment, instructions
            FROM ExerciseLibrary
            WHERE id IN (${placeholders})
          `;
          const [rows] = await db.pool.execute(query, exerciseIds);

          exerciseData = rows.map(row => ({
            id: row.id,
            exercise_name: row.name,
            muscle_group: row.muscle_group,
            equipment: row.equipment,
            instructions: row.instructions,
          }));
        }

        return {
          ...split,
          exercise_data: exerciseData
        };
      })
    );

    res.json(detailedSplits);
  } catch (err) {
    console.error("🔥 Error fetching splits:", err);
    res.status(500).json({ message: "Server error." });
  }
});


router.get("/splits/grouped", async (req, res) => {
  try {
    const { workout_days } = req.query;
    if (!workout_days) return res.status(400).json({ message: "Missing workout_days" });

    const [splits] = await db.pool.execute(
      `SELECT split_name, COUNT(*) AS day_count, GROUP_CONCAT(day_title ORDER BY day_number SEPARATOR ', ') AS day_titles
       FROM SplitLibrary
       WHERE workout_days = ?
       GROUP BY split_name`,
      [workout_days]
    );

    const result = {};
    splits.forEach(s => {
      result[s.split_name] = {
        day_count: s.day_count,
        day_titles: s.day_titles.split(', '),
      };
    });

    res.json(result);
  } catch (err) {
    console.error("🔥 Error fetching grouped splits:", err);
    res.status(500).json({ message: "Server error." });
  }
});


router.get("/splits/details", async (req, res) => {
  try {
    const { split_name, workout_days, gender, body_goal } = req.query;
    if (!split_name || !workout_days || !gender || !body_goal) {
      return res.status(400).json({ message: "Missing required params: split_name, workout_days, gender, body_goal" });
    }

    const [days] = await db.pool.execute(
      `SELECT id, day_number, day_title, exercise_ids
       FROM SplitLibrary
       WHERE split_name = ? AND workout_days = ?
       ORDER BY day_number`,
      [split_name, workout_days]
    );

    const detailedDays = await Promise.all(
      days.map(async (day) => {
        let exerciseIds = [];
        if (day.exercise_ids) {
          try {
            exerciseIds = JSON.parse(day.exercise_ids);
          } catch {
            exerciseIds = [];
          }
        }

        let exercises = [];

        if (exerciseIds.length > 0) {
          const placeholders = exerciseIds.map(() => '?').join(', ');
          const [exerciseRows] = await db.pool.execute(
            `SELECT id, name, muscle_group, equipment, instructions
             FROM ExerciseLibrary
             WHERE id IN (${placeholders})`,
            exerciseIds
          );

          const [repRanges] = await db.pool.execute(
            `SELECT reps_low, reps_high FROM RepRanges
             WHERE body_goal = ? AND (gender = ? OR gender = 'unisex')
             ORDER BY gender DESC LIMIT 1`,
            [body_goal, gender]
          );
          const repsRange = repRanges[0] || { reps_low: null, reps_high: null };

          exercises = exerciseRows.map(e => ({
            id: e.id,
            exercise_name: e.name,
            muscle_group: e.muscle_group,
            equipment: e.equipment,
            instructions: e.instructions,
            reps_low: repsRange.reps_low,
            reps_high: repsRange.reps_high,
          }));
        }

        return {
          day_number: day.day_number,
          day_title: day.day_title,
          exercises,
        };
      })
    );

    res.json({
      split_name,
      workout_days: Number(workout_days),
      days: detailedDays,
    });

  } catch (err) {
    console.error("🔥 Error fetching split details:", err);
    res.status(500).json({ message: "Server error." });
  }
});




module.exports = router;
