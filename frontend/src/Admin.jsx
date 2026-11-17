


import { useState } from 'react';

function Admin({ books, setBooks, reservations }) {
  const [title, setTitle] = useState('');
  const [author, setAuthor] = useState('');
  const [category, setCategory] = useState('');
  const [stock, setStock] = useState('');
  const [editId, setEditId] = useState(null);
  const [loading, setLoading] = useState(false);

  const resetForm = () => {
    setTitle('');
    setAuthor('');
    setCategory('');
    setStock('');
    setEditId(null);
  };

  const fetchBooks = async () => {
    const response = await fetch('http://localhost:5000/api/books');
    if (!response.ok) throw new Error('Failed to load books');
    setBooks(await response.json());
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const bookData = {
      title: title.trim(),
      author: author.trim(),
      category: category.trim(),
      stock: Number(stock)
    };

    if (
      !bookData.title ||
      !bookData.author ||
      !bookData.category ||
      stock === '' ||
      !Number.isInteger(bookData.stock) ||
      bookData.stock < 0
    ) {
      alert('Please enter valid book details.');
      return;
    }

    setLoading(true);

    try {
      const url = editId !== null
        ? `http://localhost:5000/api/books/${editId}`
        : 'http://localhost:5000/api/books';

      const response = await fetch(url, {
        method: editId !== null ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(bookData)
      });

      const result = await response.json();

      if (!response.ok) throw new Error(result.error);

      await fetchBooks();
      alert(result.message);
      resetForm();

    } catch (error) {
      alert(error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (book) => {
    setEditId(book.id);
    setTitle(book.title);
    setAuthor(book.author);
    setCategory(book.category);
    setStock(String(book.stock));
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this book?')) return;

    try {
      const response = await fetch(
        `http://localhost:5000/api/books/${id}`,
        { method: 'DELETE' }
      );

      const result = await response.json();

      if (!response.ok) throw new Error(result.error);

      await fetchBooks();
      alert(result.message);

    } catch (error) {
      alert(error.message);
    }
  };

  return (
    <div className="admin-dashboard">
      <h1>Admin Dashboard</h1>

      <div className="admin-stats">
        <div className="stat-card">
          <h3>Total Books</h3>
          <p>{books.length}</p>
        </div>

        <div className="stat-card">
          <h3>Total Reservations</h3>
          <p>{reservations.length}</p>
        </div>
      </div>

      <h2>{editId !== null ? 'Edit Book' : 'Add New Book'}</h2>

      <form onSubmit={handleSubmit} className="add-book-form">
        <input
          placeholder="Book Title"
          value={title}
          onChange={e => setTitle(e.target.value)}
          required
        />

        <input
          placeholder="Author Name"
          value={author}
          onChange={e => setAuthor(e.target.value)}
          required
        />

        <input
          placeholder="Category"
          value={category}
          onChange={e => setCategory(e.target.value)}
          required
        />

        <input
          type="number"
          min="0"
          step="1"
          placeholder="Available Stock"
          value={stock}
          onChange={e => setStock(e.target.value)}
          required
        />

        <button type="submit" disabled={loading}>
          {loading ? 'Please wait...' :
            editId !== null ? 'Update Book' : 'Add Book'}
        </button>

        {editId !== null && (
          <button type="button" onClick={resetForm}>
            Cancel Edit
          </button>
        )}
      </form>

      <h2>Book Inventory</h2>

      {books.map(book => (
        <div className="admin-card" key={book.id}>
          <h3>{book.title}</h3>
          <p>Author: {book.author}</p>
          <p>Category: {book.category}</p>
          <p>Available Stock: {book.stock}</p>

          <button onClick={() => handleEdit(book)}>Edit</button>
          <button onClick={() => handleDelete(book.id)}>Delete</button>
        </div>
      ))}

      <h2>All Reservations</h2>

      {reservations.length === 0 ? (
        <p>No reservations available.</p>
      ) : (
        reservations.map(reservation => (
          <div className="admin-card" key={reservation.id}>
            <h3>{reservation.bookTitle}</h3>
            <p>Customer: {reservation.name}</p>
            <p>Email: {reservation.email}</p>
            <p>Date: {reservation.date}</p>
            <p>Status: Confirmed</p>
          </div>
        ))
      )}
    </div>
  );
}

export default Admin;
