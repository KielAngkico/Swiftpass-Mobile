const express = require('express');
const router = express.Router();
const { pool } = require('../db');

router.get('/activity-history', async (req, res) => {
  const { rfid_tag, system_type, admin_id } = req.query;
  console.log('📩 Query:', { rfid_tag, system_type, admin_id });

  if (!rfid_tag) {
    console.warn('⚠️ Missing RFID tag in request');
    return res.status(400).json({ message: 'rfid_tag is required' });
  }

  try {
    const [rows] = await pool.query(
      `SELECT 
         id,
         full_name,
         entry_time,
         admin_id
       FROM AdminEntryLogs
       WHERE rfid_tag = ?
       ORDER BY entry_time DESC`,
      [rfid_tag]
    );

    console.log(`✅ Fetched ${rows.length} entry logs for RFID: ${rfid_tag}`);

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
