package com.example.demo.service;

import com.example.demo.entity.Book;
import com.example.demo.repository.BookRepository;
import com.example.demo.repository.BorrowRecordRepository;
import org.springframework.stereotype.Service;
import java.util.List;

@Service
public class BookService {

    private final BookRepository bookRepository;
    private final BorrowRecordRepository borrowRecordRepository;
    private final CategoryService categoryService;

    public BookService(BookRepository bookRepository, BorrowRecordRepository borrowRecordRepository, CategoryService categoryService) {
        this.bookRepository = bookRepository;
        this.borrowRecordRepository = borrowRecordRepository;
        this.categoryService = categoryService;
    }

    public List<Book> findAll() {
        return bookRepository.findAll();
    }

    public Book findById(Long id) {
        return bookRepository.findById(id).orElseThrow(() -> new RuntimeException("图书不存在"));
    }

    public Book create(Book book) {
        if (book.getIsbn() != null && !book.getIsbn().isEmpty() && bookRepository.existsByIsbn(book.getIsbn())) {
            throw new RuntimeException("ISBN已存在");
        }
        if (book.getAvailable() == null) book.setAvailable(book.getQuantity());
        if (book.getAvailable() > book.getQuantity()) {
            throw new RuntimeException("可借数量不能超过总库存");
        }
        return bookRepository.save(book);
    }

    public Book update(Long id, Book book) {
        var existing = findById(id);
        if (book.getTitle() != null) existing.setTitle(book.getTitle());
        if (book.getAuthor() != null) existing.setAuthor(book.getAuthor());
        if (book.getIsbn() != null) existing.setIsbn(book.getIsbn());
        if (book.getPublisher() != null) existing.setPublisher(book.getPublisher());
        if (book.getCategory() != null) {
            var cat = categoryService.findById(book.getCategory().getId());
            existing.setCategory(cat);
        }
        if (book.getQuantity() != null) existing.setQuantity(book.getQuantity());
        if (book.getAvailable() != null) {
            if (book.getAvailable() < 0) {
                throw new RuntimeException("可借数量不能为负数");
            }
            int newQuantity = book.getQuantity() != null ? book.getQuantity() : existing.getQuantity();
            if (book.getAvailable() > newQuantity) {
                throw new RuntimeException("可借数量不能超过总库存（" + newQuantity + "）");
            }
            // 从借阅记录表查实际已借出数（不依赖 available 字段反推，防止之前数据被污染）
            long actuallyBorrowed = borrowRecordRepository.countByBookIdAndStatus(existing.getId(), "BORROWED");
            int maxAvailable = newQuantity - (int) actuallyBorrowed;
            if (book.getAvailable() > maxAvailable) {
                throw new RuntimeException("当前有 " + actuallyBorrowed + " 本被借出未归还，可借数量不能超过 " + maxAvailable);
            }
            existing.setAvailable(book.getAvailable());
        }
        if (book.getDescription() != null) existing.setDescription(book.getDescription());
        if (book.getCoverUrl() != null) existing.setCoverUrl(book.getCoverUrl());
        return bookRepository.save(existing);
    }

    public void delete(Long id) {
        var book = findById(id);
        bookRepository.delete(book);
    }

    public List<Book> search(String keyword, Long categoryId) {
        return bookRepository.searchBooks(keyword, categoryId);
    }

    public Book updateBook(Book book) {
        return bookRepository.save(book);
    }
}
