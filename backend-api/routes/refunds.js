const express = require('express');
const router = express.Router();
const { pool } = require('../db');

router.post('/refunds/request', async (req, res) => {
  const { member_id, admin_id, member_transaction_id, amount, reason } = req.body;

  if (!member_id || !admin_id || !member_transaction_id || !amount) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  try {
    const [txnRows] = await pool.query(
      `SELECT id, transaction_type, amount 
       FROM AdminMembersTransactions 
       WHERE id = ? AND member_id = ?
       LIMIT 1`,
      [member_transaction_id, member_id]
    );

    if (txnRows.length === 0) {
      return res.status(404).json({ error: 'Transaction not found' });
    }

    if (txnRows[0].transaction_type !== 'session_deduction') {
      return res.status(400).json({ error: 'Only session deductions can be refunded' });
    }

    const [existingRows] = await pool.query(
      `SELECT id FROM RefundRequests 
       WHERE member_transaction_id = ?
       LIMIT 1`,
      [member_transaction_id]
    );

    if (existingRows.length > 0) {
      return res.status(400).json({ error: 'A refund request already exists for this transaction' });
    }

    const [result] = await pool.query(
      `INSERT INTO RefundRequests 
       (member_id, admin_id, member_transaction_id, amount, reason, status, requested_at)
       VALUES (?, ?, ?, ?, ?, 'pending', NOW())`,
      [member_id, admin_id, member_transaction_id, Math.abs(amount), reason || null]
    );

    return res.status(201).json({
      message: 'Refund request submitted successfully',
      refund_id: result.insertId
    });

  } catch (err) {
    console.error('Refund request error:', err);
    return res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;