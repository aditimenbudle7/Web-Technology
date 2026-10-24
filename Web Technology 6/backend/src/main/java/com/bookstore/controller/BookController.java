package com.bookstore.controller;

import com.bookstore.exception.ApiException;
import com.bookstore.model.Book;
import com.bookstore.repository.BookRepository;
import java.util.List;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/books")
public class BookController {

    private final BookRepository bookRepository;

    public BookController(BookRepository bookRepository) {
        this.bookRepository = bookRepository;
    }

    /** GET /api/books  — optional ?genre=Fiction or ?search=orwell */
    @GetMapping
    public List<Book> getBooks(@RequestParam(required = false) String genre,
                               @RequestParam(required = false) String search) {
        if (search != null && !search.isBlank()) {
            return bookRepository.findByTitleContainingIgnoreCaseOrAuthorContainingIgnoreCase(search, search);
        }
        if (genre != null && !genre.isBlank() && !genre.equalsIgnoreCase("All")) {
            return bookRepository.findByGenreIgnoreCase(genre);
        }
        return bookRepository.findAll();
    }

    @GetMapping("/{id}")
    public Book getBook(@PathVariable String id) {
        return bookRepository.findById(id)
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "Book not found"));
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public Book addBook(@RequestBody Book book) {
        book.setId(null);
        return bookRepository.save(book);
    }

    @PutMapping("/{id}")
    public Book updateBook(@PathVariable String id, @RequestBody Book book) {
        if (!bookRepository.existsById(id)) {
            throw new ApiException(HttpStatus.NOT_FOUND, "Book not found");
        }
        book.setId(id);
        return bookRepository.save(book);
    }

    @DeleteMapping("/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void deleteBook(@PathVariable String id) {
        bookRepository.deleteById(id);
    }
}
