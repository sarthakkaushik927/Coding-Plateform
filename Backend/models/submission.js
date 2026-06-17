const mongoose = require('mongoose');

const submissionSchema = new mongoose.Schema({
  candidateEmail: { 
    type: String, 
    required: true 
  },
  candidateName: {
    type: String
  },
  testId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'Test', 
    required: true 
  },
  // Map allows O(1) access to answers by questionId
  // Format: { "question_id": "selected_option_index" }
  answers: {
    type: Map,
    of: Number,
    default: {}
  },
  score: {
    type: Number,
    default: 0
  },
  startTime: {
    type: Date,
    default: Date.now
  },
  status: {
    type: String,
    enum: ['active', 'completed'],
    default: 'active'
  }
}, { timestamps: true });

module.exports = mongoose.model('Submission', submissionSchema);
