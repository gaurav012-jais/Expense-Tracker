require('dotenv').config();
const mongoose = require('mongoose');
const User = require('./models/User');
const Transaction = require('./models/Transaction');

const seedData = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB for seeding...');

    // Clear existing test data (optional, keep actual users safe)
    console.log('Clearing old test data...');
    await User.deleteOne({ email: 'test12345@example.com' });

    // Create Demo User
    const demoUser = await User.create({
      name: 'Test User',
      email: 'test12345@example.com',
      password: 'Password123',
      monthlyIncome: 5000
    });
    console.log('Demo user created: test12345@example.com / Password123');

    // Create Mock Transactions
    const transactions = [
      {
        userId: demoUser._id,
        merchant: 'Starbucks',
        amount: 5.50,
        category: 'Food',
        type: 'expense',
        date: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000)
      },
      {
        userId: demoUser._id,
        merchant: 'Uber',
        amount: 22.40,
        category: 'Transport',
        type: 'expense',
        date: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000)
      },
      {
        userId: demoUser._id,
        merchant: 'H&M',
        amount: 85.00,
        category: 'Shopping',
        type: 'expense',
        date: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000)
      },
      {
        userId: demoUser._id,
        merchant: 'Netflix',
        amount: 15.99,
        category: 'Entertainment',
        type: 'expense',
        date: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000)
      },
      {
        userId: demoUser._id,
        merchant: 'Salary Deposit',
        amount: 4500.00,
        category: 'Other',
        type: 'income',
        date: new Date(Date.now() - 20 * 24 * 60 * 60 * 1000)
      }
    ];

    await Transaction.insertMany(transactions);
    console.log(`Successfully seeded ${transactions.length} transactions!`);
    
    mongoose.connection.close();
    process.exit(0);
  } catch (error) {
    console.error('Seeding Error:', error);
    process.exit(1);
  }
};

seedData();
