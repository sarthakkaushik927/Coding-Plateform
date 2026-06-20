const nodemailer = require('nodemailer');
const config = require('../config');

function createTransporter() {
  if (!config.email.user || !config.email.pass) {
    throw new Error('Email credentials are not configured. Set EMAIL_USER and EMAIL_PASS.');
  }

  if (config.email.host) {
    return nodemailer.createTransport({
      host: config.email.host,
      port: config.email.port || 587,
      secure: config.email.secure,
      auth: {
        user: config.email.user,
        pass: config.email.pass
      }
    });
  }

  return nodemailer.createTransport({
    service: config.email.service,
    auth: {
      user: config.email.user,
      pass: config.email.pass
    }
  });
}

exports.sendOTP = async (email, otp) => {
  const transporter = createTransporter();
  const mailOptions = {
    from: config.email.from,
    to: email,
    subject: 'Verification OTP for Testing Platform',
    text: `Your OTP for verification is: ${otp}. It will expire in 10 minutes.`
  };

  return transporter.sendMail(mailOptions);
};

exports.sendPasswordResetOTP = async (email, otp) => {
  const transporter = createTransporter();
  const mailOptions = {
    from: config.email.from,
    to: email,
    subject: 'Password Reset OTP for Testing Platform',
    text: `Your password reset OTP is: ${otp}. It will expire in 10 minutes.`
  };

  return transporter.sendMail(mailOptions);
};
