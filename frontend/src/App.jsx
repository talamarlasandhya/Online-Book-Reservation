
import { useState, useEffect } from 'react';
import './App.css';
import Admin from './Admin';
function App() {
  const [search, setSearch] = useState('');

  const [books, setBooks] = useState([]);

useEffect(() => {
  fetch('http://localhost:5000/api/books')
    .then(response => {
      if (!response.ok) {
        throw new Error('Failed to fetch books');
      }
      return response.json();
    })
    .then(data => {
      setBooks(data);
    })
    .catch(error => {
      console.error('Error fetching books:', error);
    });
}, []);
  const [reservationBook, setReservationBook] = useState(null);
const [userName, setUserName] = useState('');
const [userEmail, setUserEmail] = useState('');
const [reservations, setReservations] = useState(() => {
  try {
    const savedReservations = localStorage.getItem('reservations');
    return savedReservations ? JSON.parse(savedReservations) : [];
  } catch {
    return [];
  }
});
useEffect(() => {
  localStorage.setItem(
    'reservations',
    JSON.stringify(reservations)
  );
}, [reservations]);
  const handleReserve = (book) => {
  setReservationBook(book);
  setUserName('');
  setUserEmail('');
};

const handleConfirmReservation = async (e) => {
  e.preventDefault();

  if (!userName.trim() || !userEmail.trim()) {
    alert('Please enter your name and email.');
    return;
  }

  try {
    const response = await fetch(
      'http://localhost:5000/api/books/reserve',
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          bookId: reservationBook.id,
          customerName: userName,
          customerEmail: userEmail
        })
      }
    );

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || 'Reservation failed');
    }

    setReservations((previousReservations) => [
      ...previousReservations,
      {
        id: data.transactionId,
        bookTitle: reservationBook.title,
        name: userName,
        email: userEmail,
        date: new Date().toLocaleString()
      }
    ]);

    // Refresh books from MySQL
    const booksResponse = await fetch(
      'http://localhost:5000/api/books'
    );

    if (!booksResponse.ok) {
      throw new Error('Could not refresh book stock');
    }

    const updatedBooks = await booksResponse.json();
    setBooks(updatedBooks);

    alert('Reservation successful!');

    setReservationBook(null);
    setUserName('');
    setUserEmail('');

  } catch (error) {
    console.error('Reservation error:', error);
    alert(error.message);
  }
};


  const filteredBooks = books.filter((book) =>
    book.title.toLowerCase().includes(search.toLowerCase()) ||
    book.author.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="app">
      <header className="navbar">
        <h2>📚 Online Library</h2>
        <nav>
          <a href="#home">Home</a>
          <a href="#books">Books</a>
          <a href="#about">About</a>
        </nav>
      </header>

      <section className="hero" id="home">
        <h1>Welcome to Our Library</h1>
        <p>Discover, search and reserve your favourite books.</p>
      </section>

      <main className="container" id="books">
        <h2>Available Books</h2>

        <input
          type="text"
          placeholder="Search by book name or author..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="search"
        />

        <div className="book-grid">
          {filteredBooks.map((book) => (
            <div className="book-card" key={book.id}>
              <h3>{book.title}</h3>
              <p>Author: {book.author}</p>
              <p>Category: {book.category}</p>
              <p>
                Status: {book.stock > 0 ? 'Available' : 'Out of Stock'}
              </p>
              <button
  disabled={book.stock === 0}
  onClick={() => handleReserve(book)}
>
  {book.stock > 0 ? 'Reserve Book' : 'Unavailable'}
</button>
            </div>
          ))}
        </div>

        {filteredBooks.length === 0 && <p>No books found.</p>}
        <section className="reservation-history">
  <h2>My Reservations</h2>

  {reservations.length === 0 ? (
    <p>No reservations yet.</p>
  ) : (
    reservations.map((reservation) => (
      <div className="history-card" key={reservation.id}>
        <h3>{reservation.bookTitle}</h3>

        <p>Name: {reservation.name}</p>

        <p>Email: {reservation.email}</p>

        <p>Date: {reservation.date}</p>

        <p>Status: Confirmed</p>
      </div>
    ))
  )}
</section>
      </main>
            <Admin
  books={books}
  setBooks={setBooks}
  reservations={reservations}
/>
{reservationBook && (
  <div className="modal-overlay">
    <div className="reservation-form">
      <h2>Reserve Your Book</h2>
      <p>
        Book: <strong>{reservationBook.title}</strong>
      </p>

      <form onSubmit={handleConfirmReservation}>
        <label>Your Name</label>
        <input
          type="text"
          placeholder="Enter your name"
          value={userName}
          onChange={(e) => setUserName(e.target.value)}
          required
        />

        <label>Email Address</label>
        <input
          type="email"
          placeholder="Enter your email"
          value={userEmail}
          onChange={(e) => setUserEmail(e.target.value)}
          required
        />

        <button type="submit">
          Confirm Reservation
        </button>

        <button
          type="button"
          className="cancel-btn"
          onClick={() => setReservationBook(null)}
        >
          Cancel
        </button>
      </form>
    </div>
  </div>
)}
      <footer id="about">
        <p>© 2026 Online Book Inventory & Reservation System</p>
      </footer>
    </div>
  );
}

export default App;
