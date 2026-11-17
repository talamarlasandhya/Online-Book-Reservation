
const express = require('express');
const router = express.Router();
const db = require('../db');

// GET: Display all books
router.get('/', (req, res) => {
    const sql = `
        SELECT 
            b.book_id AS id,
            b.title,
            a.author_name AS author,
            b.author_id,
            b.category,
            b.total_stock,
            b.available_stock AS stock
        FROM Books b
        LEFT JOIN Authors a
        ON b.author_id = a.author_id
    `;

    db.query(sql, (err, results) => {
        if (err) {
            return res.status(500).json({ error: err.message });
        }
        res.json(results);
    });
});

// POST: Add a new book
router.post('/', (req, res) => {
    const { title, author, category, stock } = req.body;

    if (!title || !author || !category ||
        !Number.isInteger(stock) || stock < 0) {
        return res.status(400).json({
            error: 'Please enter valid book details'
        });
    }

    db.query(
        'SELECT author_id FROM Authors WHERE author_name = ?',
        [author],
        (err, authors) => {
            if (err) {
                return res.status(500).json({ error: err.message });
            }

            const addBook = (authorId) => {
                const sql = `
                    INSERT INTO Books
                    (title, author_id, category, total_stock, available_stock)
                    VALUES (?, ?, ?, ?, ?)
                `;

                db.query(
                    sql,
                    [title, authorId, category, stock, stock],
                    (err, result) => {
                        if (err) {
                            return res.status(500).json({
                                error: err.message
                            });
                        }

                        res.status(201).json({
                            message: 'Book added successfully',
                            bookId: result.insertId
                        });
                    }
                );
            };

            if (authors.length > 0) {
                addBook(authors[0].author_id);
            } else {
                db.query(
                    'INSERT INTO Authors (author_name) VALUES (?)',
                    [author],
                    (err, result) => {
                        if (err) {
                            return res.status(500).json({
                                error: err.message
                            });
                        }
                        addBook(result.insertId);
                    }
                );
            }
        }
    );
});

// PUT: Update a book
router.put('/:id', (req, res) => {
    const { title, author, category, stock } = req.body;
    const bookId = req.params.id;

    if (!title || !author || !category ||
        !Number.isInteger(stock) || stock < 0) {
        return res.status(400).json({
            error: 'Please enter valid book details'
        });
    }

    db.query(
        'SELECT author_id FROM Authors WHERE author_name = ?',
        [author],
        (err, authors) => {
            if (err) {
                return res.status(500).json({ error: err.message });
            }

            const updateBook = (authorId) => {
                const sql = `
                    UPDATE Books
                    SET title = ?, author_id = ?, category = ?,
                        total_stock = ?, available_stock = ?
                    WHERE book_id = ?
                `;

                db.query(
                    sql,
                    [title, authorId, category, stock, stock, bookId],
                    (err, result) => {
                        if (err) {
                            return res.status(500).json({
                                error: err.message
                            });
                        }

                        if (result.affectedRows === 0) {
                            return res.status(404).json({
                                error: 'Book not found'
                            });
                        }

                        res.json({
                            message: 'Book updated successfully'
                        });
                    }
                );
            };

            if (authors.length > 0) {
                updateBook(authors[0].author_id);
            } else {
                db.query(
                    'INSERT INTO Authors (author_name) VALUES (?)',
                    [author],
                    (err, result) => {
                        if (err) {
                            return res.status(500).json({
                                error: err.message
                            });
                        }
                        updateBook(result.insertId);
                    }
                );
            }
        }
    );
});

// DELETE: Delete a book
router.delete('/:id', (req, res) => {
    db.query(
        'DELETE FROM Books WHERE book_id = ?',
        [req.params.id],
        (err, result) => {
            if (err) {
                return res.status(500).json({ error: err.message });
            }

            if (result.affectedRows === 0) {
                return res.status(404).json({
                    error: 'Book not found'
                });
            }

            res.json({
                message: 'Book deleted successfully'
            });
        }
    );
});

// POST: Reserve a book and save transaction in MySQL
router.post('/reserve', async (req, res) => {
    const { bookId, customerName, customerEmail } = req.body;

    if (!Number.isInteger(Number(bookId)) ||
        !customerName?.trim() ||
        !customerEmail?.trim()) {
        return res.status(400).json({
            error: 'Please provide valid reservation details'
        });
    }

    let connection;

    try {
        connection = await db.promise().getConnection();

        await connection.beginTransaction();

        // Check book availability
        const [books] = await connection.execute(
            `SELECT book_id, available_stock
             FROM Books
             WHERE book_id = ?
             FOR UPDATE`,
            [Number(bookId)]
        );

        if (books.length === 0) {
            await connection.rollback();
            return res.status(404).json({
                error: 'Book not found'
            });
        }

        if (books[0].available_stock <= 0) {
            await connection.rollback();
            return res.status(400).json({
                error: 'Book is out of stock'
            });
        }

        // Reduce available stock
        await connection.execute(
            `UPDATE Books
             SET available_stock = available_stock - 1
             WHERE book_id = ?`,
            [Number(bookId)]
        );

        // Save reservation in Transactions table
        const [result] = await connection.execute(
            `INSERT INTO Transactions
             (book_id, customer_name, customer_email, issue_date, status)
             VALUES (?, ?, ?, CURDATE(), 'Reserved')`,
            [
                Number(bookId),
                customerName.trim(),
                customerEmail.trim()
            ]
        );

        await connection.commit();

        res.status(201).json({
            success: true,
            message: 'Book reserved successfully!',
            transactionId: result.insertId
        });

    } catch (error) {
        if (connection) {
            await connection.rollback();
        }

        console.error('Reservation error:', error);

        res.status(500).json({
            error: 'Reservation failed'
        });

    } finally {
        if (connection) {
            connection.release();
        }
    }
});

module.exports = router;
