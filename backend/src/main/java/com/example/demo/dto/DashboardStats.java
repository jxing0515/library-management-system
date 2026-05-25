package com.example.demo.dto;

import lombok.Data;

@Data
public class DashboardStats {
    private long totalBooks;
    private long totalUsers;
    private long totalBorrows;
    private long activeBorrows;
    private long overdueRecords;
    private long totalCategories;
}
