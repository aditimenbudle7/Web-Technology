import type { Book } from '../types';

// Sample data used while the backend isn't ready (VITE_USE_MOCK=true).
// Later this same list can be inserted into MongoDB as seed data.
export const sampleBooks: Book[] = [
  { id: '1', title: 'Clean Code', author: 'Robert C. Martin', genre: 'Technology', price: 549, rating: 4.6, inStock: true, coverColor: '#2f5d62',
    description: 'A handbook of agile software craftsmanship with practical advice on writing readable code.' },
  { id: '2', title: 'The Pragmatic Programmer', author: 'Andrew Hunt & David Thomas', genre: 'Technology', price: 625, rating: 4.7, inStock: true, coverColor: '#5e3b76',
    description: 'Timeless tips for becoming a more effective and adaptable developer.' },
  { id: '3', title: 'Pride and Prejudice', author: 'Jane Austen', genre: 'Fiction', price: 199, rating: 4.5, inStock: true, coverColor: '#8c4a3c',
    description: 'A witty classic about manners, marriage and first impressions in Regency England.' },
  { id: '4', title: '1984', author: 'George Orwell', genre: 'Fiction', price: 249, rating: 4.7, inStock: true, coverColor: '#3d3d3d',
    description: 'A chilling vision of a totalitarian future under constant surveillance.' },
  { id: '5', title: 'Sapiens', author: 'Yuval Noah Harari', genre: 'History', price: 499, rating: 4.4, inStock: true, coverColor: '#b5853a',
    description: 'A brief history of humankind, from the Stone Age to the present.' },
  { id: '6', title: 'Atomic Habits', author: 'James Clear', genre: 'Self-Help', price: 399, rating: 4.8, inStock: true, coverColor: '#c2593b',
    description: 'Tiny changes, remarkable results: a proven framework for building good habits.' },
  { id: '7', title: 'A Brief History of Time', author: 'Stephen Hawking', genre: 'Science', price: 349, rating: 4.5, inStock: false, coverColor: '#1f3a5f',
    description: 'From the Big Bang to black holes, cosmology explained for everyone.' },
  { id: '8', title: 'The Alchemist', author: 'Paulo Coelho', genre: 'Fiction', price: 225, rating: 4.3, inStock: true, coverColor: '#d19a3a',
    description: 'A shepherd boy follows his dream across the desert in this fable about destiny.' },
  { id: '9', title: 'Introduction to Algorithms', author: 'Cormen, Leiserson, Rivest & Stein', genre: 'Technology', price: 1299, rating: 4.5, inStock: true, coverColor: '#24476b',
    description: 'The comprehensive reference on algorithms and data structures.' },
  { id: '10', title: 'Wings of Fire', author: 'A. P. J. Abdul Kalam', genre: 'Biography', price: 299, rating: 4.7, inStock: true, coverColor: '#7a3e2e',
    description: 'The inspiring autobiography of India\'s Missile Man and former President.' },
  { id: '11', title: 'Thinking, Fast and Slow', author: 'Daniel Kahneman', genre: 'Self-Help', price: 450, rating: 4.4, inStock: true, coverColor: '#4a6741',
    description: 'How two systems of thinking shape our judgements and decisions.' },
  { id: '12', title: 'Cosmos', author: 'Carl Sagan', genre: 'Science', price: 375, rating: 4.6, inStock: true, coverColor: '#2b2d5c',
    description: 'A journey through the universe and humanity\'s place within it.' },
];
