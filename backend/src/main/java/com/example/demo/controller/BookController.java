package com.example.demo.controller;

import com.example.demo.dto.ApiResponse;
import com.example.demo.entity.Book;
import com.example.demo.service.BookService;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;
import java.io.File;
import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/books")
public class BookController {

    private final BookService bookService;

    public BookController(BookService bookService) {
        this.bookService = bookService;
    }

    @GetMapping
    public ApiResponse<List<Book>> findAll() {
        return ApiResponse.success(bookService.findAll());
    }

    @GetMapping("/{id}")
    public ApiResponse<Book> findById(@PathVariable Long id) {
        return ApiResponse.success(bookService.findById(id));
    }

    @GetMapping("/search")
    public ApiResponse<List<Book>> search(
            @RequestParam(required = false) String keyword,
            @RequestParam(required = false) Long categoryId) {
        return ApiResponse.success(bookService.search(keyword, categoryId));
    }

    @PostMapping
    public ApiResponse<Book> create(@RequestBody Book book) {
        try {
            return ApiResponse.success("创建成功", bookService.create(book));
        } catch (RuntimeException e) {
            return ApiResponse.error(e.getMessage());
        }
    }

    @PutMapping("/{id}")
    public ApiResponse<Book> update(@PathVariable Long id, @RequestBody Book book) {
        try {
            return ApiResponse.success("更新成功", bookService.update(id, book));
        } catch (RuntimeException e) {
            return ApiResponse.error(e.getMessage());
        }
    }

    @DeleteMapping("/{id}")
    public ApiResponse<Void> delete(@PathVariable Long id) {
        try {
            bookService.delete(id);
            return ApiResponse.success("删除成功", null);
        } catch (RuntimeException e) {
            return ApiResponse.error(e.getMessage());
        }
    }

    @PostMapping("/{id}/cover")
    public ApiResponse<String> uploadCover(@PathVariable Long id, @RequestParam("file") MultipartFile file) {
        try {
            if (file.isEmpty()) {
                return ApiResponse.error("请选择文件");
            }
            String contentType = file.getContentType();
            if (contentType == null || !contentType.startsWith("image/")) {
                return ApiResponse.error("只允许上传图片文件");
            }
            if (file.getSize() > 5 * 1024 * 1024) {
                return ApiResponse.error("文件大小不能超过5MB");
            }
            String originalFilename = file.getOriginalFilename();
            String ext = "";
            if (originalFilename != null && originalFilename.contains(".")) {
                ext = originalFilename.substring(originalFilename.lastIndexOf("."));
            }
            String filename = "cover_" + id + "_" + UUID.randomUUID().toString().substring(0, 8) + ext;
            String uploadDir = "uploads/covers";
            File dir = new File(uploadDir);
            if (!dir.exists()) {
                dir.mkdirs();
            }
            Path filePath = Paths.get(uploadDir, filename);
            Files.copy(file.getInputStream(), filePath);
            String coverUrl = "/uploads/covers/" + filename;
            var book = bookService.findById(id);
            book.setCoverUrl(coverUrl);
            bookService.updateBook(book);
            return ApiResponse.success("封面上传成功", coverUrl);
        } catch (IOException e) {
            return ApiResponse.error("封面上传失败: " + e.getMessage());
        }
    }
}