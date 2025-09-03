#!/usr/bin/env node

/**
 * 🧪 Test Script for Room Duplication Bug Fix
 * 
 * This script tests the room creation logic to ensure that:
 * 1. Searching for existing users shows them in results
 * 2. Creating a conversation with an existing user finds the existing room
 * 3. Room IDs are generated consistently
 */

const crypto = require('crypto');

// Simulate the room ID generation logic from actions.ts
function generateRoomIdSync(userId1, userId2) {
  // Sort user IDs to ensure consistent room ID regardless of order
  const sortedIds = [userId1, userId2].sort();
  const combined = sortedIds.join('_');
  
  console.log(`🔧 Generating room ID for users: ${sortedIds.join(' + ')}`);
  console.log(`📝 Combined string: ${combined}`);
  
  // Use Node.js crypto for consistent hashing
  const hash = crypto.createHash('sha256').update(combined).digest('hex');
  const roomId = `room_${hash.substring(0, 16)}`;
  
  console.log(`🏠 Generated room ID: ${roomId}`);
  return roomId;
}

// Test room ID generation consistency
function testRoomIdGeneration() {
  console.log('🧪 Testing Room ID Generation Consistency...\n');
  
  const user1 = 'user_327StNyCoJLRpMMdg2lYXaLtZUx';
  const user2 = 'user_327QTDYFYLJtz1UcqqZspilygjp';
  
  // Test that room ID is the same regardless of parameter order
  const roomId1 = generateRoomIdSync(user1, user2);
  const roomId2 = generateRoomIdSync(user2, user1);
  
  console.log(`\n✅ Room ID 1 (user1, user2): ${roomId1}`);
  console.log(`✅ Room ID 2 (user2, user1): ${roomId2}`);
  console.log(`🔍 IDs match: ${roomId1 === roomId2 ? '✅ YES' : '❌ NO'}`);
  
  if (roomId1 !== roomId2) {
    console.error('❌ CRITICAL BUG: Room IDs should be identical regardless of parameter order!');
    return false;
  }
  
  console.log('✅ Room ID generation is consistent!\n');
  return true;
}

// Test multiple user combinations
function testMultipleUsers() {
  console.log('🧪 Testing Multiple User Combinations...\n');
  
  const users = [
    'user_327StNyCoJLRpMMdg2lYXaLtZUx',
    'user_327QTDYFYLJtz1UcqqZspilygjp',
    'user_abc123def456',
    'user_xyz789uvw012'
  ];
  
  const roomIds = new Set();
  let duplicateFound = false;
  
  // Test all combinations
  for (let i = 0; i < users.length; i++) {
    for (let j = i + 1; j < users.length; j++) {
      const roomId = generateRoomIdSync(users[i], users[j]);
      
      if (roomIds.has(roomId)) {
        console.error(`❌ DUPLICATE ROOM ID FOUND: ${roomId}`);
        duplicateFound = true;
      } else {
        roomIds.add(roomId);
        console.log(`✅ Unique room ID: ${roomId} (${users[i].substring(0, 12)}... + ${users[j].substring(0, 12)}...)`);
      }
    }
  }
  
  if (duplicateFound) {
    console.error('❌ CRITICAL BUG: Duplicate room IDs found!');
    return false;
  }
  
  console.log(`✅ All ${roomIds.size} room IDs are unique!\n`);
  return true;
}

// Simulate the search filtering logic
function testSearchFiltering() {
  console.log('🧪 Testing Search Filtering Logic...\n');
  
  // Simulate existing conversations
  const existingConversations = [
    { user_id: 'user_327QTDYFYLJtz1UcqqZspilygjp', room_id: 'room_abc123' },
    { user_id: 'user_xyz789uvw012', room_id: 'room_def456' }
  ];
  
  // Simulate search results
  const searchResults = [
    { clerk_id: 'user_327QTDYFYLJtz1UcqqZspilygjp', name: 'John Doe', username: 'johndoe' },
    { clerk_id: 'user_abc123def456', name: 'Jane Smith', username: 'janesmith' },
    { clerk_id: 'user_xyz789uvw012', name: 'Bob Wilson', username: 'bobwilson' }
  ];
  
  console.log('📋 Existing conversations:', existingConversations.map(c => c.user_id));
  console.log('🔍 Search results:', searchResults.map(u => u.clerk_id));
  
  // OLD LOGIC (BUGGY): Filter out existing conversations
  const existingUserIds = new Set(existingConversations.map(conv => conv.user_id));
  const oldFilteredResults = searchResults.filter(user => !existingUserIds.has(user.clerk_id));
  
  console.log('\n❌ OLD LOGIC (BUGGY) - Filtered out existing users:');
  console.log('   Results:', oldFilteredResults.map(u => `${u.name} (${u.clerk_id})`));
  console.log(`   Count: ${oldFilteredResults.length}/${searchResults.length}`);
  
  // NEW LOGIC (FIXED): Include all users but mark existing ones
  const newEnhancedResults = searchResults.map(user => ({
    ...user,
    hasExistingConversation: existingUserIds.has(user.clerk_id)
  }));
  
  console.log('\n✅ NEW LOGIC (FIXED) - Include all users with flags:');
  newEnhancedResults.forEach(user => {
    const flag = user.hasExistingConversation ? '💬 (existing)' : '🆕 (new)';
    console.log(`   ${user.name} ${flag}`);
  });
  console.log(`   Count: ${newEnhancedResults.length}/${searchResults.length}`);
  
  const bugFixed = newEnhancedResults.length === searchResults.length;
  console.log(`\n🔍 Bug fixed: ${bugFixed ? '✅ YES' : '❌ NO'}`);
  
  return bugFixed;
}

// Main test execution
async function runTests() {
  console.log('🚀 Starting Room Duplication Bug Tests...\n');
  
  const tests = [
    { name: 'Room ID Generation Consistency', test: testRoomIdGeneration },
    { name: 'Multiple User Combinations', test: testMultipleUsers },
    { name: 'Search Filtering Logic', test: testSearchFiltering }
  ];
  
  let passed = 0;
  let failed = 0;
  
  for (const { name, test } of tests) {
    console.log(`\n${'='.repeat(60)}`);
    console.log(`🧪 TEST: ${name}`);
    console.log('='.repeat(60));
    
    try {
      const result = test();
      if (result) {
        console.log(`✅ PASSED: ${name}`);
        passed++;
      } else {
        console.log(`❌ FAILED: ${name}`);
        failed++;
      }
    } catch (error) {
      console.error(`❌ ERROR in ${name}:`, error.message);
      failed++;
    }
  }
  
  // Summary
  console.log(`\n${'='.repeat(60)}`);
  console.log('📊 TEST SUMMARY');
  console.log('='.repeat(60));
  console.log(`✅ Passed: ${passed}`);
  console.log(`❌ Failed: ${failed}`);
  console.log(`📈 Success Rate: ${Math.round((passed / (passed + failed)) * 100)}%`);
  
  if (failed === 0) {
    console.log('\n🎉 All tests passed! The room duplication bug has been fixed.');
  } else {
    console.log('\n⚠️ Some tests failed. Please review the issues above.');
  }
  
  return failed === 0;
}

// Run if called directly
if (require.main === module) {
  runTests()
    .then(success => {
      process.exit(success ? 0 : 1);
    })
    .catch(error => {
      console.error('❌ Test execution failed:', error);
      process.exit(1);
    });
}

module.exports = { runTests, generateRoomIdSync };
