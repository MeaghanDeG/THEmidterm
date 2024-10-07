const mongoose = require('mongoose');

const noteSchema = new mongoose.Schema({
  title: { type: String, required: true },
  content: { type: String, required: true },
  category: { type: String, default: 'General' },
  createdAt: { type: Date, default: Date.now }, 
  urgent: { type: Boolean, default: false }
});

// Exporting the model
module.exports = mongoose.model('Note', noteSchema);
