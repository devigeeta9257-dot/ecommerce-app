const Otp = require('../models/Otp');
const User = require('../models/User');
const jwt = require('jsonwebtoken');
const axios = require('axios');
const twilio = require('twilio');

const OTP_EXPIRY_MINUTES = parseInt(process.env.OTP_EXPIRY_MINUTES || '5', 10);

function generateOtp(length = 6) {
  let otp = '';
  for (let i = 0; i < length; i++) otp += Math.floor(Math.random() * 10);
  return otp;
}

async function sendSmsViaProvider(phone, message) {
  const provider = (process.env.SMS_PROVIDER || 'twilio').toLowerCase();
  if (provider === 'twilio') {
    const client = twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);
    return client.messages.create({ body: message, from: process.env.TWILIO_FROM, to: phone });
  } else if (provider === 'msg91') {
    const url = `https://api.msg91.com/api/v5/flow/`; // adjust per your flow
    const headers = { 'accept': 'application/json', 'authkey': process.env.MSG91_AUTH_KEY };
    return axios.post(url, { to: [phone], sender: process.env.MSG91_SENDER, message: message }, { headers });
  } else {
    throw new Error('Unknown SMS provider');
  }
}

exports.sendOtp = async (req, res) => {
  try {
    const { phone } = req.body;
    if (!phone) return res.status(400).json({ error: 'Phone number is required' });

    const otpCode = generateOtp(6);
    const expiresAt = new Date(Date.now() + OTP_EXPIRY_MINUTES * 60 * 1000);

    await Otp.create({ phone, otp: otpCode, expiresAt });

    const msg = `Your verification code is ${otpCode}. It expires in ${OTP_EXPIRY_MINUTES} minutes.`;
    await sendSmsViaProvider(phone, msg);

    return res.json({ ok: true, message: 'OTP sent' });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Failed to send OTP' });
  }
};

exports.verifyOtp = async (req, res) => {
  try {
    const { phone, otp } = req.body;
    if (!phone || !otp) return res.status(400).json({ error: 'Phone and OTP required' });

    const record = await Otp.findOne({ phone, otp, used: false }).sort({ createdAt: -1 });
    if (!record) return res.status(400).json({ error: 'Invalid OTP' });
    if (record.expiresAt < new Date()) return res.status(400).json({ error: 'OTP expired' });

    record.used = true;
    await record.save();

    let user = await User.findOne({ phone });
    if (!user) user = await User.create({ phone });

    const token = jwt.sign({ userId: user._id }, process.env.JWT_SECRET || 'secret', { expiresIn: '30d' });
    return res.json({ ok: true, token, user });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'OTP verification failed' });
  }
};