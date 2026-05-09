const express = require("express");
const router = express.Router();
const db = require("../db");

router.post("/cardio-log", async (req, res) => {
  const { rfid_tag, cardio_exercise_id, log_date } = req.body;

  if (!rfid_tag || !cardio_exercise_id || !log_date) {
    return res.status(400).json({ error: "Missing required fields." });
  }

  try {
    await db.query(
      `INSERT INTO MemberCardioLog (rfid_tag, cardio_exercise_id, log_date)
       VALUES (?, ?, ?)
       ON DUPLICATE KEY UPDATE cardio_exercise_id = VALUES(cardio_exercise_id)`,
      [rfid_tag, cardio_exercise_id, log_date]
    );

    res.status(200).json({ success: true });
  } catch (error) {
    console.error("Error saving cardio log:", error);
    res.status(500).json({ error: "Server error while saving cardio log." });
  }
});

router.get("/cardio-log/:rfid_tag", async (req, res) => {
  const { rfid_tag } = req.params;
  const { date } = req.query;

  if (!date) {
    return res.status(400).json({ error: "Missing date query parameter." });
  }

  try {
    const result = await db.query(
      `SELECT mcl.cardio_exercise_id, el.name, el.image_url
       FROM MemberCardioLog mcl
       JOIN ExerciseLibrary el ON el.id = mcl.cardio_exercise_id
       WHERE mcl.rfid_tag = ? AND mcl.log_date = ?
       LIMIT 1`,
      [rfid_tag, date]
    );

    const rows = Array.isArray(result) ? result : [];

    if (rows.length === 0) {
      return res.status(200).json(null);
    }

    const row = rows[0];

    res.status(200).json({
      cardio_exercise_id: row.cardio_exercise_id,
      name: row.name,
      image_url: row.image_url
        ? `${process.env.EXPO_PUBLIC_MEDIA_URL}/${row.image_url.replace(/^\//, "")}`
        : null,
    });
  } catch (error) {
    console.error("Error fetching cardio log:", error);
    res.status(500).json({ error: "Server error fetching cardio log." });
  }
});

module.exports = router;