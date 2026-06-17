const User = require('../models/user');
const OTP = require('../models/otp');
const emailService = require('../services/emailService');
const jwt = require('jsonwebtoken');

// 1. Signup - Sends OTP
exports.signup = async (req, res) => {
  try {
    const { name, email } = req.body;

    // Check if user already exists
    let user = await User.findOne({ email });
    if (user && user.isVerified) {
      return res.status(400).json({ message: 'User already exists and is verified. Please login.' });
    }

    // Generate 6-digit OTP
    const otpCode = Math.floor(100000 + Math.random() * 900000).toString();

    // Store OTP in DB (upsert if exists)
    await OTP.findOneAndUpdate(
      { email }, 
      { otp: otpCode }, 
      { upsert: true, returnDocument: 'after' }
    );

    // Send Email
    await emailService.sendOTP(email, otpCode);

    res.json({ message: 'OTP sent to your email.' });
  } catch (error) {
    console.error('Signup Error:', error);
    res.status(500).json({ message: error.message });
  }
};

// 2. Verify OTP and Finish Registration
exports.verifyOTP = async (req, res) => {
  try {
    const { name, email, otp } = req.body;

    const otpRecord = await OTP.findOne({ email, otp });
    if (!otpRecord) {
      return res.status(400).json({ message: 'Invalid or expired OTP.' });
    }

    // Create or Update User
    let user = await User.findOne({ email });
    if (!user) {
      user = new User({ name, email, isVerified: true });
    } else {
      user.isVerified = true;
      user.name = name; // Update name just in case
    }
    await user.save();

    // Delete OTP after verification
    await OTP.deleteOne({ email });

    // Generate JWT
    const token = jwt.sign(
      { id: user._id, role: user.role }, 
      process.env.JWT_SECRET, 
      { expiresIn: '1d' }
    );

    res.json({ message: 'Verification successful', token, user });
  } catch (error) {
    console.error('Verify OTP Error:', error);
    res.status(500).json({ message: error.message });
  }
};

// 3. Resend OTP
exports.resendOTP = async (req, res) => {
  try {
    const { email } = req.body;

    // Check if user exists (should exist if they are on verify page)
    const otpRecord = await OTP.findOne({ email });
    if (!otpRecord) {
      return res.status(404).json({ message: 'No active verification session found. Please signup again.' });
    }

    const otpCode = Math.floor(100000 + Math.random() * 900000).toString();
    
    // Update OTP in DB
    otpRecord.otp = otpCode;
    otpRecord.createdAt = Date.now(); // Reset expiry timer
    await otpRecord.save();

    // Send Email
    await emailService.sendOTP(email, otpCode);

    res.json({ message: 'OTP resent to your email.' });
  } catch (error) {
    console.error('Resend OTP Error:', error);
    res.status(500).json({ message: error.message });
  }
};

// 4. Login - Simple OTP-based login (can be expanded)
exports.login = async (req, res) => {
  try {
    const { email } = req.body;
    const user = await User.findOne({ email });
    
    if (!user || !user.isVerified) {
      return res.status(404).json({ message: 'User not found or not verified.' });
    }

    // In a real app, you might want to send an OTP for login too.
    // For now, we'll allow login if user exists.
    const token = jwt.sign(
      { id: user._id, role: user.role }, 
      process.env.JWT_SECRET, 
      { expiresIn: '1d' }
    );

    res.json({ token, user });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
