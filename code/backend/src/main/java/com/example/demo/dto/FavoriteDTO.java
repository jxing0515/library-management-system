package com.example.demo.dto;

import com.example.demo.entity.Book;
import java.time.LocalDateTime;

public class FavoriteDTO {
    private Long id;
    private Book book;
    private LocalDateTime createdAt;

    public FavoriteDTO() {}

    public FavoriteDTO(Long id, Book book, LocalDateTime createdAt) {
        this.id = id;
        this.book = book;
        this.createdAt = createdAt;
    }

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public Book getBook() { return book; }
    public void setBook(Book book) { this.book = book; }

    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }
}
