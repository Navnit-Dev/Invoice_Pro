import { NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import User from '@/models/User';
import Store from '@/models/Store';

export async function POST(request) {
  try {
    const body = await request.json();
    const { name, email, password, companyName, ownerName, address, mobileNumber } = body;

    // Validation
    if (!name || !email || !password || !companyName || !ownerName || !address || !mobileNumber) {
      return NextResponse.json(
        { error: 'Please provide all required fields' },
        { status: 400 }
      );
    }

    await connectDB();

    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return NextResponse.json(
        { error: 'User already exists with this email' },
        { status: 400 }
      );
    }

    // Create user
    const user = await User.create({
      name,
      email,
      password,
    });

    // Create store for the user
    await Store.create({
      user: user._id,
      companyName,
      ownerName,
      address,
      mobileNumber,
      email,
    });

    return NextResponse.json(
      { message: 'User registered successfully', userId: user._id },
      { status: 201 }
    );
  } catch (error) {
    console.error('Registration error:', error);
    return NextResponse.json(
      { error: 'Something went wrong during registration' },
      { status: 500 }
    );
  }
}
