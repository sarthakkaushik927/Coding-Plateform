const mongoose = require('mongoose');
const Test = require('./models/test');
require('dotenv').config();

const seedDatabase = async () => {
  try {
    const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/coding-platform';
    await mongoose.connect(MONGODB_URI);
    console.log('Connected to MongoDB for seeding...');

    // Clear existing tests to avoid duplicates during development
    await Test.deleteMany({});

    const demoTest = new Test({
      _id: new mongoose.Types.ObjectId('65f1a2b3c4d5e6f7a8b9c0d1'), // Fixed ID for demo testing
      title: 'Fullstack Developer Assessment',
      description: 'A basic test to evaluate MERN stack knowledge.',
      durationInMinutes: 30,
      questions: [
        {
          questionText: 'Which hook is used to manage side effects in React?',
          options: ['useState', 'useEffect', 'useContext', 'useReducer'],
          correctOptionIndex: 1,
          points: 5
        },
        {
          questionText: 'What does the "M" in MERN stand for?',
          options: ['MySQL', 'MariaDB', 'MongoDB', 'Microsoft'],
          correctOptionIndex: 2,
          points: 5
        },
        {
          questionText: 'Which method is used to update a Mongoose Map?',
          options: ['push()', 'add()', 'set()', 'update()'],
          correctOptionIndex: 2,
          points: 5
        }
      ]
    });

    await demoTest.save();
    console.log('Demo test created successfully!');
    console.log('You can now visit: http://localhost:5173/test/65f1a2b3c4d5e6f7a8b9c0d1');
    
    process.exit();
  } catch (error) {
    console.error('Error seeding database:', error);
    process.exit(1);
  }
};

seedDatabase();
