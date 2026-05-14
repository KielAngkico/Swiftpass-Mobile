const express = require('express');
const router = express.Router();
const db = require('../db'); 


router.get('/total-inside/:admin_id', async (req, res) => {
  const { admin_id } = req.params;

  try {
    console.log("Fetching total inside members for admin_id:", admin_id);

    if (isNaN(admin_id)) {
      return res.status(400).json({ message: "Invalid admin_id parameter" });
    }

    const [rows] = await db.query(
      `SELECT COUNT(*) AS total_inside FROM AdminMemberLogins WHERE member_status = 'inside' AND admin_id = ?`,
      [admin_id]
    );

    console.log("Query result for total inside:", rows);
    res.json({ total_inside: rows[0].total_inside });

  } catch (error) {
    console.error("Error fetching total inside members:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
});


router.get('/:email', async (req, res) => {
  const { email } = req.params;

  try {
    console.log("Fetching profile for email:", email);
    const user = await db.getUserByEmail(email);

    if (!user) {
      return res.status(404).json({ message: 'Member not found' });
    }

const [adminRows] = await db.query(
  `SELECT gym_name FROM AdminAccounts WHERE id = ? LIMIT 1`,
  [user.admin_id]
);
const gymName = Array.isArray(adminRows) 
  ? adminRows?.[0]?.gym_name || null
  : adminRows?.gym_name || null;

    let imagePath = user.profile_image_url && user.profile_image_url.trim() !== ''
      ? user.profile_image_url.trim()
      : 'default.png';

    if (!imagePath.startsWith('uploads/members/')) {
      imagePath = `uploads/members/${imagePath}`;
    }

    res.json({
      profile: {
        member_id: user.id,
        admin_id: user.admin_id,
        full_name: user.full_name,
        created_at: user.created_at,
        profile_image_url: imagePath,
        email: user.email,
        status: user.status,
        current_balance: user.current_balance,
        session_fee: user.session_fee,
        gym_name: gymName,
      }
    });
  } catch (error) {
    console.error('Error fetching profile:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});


module.exports = router;
