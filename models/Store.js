import mongoose from 'mongoose';

const StoreSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    unique: true,
  },
  companyName: {
    type: String,
    required: [true, 'Please provide a company name'],
    maxlength: [100, 'Company name cannot be more than 100 characters'],
  },
  ownerName: {
    type: String,
    required: [true, 'Please provide owner name'],
    maxlength: [60, 'Owner name cannot be more than 60 characters'],
  },
  address: {
    type: String,
    required: [true, 'Please provide an address'],
  },
  gstNumber: {
    type: String,
    default: null,
  },
  mobileNumber: {
    type: String,
    required: [true, 'Please provide a mobile number'],
  },
  email: {
    type: String,
    required: [true, 'Please provide an email'],
  },
  website: {
    type: String,
    default: null,
  },
  logo: {
    type: String,
    default: null,
  },
  invoicePrefix: {
    type: String,
    default: 'INV',
  },
  invoiceNumber: {
    type: Number,
    default: 1,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
  updatedAt: {
    type: Date,
    default: Date.now,
  },
});

export default mongoose.models.Store || mongoose.model('Store', StoreSchema);
