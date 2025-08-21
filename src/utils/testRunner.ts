#!/usr/bin/env node

/**
 * CLI Test Runner for Dead Hand Delivery System
 * Usage: npx ts-node src/utils/testRunner.ts [test-type]
 */

import dotenv from 'dotenv';
dotenv.config();

import DeliveryTestScript from './DeliveryTestScript';

async function main() {
  const args = process.argv.slice(2);
  const testType = args[0];
  
  console.log('🧪 Dead Hand Delivery System Test Runner');
  console.log('=======================================\n');

  try {
    switch (testType) {
      case 'channels':
        console.log('🔍 Testing delivery channels...\n');
        const channelResults = await DeliveryTestScript.testChannels();
        console.log('\n📊 Results:');
        console.log(`Email: ${channelResults.email ? '✅ Working' : '❌ Failed'}`);
        console.log(`SMS: ${channelResults.sms ? '✅ Working' : '❌ Failed'}`);
        break;

      case 'email':
        const email = args[1];
        if (!email) {
          console.log('❌ Please provide an email address: npm run test email your@email.com');
          process.exit(1);
        }
        await DeliveryTestScript.sendTestEmail(email);
        break;

      case 'sms':
        const phone = args[1];
        if (!phone) {
          console.log('❌ Please provide a phone number: npm run test sms +1234567890');
          process.exit(1);
        }
        await DeliveryTestScript.sendTestSMS(phone);
        break;

      case 'scheduled':
        await DeliveryTestScript.checkScheduledNotes();
        break;

      case 'pipeline':
        const userId = args[1] || 'test-user';
        const testEmail = args[2];
        if (!testEmail) {
          console.log('❌ Please provide user ID and email: npm run test pipeline userId your@email.com');
          process.exit(1);
        }
        await DeliveryTestScript.testDeliveryPipeline(userId, testEmail);
        break;

      case 'menu':
      default:
        await DeliveryTestScript.runInteractiveTest();
        console.log('\nAvailable commands:');
        console.log('npx ts-node src/utils/testRunner.ts channels');
        console.log('npx ts-node src/utils/testRunner.ts email your@email.com');
        console.log('npx ts-node src/utils/testRunner.ts sms +1234567890');
        console.log('npx ts-node src/utils/testRunner.ts scheduled');
        console.log('npx ts-node src/utils/testRunner.ts pipeline userId your@email.com');
        break;
    }

    console.log('\n✅ Test completed successfully!');
    process.exit(0);

  } catch (error) {
    console.error('\n❌ Test failed:', error);
    process.exit(1);
  }
}

// Handle uncaught errors
process.on('uncaughtException', (error) => {
  console.error('💥 Uncaught Exception:', error);
  process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('💥 Unhandled Rejection at:', promise, 'reason:', reason);
  process.exit(1);
});

// Run the main function
main();
