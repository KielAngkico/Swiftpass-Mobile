const express = require('express');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const db = require('../db');
const crypto = require('crypto');
const nodemailer = require('nodemailer');
const authMiddleware = require("../middleware/authMiddleware");

const router = express.Router();
require('dotenv').config();

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: { user: process.env.EMAIL_USER, pass: process.env.EMAIL_PASS },
});

const isWithinOtpWindow = (lastOtpVerified) => {
  if (!lastOtpVerified) return false;
  const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
  return new Date(lastOtpVerified) > sevenDaysAgo;
};

router.post('/login', async (req, res) => {
  const { email, password, deviceId } = req.body;

  try {
    const user = await db.getUserByEmail(email);
    if (!user) return res.status(401).json({ message: 'Email not found' });

    if (password) {
      if (!isWithinOtpWindow(user.lastOtpVerified)) {
        return res.status(401).json({
          message: 'Password access expired. Please verify with OTP.',
          requiresOTP: true
        });
      }
      const isMatch = await bcrypt.compare(password, user.password);
      if (!isMatch) return res.status(401).json({ message: 'Invalid password' });

      const assessment = await db.query(
        'SELECT id FROM InitialAssessment WHERE member_id = ? LIMIT 1',
        [user.id]
      );
      const hasInitialAssessment = assessment.length > 0;

      const token = jwt.sign({ id: user.id, email: user.email }, process.env.JWT_SECRET, { expiresIn: '2h' });

      return res.json({
        token,
        user: {
          member_id: user.id,
          full_name: user.full_name,
          email: user.email,
          rfid_tag: user.rfid_tag,
          current_balance: user.current_balance,
          status: user.status,
          admin_id: user.admin_id,
          system_type: user.system_type,
          hasInitialAssessment,
        },
      });
    }

    if (isWithinOtpWindow(user.lastOtpVerified)) {
      return res.json({
        requiresPassword: true,
        message: 'Enter your 4-digit password',
        email: user.email,
        full_name: user.full_name
      });
    }
    const otp = crypto.randomInt(100000, 999999).toString();
    await db.saveOtp(user.id, otp, 10, 'login');

    await transporter.sendMail({
      from: process.env.EMAIL_USER,
      to: user.email,
      subject: 'SwiftPass Login OTP',
      text: `Your login OTP is ${otp}. It expires in 10 minutes.`,
    });

    return res.json({ requiresOTP: true, message: 'OTP sent to email' });

  } catch (err) {
    console.error('Login error:', err.message);
    res.status(500).json({ message: 'Server error' });
  }
});

router.post('/verify-otp', async (req, res) => {
  const { email, otp, deviceId } = req.body;

  try {
    const user = await db.getUserByEmail(email);
    if (!user) return res.status(401).json({ message: 'Email not found' });

    const validOtp = await db.verifyOtp(user.id, otp, 'login');
    if (!validOtp) return res.status(400).json({ message: 'Invalid or expired OTP' });
    await db.query(
      'UPDATE MembersAccounts SET lastOtpVerified = NOW() WHERE id = ?',
      [user.id]
    );

    await db.trustDevice(user.id, deviceId);

    const assessment = await db.query(
      'SELECT id FROM InitialAssessment WHERE member_id = ? LIMIT 1',
      [user.id]
    );
    const hasInitialAssessment = assessment.length > 0;

    const token = jwt.sign({ id: user.id, email: user.email }, process.env.JWT_SECRET, { expiresIn: '2h' });

    res.json({
      token,
      user: {
        member_id: user.id,
        full_name: user.full_name,
        email: user.email,
        rfid_tag: user.rfid_tag,
        current_balance: user.current_balance,
        status: user.status,
        admin_id: user.admin_id,
        system_type: user.system_type,
        hasInitialAssessment,
      },
    });
  } catch (err) {
    console.error('OTP verification error:', err.message);
    res.status(500).json({ message: 'Server error' });
  }
});

