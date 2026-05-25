package com.example.demo.controller;

import com.example.demo.dto.ApiResponse;
import com.example.demo.entity.BorrowRecord;
import com.example.demo.service.BorrowRecordService;
import org.springframework.web.bind.annotation.*;
import java.util.List;

@RestController
@RequestMapping("/api/borrow-records")
public class BorrowRecordController {

    private final BorrowRecordService borrowRecordService;

    public BorrowRecordController(BorrowRecordService borrowRecordService) {
        this.borrowRecordService = borrowRecordService;
    }

    @GetMapping
    public ApiResponse<List<BorrowRecord>> findAll() {
        return ApiResponse.success(borrowRecordService.findAll());
    }

    @GetMapping("/{id}")
    public ApiResponse<BorrowRecord> findById(@PathVariable Long id) {
        return ApiResponse.success(borrowRecordService.findById(id));
    }

    @GetMapping("/user/{userId}")
    public ApiResponse<List<BorrowRecord>> findByUser(@PathVariable Long userId) {
        return ApiResponse.success(borrowRecordService.findByUser(userId));
    }

    @GetMapping("/search")
    public ApiResponse<List<BorrowRecord>> search(
            @RequestParam(required = false) Long userId,
            @RequestParam(required = false) String status) {
        return ApiResponse.success(borrowRecordService.search(userId, status));
    }

    @PostMapping("/borrow")
    public ApiResponse<BorrowRecord> borrow(
            @RequestParam Long userId,
            @RequestParam Long bookId) {
        try {
            return ApiResponse.success("借书成功", borrowRecordService.borrowBook(userId, bookId));
        } catch (RuntimeException e) {
            return ApiResponse.error(e.getMessage());
        }
    }

    @PutMapping("/return/{id}")
    public ApiResponse<BorrowRecord> returnBook(@PathVariable Long id) {
        try {
            return ApiResponse.success("还书成功", borrowRecordService.returnBook(id));
        } catch (RuntimeException e) {
            return ApiResponse.error(e.getMessage());
        }
    }

    @PutMapping("/renew/{id}")
    public ApiResponse<BorrowRecord> renew(@PathVariable Long id) {
        try {
            return ApiResponse.success("续借成功", borrowRecordService.renewBook(id));
        } catch (RuntimeException e) {
            return ApiResponse.error(e.getMessage());
        }
    }
}
