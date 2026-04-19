import { compare } from 'bcryptjs';
import connectDB from './mongodb';
import User from '@/models/User';

export async function verifyCredentials(email, password) {
  await connectDB();
  
  const user = await User.findOne({ email }).select('+password');
  
  if (!user) {
    throw new Error('No user found with this email');
  }
  
  const isValid = await compare(password, user.password);
  
  if (!isValid) {
    throw new Error('Invalid password');
  }
  
  return {
    id: user._id.toString(),
    email: user.email,
    name: user.name,
    image: user.image,
  };
}
