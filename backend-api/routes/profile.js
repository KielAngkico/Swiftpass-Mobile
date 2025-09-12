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

    let imagePath = user.profile_image_url && user.profile_image_url.trim() !== ''
      ? user.profile_image_url.trim()
      : 'default.png';

    if (!imagePath.startsWith('uploads/members/')) {
      imagePath = `uploads/members/${imagePath}`;
    }

    console.log("Profile data retrieved:", user);
    res.json({
      profile: {
        full_name: user.full_name,
        created_at: user.created_at,
        profile_image_url: imagePath,
        email: user.email,
      }
    });
  } catch (error) {
    console.error('Error fetching profile:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});



module.exports = router;
