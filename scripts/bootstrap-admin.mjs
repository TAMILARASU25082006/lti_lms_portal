#!/usr/bin/env node
import dotenv from 'dotenv';
import mongoose from 'mongoose';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables from .env.local first, fallback to .env
dotenv.config({ path: path.resolve(__dirname, '../.env.local') });
dotenv.config({ path: path.resolve(__dirname, '../.env') });

const MONGODB_URI = process.env.MONGODB_URI;

if (!MONGODB_URI) {
  console.error('\n❌ ERROR: MONGODB_URI is not defined in .env.local or .env');
  console.error('Please configure your MongoDB connection string before running the bootstrap command.\n');
  process.exit(1);
}

// User Schema Minimal Definition for Script
const UserSchema = new mongoose.Schema(
  {
    name: String,
    email: String,
    role: String,
    isSuspended: Boolean,
  },
  { timestamps: true }
);

const AuditLogSchema = new mongoose.Schema(
  {
    action: String,
    performedBy: mongoose.Schema.Types.ObjectId,
    targetType: String,
    targetId: mongoose.Schema.Types.ObjectId,
    details: mongoose.Schema.Types.Mixed,
  },
  { timestamps: true }
);

const User = mongoose.models.User || mongoose.model('User', UserSchema);
const AuditLog = mongoose.models.AuditLog || mongoose.model('AuditLog', AuditLogSchema);

async function bootstrapAdmin() {
  const targetIdentifier = process.argv[2];

  try {
    console.log('\n[Company Academy] Connecting to MongoDB...');
    await mongoose.connect(MONGODB_URI);
    console.log('✓ Connected successfully.\n');

    if (!targetIdentifier) {
      console.log('================================================================');
      console.log(' COMPANY ACADEMY - INITIAL ADMINISTRATOR BOOTSTRAP TOOL');
      console.log('================================================================');
      console.log('Usage:');
      console.log('  node scripts/bootstrap-admin.mjs <userId-or-email>\n');
      console.log('Current Registered Users in Database:');

      const users = await User.find().select('_id name email role isSuspended createdAt').lean();

      if (users.length === 0) {
        console.log('  (No users found in database yet.)');
        console.log('  Step 1: Sign in first via Google OAuth (or dev login) on http://localhost:3000/login');
        console.log('  Step 2: Run this script with your authenticated email to promote your account.\n');
      } else {
        console.table(
          users.map((u) => ({
            'ID': u._id.toString(),
            'Name': u.name,
            'Email': u.email,
            'Role': u.role,
            'Suspended': u.isSuspended ? 'YES' : 'NO',
          }))
        );
        console.log('\nTo promote any of the above users to ADMIN, run:');
        console.log(`  node scripts/bootstrap-admin.mjs ${users[0].email}\n`);
      }

      await mongoose.disconnect();
      process.exit(0);
    }

    // Search by ObjectId if valid, else search by email
    const isObjectId = mongoose.Types.ObjectId.isValid(targetIdentifier) && targetIdentifier.length === 24;
    const query = isObjectId
      ? { $or: [{ _id: targetIdentifier }, { email: targetIdentifier.toLowerCase().trim() }] }
      : { email: targetIdentifier.toLowerCase().trim() };

    const user = await User.findOne(query);

    if (!user) {
      console.error(`\n❌ User not found matching identifier: "${targetIdentifier}"`);
      console.error('Please verify the email address or MongoDB _id matches an existing authenticated user.\n');
      await mongoose.disconnect();
      process.exit(1);
    }

    if (user.role === 'ADMIN') {
      console.log(`\nℹ️ User "${user.name}" (${user.email}) is ALREADY an ADMINISTRATOR.`);
      await mongoose.disconnect();
      process.exit(0);
    }

    const previousRole = user.role;
    user.role = 'ADMIN';
    if (user.isSuspended) {
      user.isSuspended = false; // ensure not suspended
    }
    await user.save();

    // Audit log promotion
    await AuditLog.create({
      action: 'BOOTSTRAP_ADMIN_PROMOTION',
      performedBy: user._id,
      targetType: 'User',
      targetId: user._id,
      details: {
        method: 'CLI_BOOTSTRAP_SCRIPT',
        previousRole,
        promotedTo: 'ADMIN',
        timestamp: new Date().toISOString(),
      },
    });

    console.log('================================================================');
    console.log('🎉 SUCCESS: USER PROMOTED TO ADMINISTRATOR');
    console.log('================================================================');
    console.log(`  Name:   ${user.name}`);
    console.log(`  Email:  ${user.email}`);
    console.log(`  ID:     ${user._id}`);
    console.log(`  Role:   ${previousRole} ➔ ADMIN`);
    console.log('\nYou can now log in and access the full Admin Portal at:');
    console.log('  http://localhost:3000/admin\n');

    await mongoose.disconnect();
    process.exit(0);
  } catch (error) {
    console.error('\n❌ Bootstrap failed with error:', error);
    try {
      await mongoose.disconnect();
    } catch (_) {}
    process.exit(1);
  }
}

bootstrapAdmin();
