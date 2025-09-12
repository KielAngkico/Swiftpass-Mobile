const express = require('express');
const router = express.Router();
const { pool } = require('../db');


router.get('/activity-log', async (req, res) => {
  console.log('Query params:', req.query);

  const { rfid_tag, system_type } = req.query;

  if (!rfid_tag || !system_type) {
    return res.status(400).json({ message: 'rfid_tag and system_type are required' });
  }

  try {
    const finalList = [];

    if (system_type === 'prepaid_entry') {
      const [tapUps] = await pool.query(
        `SELECT amount, timestamp, transaction_type, subscription_type 
         FROM AdminMembersTransactions 
         WHERE rfid_tag = ? 
           AND transaction_type IN ('new_member', 'top_up')`,
        [rfid_tag]
      );

      tapUps.forEach(row => {
        finalList.push({
          label: row.transaction_type === 'new_member' ? 'Activation' : 'Tap Up',
          amount: Number(row.amount),
          timestamp: row.timestamp,
          subscription_type: row.subscription_type || null,
        });
      });

      const [entries] = await pool.query(
        `SELECT deducted_amount AS amount, entry_time AS timestamp 
         FROM AdminEntryLogs 
         WHERE rfid_tag = ?`,
        [rfid_tag]
      );

      entries.forEach(row => {
        finalList.push({
          label: 'Gym Entry',
          amount: -Number(row.amount),
          timestamp: row.timestamp,
        });
      });

    } else if (system_type === 'subscription') {

      const [subs] = await pool.query(
        `SELECT amount, timestamp, transaction_type, subscription_type 
         FROM AdminMembersTransactions 
         WHERE rfid_tag = ? 
           AND transaction_type IN ('new_subscription', 'renew_subscription')`,
        [rfid_tag]
      );

      subs.forEach(row => {
        const labelBase = row.transaction_type === 'new_subscription' ? 'Activation' : 'Subscription';
        const label = row.subscription_type ? `${labelBase}: ${row.subscription_type}` : labelBase;

        finalList.push({
          label,
          amount: Number(row.amount),
          timestamp: row.timestamp,
          subscription_type: row.subscription_type || null
        });
      });

    } else {
      return res.status(400).json({ message: 'Invalid system_type' });
    }
    finalList.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));

    return res.json({ transactions: finalList });
  } catch (error) {
    console.error('SQL error:', error);
    return res.status(500).json({ message: 'Failed to fetch unified activity log' });
  }
});

module.exports = router;
