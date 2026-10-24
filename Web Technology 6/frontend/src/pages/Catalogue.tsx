import { useEffect, useMemo, useState } from 'react';
import BookCard from '../components/BookCard';
import { api } from '../services/api';
import type { Book } from '../types';

type SortKey = 'title' | 'price-asc' | 'price-desc' | 'rating';

export default function Catalogue() {
  const [books, setBooks] = useState<Book[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [genre, setGenre] = useState('All');
  const [sort, setSort] = useState<SortKey>('title');
  const [toast, setToast] = useState('');

  useEffect(() => {
    api.getBooks()
      .then(setBooks)
      .catch((e: Error) => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  const genres = useMemo(() => ['All', ...new Set(books.map((b) => b.genre))], [books]);

  const visible = useMemo(() => {
    const q = search.trim().toLowerCase();
    const list = books.filter(
      (b) =>
        (genre === 'All' || b.genre === genre) &&
        (b.title.toLowerCase().includes(q) || b.author.toLowerCase().includes(q))
    );
    return [...list].sort((a, b) => {
      switch (sort) {
        case 'price-asc': return a.price - b.price;
        case 'price-desc': return b.price - a.price;
        case 'rating': return b.rating - a.rating;
        default: return a.title.localeCompare(b.title);
      }
    });
  }, [books, search, genre, sort]);

  const handleAdd = (book: Book) => {
    setToast(`"${book.title}" added to cart`);
    setTimeout(() => setToast(''), 2000);
  };

  return (
    <section className="container section">
      <h1 className="page-title">Book Catalogue</h1>

      <div className="filters">
        <input
          type="search"
          className="input"
          placeholder="Search by title or author…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <select className="input" value={genre} onChange={(e) => setGenre(e.target.value)}>
          {genres.map((g) => <option key={g}>{g}</option>)}
        </select>
        <select className="input" value={sort} onChange={(e) => setSort(e.target.value as SortKey)}>
          <option value="title">Sort: Title (A–Z)</option>
          <option value="price-asc">Sort: Price (Low → High)</option>
          <option value="price-desc">Sort: Price (High → Low)</option>
          <option value="rating">Sort: Rating</option>
        </select>
      </div>

      {loading && <p className="muted">Loading books…</p>}
      {error && <p className="alert alert-error">{error}</p>}
      {!loading && !error && (
        <>
          <p className="muted result-count">{visible.length} book(s) found</p>
          {visible.length === 0 ? (
            <p className="empty">No books match your search.</p>
          ) : (
            <div className="book-grid">
              {visible.map((b) => <BookCard key={b.id} book={b} onAdd={handleAdd} />)}
            </div>
          )}
        </>
      )}

      {toast && <div className="toast" role="status">{toast}</div>}
    </section>
  );
}
