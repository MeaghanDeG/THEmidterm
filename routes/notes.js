const express = require('express');
const router = express.Router();
const Note = require('../models/Note'); // Assuming you have a Note model

// Route to create a new note
router.post('/', async (req, res) => {
    try {
      // Validate the required fields before creating the note
      const { title, content, category, createdAt } = req.body;
      
      if (!title || !content) {
        return res.status(400).json({ message: "Title and content are required." });
      }
  
      // Create a new note using the request body
      const note = new Note({
        title,
        content,
        category: category || 'General', // If no category is provided, default to 'General'
        createdAt: createdAt || new Date(), // Use provided creation date or default to now
      });
  
      // Save the note to the database
      const savedNote = await note.save();
      
      // Send back the saved note with a 201 status
      res.status(201).json(savedNote);
  
    } catch (err) {
      // Handle any errors that occur during the process
      res.status(500).json({ message: err.message });
    }
  });
  

/// GET all notes
router.get('/', async (req, res) => {
    try {
      const notes = await Note.find(); // Fetch all notes from the database
      res.status(200).json(notes); // Send the list of notes back to the client
    } catch (err) {
      res.status(500).json({ message: err.message }); // Internal Server Error
    }
  });
  
  // GET a single note by ID
  router.get('/:id', async (req, res) => {
    try {
      const note = await Note.findById(req.params.id); // Find note by ID
      if (!note) {
        return res.status(404).json({ message: 'Note not found' }); // If no note found, send 404
      }
      res.status(200).json(note); // Send the note back to the client
    } catch (err) {
      res.status(500).json({ message: err.message }); // Internal Server Error
    }
  });

  router.delete('/:id', async (req, res) => {
    console.log('DELETE request received for note with ID:', req.params.id);
    try {
      const note = await Note.findByIdAndDelete(req.params.id);
      if (!note) {
        console.log('Note not found for ID:', req.params.id);
        return res.status(404).json({ message: 'Note not found' });
      }
      console.log('Note deleted successfully');
      res.status(200).json({ message: 'Note deleted successfully' });
    } catch (err) {
      console.error('Error during note deletion:', err);
      if (err.kind === 'ObjectId') {
        return res.status(400).json({ message: 'Invalid Note ID' });
      }
      res.status(500).json({ message: 'Internal Server Error' });
    }
  });
  


module.exports = router;
