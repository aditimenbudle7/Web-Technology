import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import BookCard from '../components/BookCard';
import { api } from '../services/api';
import type { Book } from '../types';

const features = [
  { icon: '🚚', title: 'Fast Delivery', text: 'Get your books delivered within 3–5 days.' },
  { icon: '💸', title: 'Best Prices', text: 'Great discounts on bestsellers and classics.' },
  { icon: '🔒', title: 'Secure Checkout', text: 'Your account and payments are kept safe.' },
];

export default function Home() {
  const [featured, setFeatured] = useState<Book[]>([]);

  useEffect(() => {
    api.getBooks()
      .then((books) => setFeatured([...books].sort((a, b) => b.rating - a.rating).slice(0, 4)))
      .catch(() => setFeatured([]));
  }, []);

  return (
    <>
      <section className="hero">
        <div className="container hero-inner">
          <div className="hero-text">
            <h1>Find your next favourite book</h1>
            <p>
              Explore thousands of titles across fiction, technology, science, history and more —
              all in one place.
            </p>
            <div className="hero-actions">
              <Link to="/catalogue" className="btn btn-primary">Browse Catalogue</Link>
              <Link to="/register" className="btn btn-outline">Create Account</Link>
            </div>
          </div>
          <div className="hero-art" aria-hidden="true">
            <div className="stack s1" />
            <div className="stack s2" />
            <div className="stack s3" />
          </div>
        </div>
      </section>

      <section className="container section">
        <div className="features">
          {features.map((f) => (
            <div key={f.title} className="feature">
              <span className="feature-icon">{f.icon}</span>
              <h3>{f.title}</h3>
              <p>{f.text}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="container section">
        <div className="section-head">
          <h2>Top Rated</h2>
          <Link to="/catalogue" className="link">View all →</Link>
        </div>
        <div className="book-grid">
          {featured.map((b) => <BookCard key={b.id} book={b} />)}
        </div>
      </section>
    </>
  );
}
