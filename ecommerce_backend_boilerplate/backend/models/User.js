const mongoose = require('mongoose');

const AddressSchema = new mongoose.Schema({
  label: { type: String },
  addressLine: { type: String },
  city: { type: String },
  state: { type: String },
  pincode: { type: String }
}, { _id: false });

const UserSchema = new mongoose.Schema({
  phone: { type: String, required: true, unique: true },
  name: { type: String },
  email: { type: String },
  addresses: { type: [AddressSchema], default: [] },
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('User', UserSchema);