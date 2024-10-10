const express = require('express');
const router = express.Router();
const Note = require('../models/Note'); // Assuming you have a Note model


router.post('/', async (req, res) => {
  try {
    // Validate the required fields before creating the note
    const { title, content, category, createdAt, calendarDate } = req.body;

    if (!title || !content) {
      return res.status(400).json({ message: "Title and content are required." });
    }

    // Create the note object with defaults for optional fields
    const newNote = new Note({
      title,
      content,
      category: category || 'General', // Default to 'General' if no category is provided
      createdAt: createdAt || Date.now(), 
      calendarDate: calendarDate ? new Date(calendarDate) : null 
    });

    // Save the note to the database
    const savedNote = await newNote.save();
    res.status(201).json({
      message: 'Note saved successfully!',
      note: savedNote,
    });

  } catch (error) {
    console.error('Error saving note:', error);
    res.status(500).json({ error: 'Failed to save the note' });
  }
});


/// GET all notes
router.get('/', async (req, res) => {
    try {
      const notes = await Note.find(); // Fetch all notes from the database
      res.status(200).json(notes); // Send the list of notes back to the client
    } catch (err) {
      res.status(500).json({ message: 'Failed to fetch notes'}); // Internal Server Error
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
      res.status(500).json({ message: 'Failed to fetch the note'  }); // Internal Server Error
    }
  });

  // PUT route to update an existing note by ID
router.put('/:id', async (req, res) => {
  try {
    const { title, content, category, calendarDate } = req.body;

    const updatedNote = await Note.findByIdAndUpdate(
      req.params.id,
      {
        title,
        content,
        category: category || 'General',
        calendarDate: calendarDate || null,
      },
      { new: true } // Return the updated document
    );

    if (!updatedNote) {
      return res.status(404).json({ message: 'Note not found' });
    }

    res.status(200).json({
      message: 'Note updated successfully!',
      note: updatedNote,
    });
  } catch (error) {
    console.error('Error updating note:', error);
    res.status(500).json({ message: 'Failed to update the note' });
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
