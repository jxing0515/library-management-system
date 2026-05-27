package com.example.demo.controller;

import com.example.demo.dto.ApiResponse;
import com.example.demo.dto.DashboardStats;
import com.example.demo.service.BookService;
import com.example.demo.service.BorrowRecordService;
import com.example.demo.service.CategoryService;
import com.example.demo.service.UserService;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/dashboard")
public class DashboardController {

    private final BookService bookService;
    private final UserService userService;
    private final BorrowRecordService borrowRecordService;
    private final CategoryService categoryService;

    public DashboardController(BookService bookService, UserService userService,
                                BorrowRecordService borrowRecordService, CategoryService categoryService) {
        this.bookService = bookService;
        this.userService = userService;
        this.borrowRecordService = borrowRecordService;
        this.categoryService = categoryService;
    }

    @GetMapping("/stats")
    public ApiResponse<DashboardStats> getStats() {
        DashboardStats stats = new DashboardStats();
        stats.setTotalBooks(bookService.findAll().size());
        stats.setTotalUsers(userService.findAll().size());
        stats.setTotalBorrows(borrowRecordService.getTotalBorrowCount());
        stats.setActiveBorrows(borrowRecordService.getActiveBorrowCountAll());
        stats.setOverdueRecords(borrowRecordService.getOverdueCount());
        stats.setTotalCategories(categoryService.findAll().size());
        return ApiResponse.success(stats);
    }


    @GetMapping("/stats/user/{userId}")
    public ApiResponse<?> getUserStats(@PathVariable Long userId) {
        return ApiResponse.success(Map.of(
            "activeBorrows", borrowRecordService.getActiveBorrowCount(userId)
        ));
    }
}
