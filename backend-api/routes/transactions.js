const express = require('express');
const router = express.Router();
const { pool } = require('../db');

router.get('/activity-log', async (req, res) => {
  console.log('Query params:', req.query);

const { member_id, rfid_tag, system_type } = req.query;

  if (!member_id || !system_type) {
    return res.status(400).json({ message: 'member_id and system_type are required' });
  }

  try {
    const finalList = [];

    if (system_type === 'prepaid_entry') {
      // ✅ Get tap-ups and new member activations
const [tapUps] = await pool.query(
  `SELECT id, amount, balance_added, timestamp, transaction_type, subscription_type 
   FROM AdminMembersTransactions 
   WHERE member_id = ? 
     AND transaction_type IN ('new_member', 'top_up', 'rfid_replacement')`,
  [member_id]
);

tapUps.forEach(row => {
  let label = '';
  let displayAmount = Number(row.amount);

  if (row.transaction_type === 'new_member') {
    label = 'Membership Fee';
  } 
  else if (row.transaction_type === 'rfid_replacement') {
    label = 'RFID Replacement';
  } 
  else if (row.transaction_type === 'top_up') {
    label = row.subscription_type
      ? `Top Up - ${row.subscription_type}`
      : 'Top Up';

    // show credited balance instead of payment amount
    displayAmount = Number(row.balance_added || row.amount);
  }

  finalList.push({
    transaction_id: row.id,
    label,
    amount: displayAmount,
    timestamp: row.timestamp ? row.timestamp.toString().replace('T', ' ').replace('Z', '') + '+08:00' : null,
    subscription_type: row.subscription_type || null,
    transaction_type: row.transaction_type,
  });
});

// Session deductions from AdminMembersTransactions (new cron-based system)
      const [entries] = await pool.query(
        `SELECT 
           t.id,
           t.amount,
           t.timestamp,
           r.id AS refund_request_id,
           r.status AS refund_status
         FROM AdminMembersTransactions t
         LEFT JOIN RefundRequests r ON r.member_transaction_id = t.id
         WHERE t.member_id = ?
           AND t.transaction_type = 'session_deduction'`,
        [member_id]
      );

      entries.forEach(row => {
        finalList.push({
          transaction_id: row.id,
          label: 'Gym Entry',
          amount: Number(row.amount),
          timestamp: row.timestamp,
          transaction_type: 'gym_entry',
          refund_status: row.refund_status || null,
          refund_request_id: row.refund_request_id || null,
        });
      });

    } else if (system_type === 'subscription') {
      // ✅ Get subscriptions
const [subs] = await pool.query(
        `SELECT amount, timestamp, transaction_type, subscription_type 
         FROM AdminMembersTransactions 
         WHERE member_id = ? 
           AND transaction_type IN ('new_member', 'renew_subscription', 'rfid_replacement')`,
        [member_id]
      );

subs.forEach(row => {
  const label = row.transaction_type === 'new_member' ? 'Membership Fee'
    : row.transaction_type === 'rfid_replacement' ? 'RFID Replacement'
    : row.subscription_type ? `Subscription Renewal: ${row.subscription_type}` : 'Subscription Renewal';

  finalList.push({
    transaction_id: null,
    label,
    amount: Number(row.amount),
    timestamp: row.timestamp,
    subscription_type: row.subscription_type || null,
    transaction_type: row.transaction_type,
  });
});

    } else {
      return res.status(400).json({ message: 'Invalid system_type' });
    }

    // ✅ Sort by most recent first
    finalList.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));

console.log(`✅ Returning ${finalList.length} transactions for member_id: ${member_id}`);    return res.json({ transactions: finalList });

  } catch (error) {
    console.error('SQL error:', error);
    return res.status(500).json({ message: 'Failed to fetch unified activity log' });
  }
});

module.exports = router;