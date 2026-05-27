package com.example.demo.service;

import com.example.demo.entity.Book;
import com.example.demo.entity.Favorite;
import com.example.demo.entity.User;
import com.example.demo.repository.BookRepository;
import com.example.demo.repository.FavoriteRepository;
import com.example.demo.repository.UserRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.util.List;

@Service
public class FavoriteService {

    private final FavoriteRepository favoriteRepository;
    private final UserRepository userRepository;
    private final BookRepository bookRepository;

    public FavoriteService(FavoriteRepository favoriteRepository,
                            UserRepository userRepository,
                            BookRepository bookRepository) {
        this.favoriteRepository = favoriteRepository;
        this.userRepository = userRepository;
        this.bookRepository = bookRepository;
    }

    public List<Favorite> getFavoritesByUserId(Long userId) {
        return favoriteRepository.findByUserId(userId);
    }

    public boolean isFavorited(Long userId, Long bookId) {
        return favoriteRepository.existsByUserIdAndBookId(userId, bookId);
    }

    @Transactional
    public Favorite addFavorite(Long userId, Long bookId) {
        if (favoriteRepository.existsByUserIdAndBookId(userId, bookId)) {
            throw new RuntimeException("已收藏过该书");
        }
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("用户不存在"));
        Book book = bookRepository.findById(bookId)
                .orElseThrow(() -> new RuntimeException("图书不存在"));
        Favorite favorite = new Favorite();
        favorite.setUser(user);
        favorite.setBook(book);
        return favoriteRepository.save(favorite);
    }

    @Transactional
    public void removeFavorite(Long userId, Long bookId) {
        favoriteRepository.deleteByUserIdAndBookId(userId, bookId);
    }

    public long getFavoriteCount(Long bookId) {
        return favoriteRepository.countByBookId(bookId);
    }
}
