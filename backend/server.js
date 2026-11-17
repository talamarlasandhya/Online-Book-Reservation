
const express = require('express');
const cors = require('cors');
const db = require('./db');
const booksroutes = require('./routes/books');

require('dotenv').config();

const app = express();

app.use(cors());
app.use(express.json());
app.use('/api/books', booksroutes);

// Home route
app.get('/', (req, res) => {
    res.send('Online Book Reservation Backend is Running!');
});

// Test database route
app.get('/api/test-db', (req, res) => {
    db.query('SELECT 1 AS result', (err, results) => {
        if (err) {
            return res.status(500).json({
                success: false,
                message: 'Database connection failed'
            });
        }

        res.json({
            success: true,
            message: 'MySQL Database Connected Successfully!',
            data: results
        });
    });
});

// Start server
const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
    console.log(`Server running at http://localhost:${PORT}`);
});
