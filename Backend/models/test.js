const mongoose = require('mongoose');

const questionSchema = new mongoose.Schema({
  questionText: { type: String, required: true },
  options: [{ type: String, required: true }],
  correctOptionIndex: { type: Number, required: true },
  points: { type: Number, default: 1 }
});

const testSchema = new mongoose.Schema({
  title: { type: String, required: true },
  description: { type: String },
  durationInMinutes: { type: Number, required: true },
  status: {
    type: String,
    enum: ['scheduled', 'waiting', 'active', 'completed'],
    default: 'scheduled'
  },
  startedAt: { type: Date, default: null },
  completedAt: { type: Date, default: null },
  questions: [questionSchema]
}, { timestamps: true });

module.exports = mongoose.model('Test', testSchema);
