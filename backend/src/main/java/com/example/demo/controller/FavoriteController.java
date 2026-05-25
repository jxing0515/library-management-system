package com.example.demo.controller;

import com.example.demo.dto.ApiResponse;
import com.example.demo.dto.FavoriteDTO;
import com.example.demo.entity.Favorite;
import com.example.demo.service.FavoriteService;
import org.springframework.web.bind.annotation.*;
import java.util.List;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/favorites")
public class FavoriteController {

    private final FavoriteService favoriteService;

    public FavoriteController(FavoriteService favoriteService) {
        this.favoriteService = favoriteService;
    }

    @GetMapping("/user/{userId}")
    public ApiResponse<List<FavoriteDTO>> getFavorites(@PathVariable Long userId) {
        List<Favorite> favorites = favoriteService.getFavoritesByUserId(userId);
        List<FavoriteDTO> dtos = favorites.stream()
                .map(fav -> new FavoriteDTO(fav.getId(), fav.getBook(), fav.getCreatedAt()))
                .collect(Collectors.toList());
        return ApiResponse.success(dtos);
    }

    @GetMapping("/check")
    public ApiResponse<Boolean> checkFavorited(@RequestParam Long userId, @RequestParam Long bookId) {
        boolean result = favoriteService.isFavorited(userId, bookId);
        return ApiResponse.success(result);
    }

    @PostMapping("/add")
    public ApiResponse<FavoriteDTO> addFavorite(@RequestParam Long userId, @RequestParam Long bookId) {
        try {
            Favorite favorite = favoriteService.addFavorite(userId, bookId);
            FavoriteDTO dto = new FavoriteDTO(favorite.getId(), favorite.getBook(), favorite.getCreatedAt());
            return ApiResponse.success("收藏成功", dto);
        } catch (RuntimeException e) {
            return ApiResponse.error(400, e.getMessage());
        }
    }

    @DeleteMapping("/remove")
    public ApiResponse<Void> removeFavorite(@RequestParam Long userId, @RequestParam Long bookId) {
        favoriteService.removeFavorite(userId, bookId);
        return ApiResponse.success("取消收藏成功", null);
    }

    @GetMapping("/count/{bookId}")
    public ApiResponse<Long> getFavoriteCount(@PathVariable Long bookId) {
        long count = favoriteService.getFavoriteCount(bookId);
        return ApiResponse.success(count);
    }
}
