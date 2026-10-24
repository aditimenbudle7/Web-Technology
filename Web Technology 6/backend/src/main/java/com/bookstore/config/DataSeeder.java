package com.bookstore.config;

import com.bookstore.model.Book;
import com.bookstore.model.User;
import com.bookstore.repository.BookRepository;
import com.bookstore.repository.UserRepository;
import com.bookstore.service.AuthService;
import java.util.List;
import org.springframework.boot.CommandLineRunner;
import org.springframework.stereotype.Component;

/** Fills an empty database with sample books and a demo user on first start. */
@Component
public class DataSeeder implements CommandLineRunner {

    private final BookRepository bookRepository;
    private final UserRepository userRepository;
    private final AuthService authService;

    public DataSeeder(BookRepository bookRepository, UserRepository userRepository, AuthService authService) {
        this.bookRepository = bookRepository;
        this.userRepository = userRepository;
        this.authService = authService;
    }

    @Override
    public void run(String... args) {
        if (bookRepository.count() == 0) {
            bookRepository.saveAll(List.of(
                new Book("Clean Code", "Robert C. Martin", "Technology", 549, 4.6,
                        "A handbook of agile software craftsmanship with practical advice on writing readable code.", "#2f5d62", true),
                new Book("The Pragmatic Programmer", "Andrew Hunt & David Thomas", "Technology", 625, 4.7,
                        "Timeless tips for becoming a more effective and adaptable developer.", "#5e3b76", true),
                new Book("Pride and Prejudice", "Jane Austen", "Fiction", 199, 4.5,
                        "A witty classic about manners, marriage and first impressions in Regency England.", "#8c4a3c", true),
                new Book("1984", "George Orwell", "Fiction", 249, 4.7,
                        "A chilling vision of a totalitarian future under constant surveillance.", "#3d3d3d", true),
                new Book("Sapiens", "Yuval Noah Harari", "History", 499, 4.4,
                        "A brief history of humankind, from the Stone Age to the present.", "#b5853a", true),
                new Book("Atomic Habits", "James Clear", "Self-Help", 399, 4.8,
                        "Tiny changes, remarkable results: a proven framework for building good habits.", "#c2593b", true),
                new Book("A Brief History of Time", "Stephen Hawking", "Science", 349, 4.5,
                        "From the Big Bang to black holes, cosmology explained for everyone.", "#1f3a5f", false),
                new Book("The Alchemist", "Paulo Coelho", "Fiction", 225, 4.3,
                        "A shepherd boy follows his dream across the desert in this fable about destiny.", "#d19a3a", true),
                new Book("Introduction to Algorithms", "Cormen, Leiserson, Rivest & Stein", "Technology", 1299, 4.5,
                        "The comprehensive reference on algorithms and data structures.", "#24476b", true),
                new Book("Wings of Fire", "A. P. J. Abdul Kalam", "Biography", 299, 4.7,
                        "The inspiring autobiography of India's Missile Man and former President.", "#7a3e2e", true),
                new Book("Thinking, Fast and Slow", "Daniel Kahneman", "Self-Help", 450, 4.4,
                        "How two systems of thinking shape our judgements and decisions.", "#4a6741", true),
                new Book("Cosmos", "Carl Sagan", "Science", 375, 4.6,
                        "A journey through the universe and humanity's place within it.", "#2b2d5c", true)
            ));
            System.out.println(">> Seeded 12 sample books");
        }

        if (!userRepository.existsByEmailIgnoreCase("demo@bookstore.com")) {
            User demo = new User();
            demo.setFullName("Demo User");
            demo.setEmail("demo@bookstore.com");
            demo.setPasswordHash(authService.hash("demo123"));
            userRepository.save(demo);
            System.out.println(">> Created demo user: demo@bookstore.com / demo123");
        }
    }
}
