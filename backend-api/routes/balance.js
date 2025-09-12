const express = require('express');
const router = express.Router();
const db = require('../db'); 

router.get('/balance/:email', async (req, res) => {
  try {
    const email = req.params.email;
    console.log('Balance request for:', email);

    const user = await db.getUserByEmail(email); 

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.json({ balance: user.current_balance });
  } catch (error) {
    console.error('Balance error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

router.get('/subscription/:email', async (req, res) => {
  try {
    const email = req.params.email;
    const user = await db.getUserByEmail(email);

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.json({
      full_name: user.full_name,
      subscription_expiry: user.subscription_expiry,
      subscription_type: user.subscription_type,
    });
  } catch (error) {
    console.error("Subscription error:", error.message);
    res.status(500).json({ message: "Internal server error" });
  }
});



module.exports = router;
