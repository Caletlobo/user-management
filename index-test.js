const mongoose = require('mongoose');
require('dotenv').config();
const User = require('./models/User');

mongoose.connect(process.env.MONGO_URI)
  .then(async () => {
    console.log('✅ Connected to MongoDB');

    // Clear existing data
    await User.deleteMany({});
    console.log('🗑️  Cleared existing data');

    // Insert sample data
    await User.insertMany([
      {
        name: 'Alice',
        email: 'alice@gmail.com',
        age: 25,
        hobbies: ['reading', 'painting'],
        bio: 'loves books and art',
        userId: 'u001'
      },
      {
        name: 'Bob',
        email: 'bob@gmail.com',
        age: 30,
        hobbies: ['gaming', 'coding'],
        bio: 'plays games and writes code',
        userId: 'u002'
      },
      {
        name: 'Carol',
        email: 'carol@gmail.com',
        age: 22,
        hobbies: ['reading', 'cooking'],
        bio: 'chef at heart loves food',
        userId: 'u003'
      }
    ]);
    console.log('✅ Sample data inserted\n');

    // ── Test 1: Single Field Index on name ──
    const single = await User.find({ name: 'Alice' }).explain('executionStats');
    console.log('📌 Single Index (name):');
    console.log('   Keys Examined  :', single.executionStats.totalKeysExamined);
    console.log('   Docs Examined  :', single.executionStats.totalDocsExamined);
    console.log('   Time (ms)      :', single.executionStats.executionTimeMillis);
    console.log('   Index Used     :', single.queryPlanner.winningPlan.inputStage?.indexName || 'IXSCAN');

    // ── Test 2: Compound Index on email + age ──
    const compound = await User.find({ email: 'bob@gmail.com', age: 30 }).explain('executionStats');
    console.log('\n📌 Compound Index (email + age):');
    console.log('   Keys Examined  :', compound.executionStats.totalKeysExamined);
    console.log('   Docs Examined  :', compound.executionStats.totalDocsExamined);
    console.log('   Time (ms)      :', compound.executionStats.executionTimeMillis);

    // ── Test 3: Multikey Index on hobbies ──
    const multikey = await User.find({ hobbies: 'reading' }).explain('executionStats');
    console.log('\n📌 Multikey Index (hobbies):');
    console.log('   Keys Examined  :', multikey.executionStats.totalKeysExamined);
    console.log('   Docs Examined  :', multikey.executionStats.totalDocsExamined);
    console.log('   Time (ms)      :', multikey.executionStats.executionTimeMillis);

    console.log('\n✅ Index testing complete!');
    mongoose.disconnect();
    console.log('🔌 Disconnected from MongoDB');
  })
  .catch(err => console.log('❌ Error:', err));
