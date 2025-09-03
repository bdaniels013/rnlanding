#!/usr/bin/env node

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('🚀 Setting up Rich Nick Offers System...\n');

// Check if .env file exists
const envPath = path.join(process.cwd(), '.env');
if (!fs.existsSync(envPath)) {
  console.log('📝 Creating .env file from template...');
  const templatePath = path.join(process.cwd(), 'env.template');
  if (fs.existsSync(templatePath)) {
    fs.copyFileSync(templatePath, envPath);
    console.log('✅ .env file created. Please update with your actual values.\n');
  } else {
    console.log('❌ env.template not found. Please create .env manually.\n');
  }
} else {
  console.log('✅ .env file already exists.\n');
}

// Generate Prisma client
try {
  console.log('🔄 Generating Prisma client...');
  execSync('npx prisma generate', { stdio: 'inherit' });
  console.log('✅ Prisma client generated.\n');
} catch (error) {
  console.error('❌ Failed to generate Prisma client:', error.message);
  process.exit(1);
}

// Check if database is available
console.log('🔄 Checking database connection...');
try {
  execSync('npx prisma db push', { stdio: 'inherit' });
  console.log('✅ Database schema synchronized.\n');
} catch (error) {
  console.error('❌ Database connection failed. Please check your DATABASE_URL in .env');
  console.error('💡 You can use services like Neon, Supabase, or Railway for PostgreSQL hosting.\n');
  process.exit(1);
}

// Seed database
try {
  console.log('🌱 Seeding database with initial data...');
  execSync('npm run db:seed', { stdio: 'inherit' });
  console.log('✅ Database seeded successfully.\n');
} catch (error) {
  console.error('❌ Failed to seed database:', error.message);
  console.log('💡 You can run "npm run db:seed" manually later.\n');
}

console.log('🎉 Setup completed successfully!');
console.log('\n📋 Next Steps:');
console.log('1. Update your .env file with actual API keys');
console.log('2. Configure PayPal sandbox/live credentials');
console.log('3. Set up SendGrid for email notifications');
console.log('4. Set up Twilio for SMS notifications');
console.log('5. Run "npm run dev" to start the development server');
console.log('\n🔐 Default Admin Login:');
console.log('Email: admin@richhnick.com');
console.log('Password: admin123');
console.log('\n💡 Access admin dashboard at: /admin');
console.log('💡 API documentation available in the README');
