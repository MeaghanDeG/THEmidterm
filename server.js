const express = require('express');
const mongoose = require('mongoose');
const dotenv = require('dotenv');
const cors = require('cors');  // Import CORS middleware
const notesRoutes = require('./routes/notes');

// Load environment variables from .env file
dotenv.config();

// Initialize the Express app
const app = express();

// Middleware to parse JSON requests
app.use(express.json());

// Enable CORS for all requests
app.use(cors());

// MongoDB connection using the environment variable from .env
mongoose
  .connect(process.env.MONGO_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then(() => console.log('MongoDB connected successfully'))
  .catch((err) => console.error('MongoDB connection error:', err));

// Use the routes
app.use('/api/notes', notesRoutes);

// Simple route to check if the server is running
app.get("/", (req, res) => {
  res.send("Backend is running!");
});

// Start the server on the specified port from .env or default to 5001
const PORT = process.env.PORT || 5001;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
