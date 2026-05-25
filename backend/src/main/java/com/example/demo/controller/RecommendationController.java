package com.example.demo.controller;

import com.example.demo.dto.ApiResponse;
import com.example.demo.entity.Book;
import com.example.demo.service.RecommendationService;
import org.springframework.web.bind.annotation.*;
import java.util.*;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

@RestController
@RequestMapping("/api/recommendations")
public class RecommendationController {

    private static final Logger log = LoggerFactory.getLogger(RecommendationController.class);

    private final RecommendationService recommendationService;

    public RecommendationController(RecommendationService recommendationService) {
        this.recommendationService = recommendationService;
    }

    @GetMapping("/user/{userId}")
    public ApiResponse<Map<String, Object>> getRecommendations(@PathVariable Long userId,
                                                                @RequestParam(defaultValue = "6") int limit) {
        List<Book> books = recommendationService.getRecommendations(userId, limit);
        String mode = recommendationService.getLastMode();
        log.info("返回推荐模式: {}", mode);

        Map<String, Object> data = new HashMap<>();
        data.put("books", books);
        data.put("mode", mode);
        return ApiResponse.success(data);
    }
}