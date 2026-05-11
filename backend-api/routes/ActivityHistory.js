const express = require('express');
const router = express.Router();
const { pool } = require('../db');

router.get('/activity-history', async (req, res) => {
const { member_id, rfid_tag, system_type, admin_id } = req.query;
  console.log('📩 Query:', { member_id, rfid_tag, system_type, admin_id });

  if (!member_id) {
    console.warn('⚠️ Missing member_id in request');
    return res.status(400).json({ message: 'member_id is required' });
  }

  try {
const [rows] = await pool.query(
      `SELECT 
         id,
         full_name,
         entry_time,
         exit_time,
         admin_id
       FROM AdminEntryLogs
       WHERE member_id = ?
       ORDER BY entry_time DESC`,
      [member_id]
    );

    console.log(`✅ Fetched ${rows.length} entry logs for member_id: ${member_id}`);

    const enrichedRows = await Promise.all(rows.map(async (entry, index) => {
      const [admin] = await pool.query(
        `SELECT gym_name FROM AdminAccounts WHERE id = ?`,
        [entry.admin_id]
      );

      const gymName = admin[0]?.gym_name || 'Unknown';

      console.log(`🏋️ Entry ${index + 1}:`, {
        full_name: entry.full_name,
        entry_time: entry.entry_time,
        gym_name: gymName,
      });

return {
  id: entry.id,
  full_name: entry.full_name,
  label: `Visited ${gymName} Gym`,
  timestamp: new Date(entry.entry_time).toISOString(),
  exit_time: entry.exit_time ? new Date(entry.exit_time).toISOString() : null, // 👈 add this
  type: 'entry',
  admin_id: entry.admin_id,
};
    }));

    return res.json({ activities: enrichedRows });

  } catch (error) {
    console.error('❌ ActivityHistory error:', error);
    return res.status(500).json({ message: 'Failed to fetch gym entry logs.' });
  }
});

module.exports = router;
