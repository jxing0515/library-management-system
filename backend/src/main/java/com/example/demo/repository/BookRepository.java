package com.example.demo.repository;

import com.example.demo.entity.Book;
import com.example.demo.entity.Category;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import java.util.List;

@Repository
public interface BookRepository extends JpaRepository<Book, Long> {
    List<Book> findByCategory(Category category);
    List<Book> findByTitleContaining(String title);
    List<Book> findByAuthorContaining(String author);
    boolean existsByIsbn(String isbn);

    @Query("SELECT b FROM Book b WHERE " +
           "(:keyword IS NULL OR b.title LIKE %:keyword% OR b.author LIKE %:keyword% OR b.isbn LIKE %:keyword%) " +
           "AND (:categoryId IS NULL OR b.category.id = :categoryId)")
    List<Book> searchBooks(@Param("keyword") String keyword, @Param("categoryId") Long categoryId);
}