router.post('/forgot-password', async (req, res) => {
  const { email } = req.body;

  try {
    const user = await db.getUserByEmail(email);
    if (!user) return res.status(401).json({ message: 'Email not found' });

    const otp = crypto.randomInt(100000, 999999).toString();
    await db.saveOtp(user.id, otp, 10, 'reset');

    await transporter.sendMail({
      from: process.env.EMAIL_USER,
      to: user.email,
      subject: 'SwiftPass Password Reset OTP',
      text: `Your password reset OTP is ${otp}. It expires in 10 minutes.`,
    });

    res.json({ requiresOTP: true, message: 'Password reset OTP sent to your email' });
  } catch (err) {
    console.error('Forgot password error:', err.message);
    res.status(500).json({ message: 'Server error' });
  }
});

router.post('/verify-forgot-otp', async (req, res) => {
  const { email, otp } = req.body;
  if (!email || !otp) return res.status(400).json({ message: 'Email and OTP are required' });

  try {
    const user = await db.getUserByEmail(email);
    if (!user) return res.status(401).json({ message: 'Email not found' });

    const validOtp = await db.verifyOtp(user.id, otp, 'reset');
    if (!validOtp) return res.status(400).json({ message: 'Invalid or expired OTP' });

    res.json({ success: true, message: 'OTP verified successfully' });
  } catch (err) {
    console.error('Verify forgot OTP error:', err.message);
    res.status(500).json({ message: 'Server error' });
  }
});

router.post('/reset-password', async (req, res) => {
  const { email, otp, newPassword } = req.body;
  if (!email || !otp || !newPassword) return res.status(400).json({ message: 'Email, OTP, and new password required' });

  try {
    const user = await db.getUserByEmail(email);
    if (!user) return res.status(401).json({ message: 'Email not found' });

    const validOtp = await db.verifyOtp(user.id, otp, 'reset');
    if (!validOtp) return res.status(400).json({ message: 'Invalid or expired OTP' });

    const hashedPassword = await bcrypt.hash(newPassword, 10);
    await db.query('UPDATE MembersAccounts SET password = ? WHERE id = ?', [hashedPassword, user.id]);

    res.json({ success: true, message: 'Password reset successful. You can now log in with your new password.' });
  } catch (err) {
    console.error('Reset password error:', err.message);
    res.status(500).json({ message: 'Server error' });
  }
});

router.post("/verify-current-pin", authMiddleware, async (req, res) => {
  const { currentPassword } = req.body;
  const userId = req.user.id;

  if (!currentPassword || currentPassword.length !== 4) {
    return res.status(400).json({ message: "Current PIN is required and must be 4 digits" });
  }

  try {
    const [user] = await db.query("SELECT password FROM MembersAccounts WHERE id = ?", [userId]);
    if (!user) return res.status(404).json({ message: "User not found" });

    const isMatch = await bcrypt.compare(currentPassword, user.password);
    if (!isMatch) return res.status(400).json({ success: false, message: "Current PIN is incorrect" });

    res.json({ success: true, message: "Current PIN verified" });
  } catch (err) {
    console.error("Verify current PIN error:", err);
    res.status(500).json({ message: "Server error" });
  }
});


router.post("/change-password", authMiddleware, async (req, res) => {
  const { newPassword } = req.body; 
  const userId = req.user.id;

  if (!newPassword || newPassword.length !== 4) {
    return res.status(400).json({ message: "New PIN must be 4 digits" });
  }

  try {
    const hashed = await bcrypt.hash(newPassword, 10);
    await db.query("UPDATE MembersAccounts SET password = ? WHERE id = ?", [hashed, userId]);

    res.json({ success: true, message: "PIN updated successfully" });
  } catch (err) {
    console.error("Change PIN error:", err);
    res.status(500).json({ message: "Server error" });
  }
});

module.exports = router;