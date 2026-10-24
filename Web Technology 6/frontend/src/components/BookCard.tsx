import type { Book } from '../types';

interface Props {
  book: Book;
  onAdd?: (book: Book) => void;
}

export default function BookCard({ book, onAdd }: Props) {
  return (
    <article className="book-card">
      <div className="book-cover" style={{ background: book.coverColor }}>
        {book.imageUrl ? (
          <img src={book.imageUrl} alt={book.title} />
        ) : (
          <>
            <span className="cover-title">{book.title}</span>
            <span className="cover-author">{book.author}</span>
          </>
        )}
      </div>
      <div className="book-body">
        <span className="tag">{book.genre}</span>
        <h3 className="book-title">{book.title}</h3>
        <p className="book-author">{book.author}</p>
        <p className="book-desc">{book.description}</p>
        <div className="book-footer">
          <span className="price">₹{book.price}</span>
          <span className="rating">★ {book.rating.toFixed(1)}</span>
        </div>
        <button
          className="btn btn-primary btn-block"
          disabled={!book.inStock}
          onClick={() => onAdd?.(book)}
        >
          {book.inStock ? 'Add to Cart' : 'Out of Stock'}
        </button>
      </div>
    </article>
  );
}
