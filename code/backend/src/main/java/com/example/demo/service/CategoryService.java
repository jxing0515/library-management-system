package com.example.demo.service;

import com.example.demo.entity.Category;
import com.example.demo.repository.BookRepository;
import com.example.demo.repository.CategoryRepository;
import org.springframework.stereotype.Service;
import java.util.List;

@Service
public class CategoryService {

    private final CategoryRepository categoryRepository;
    private final BookRepository bookRepository;

    public CategoryService(CategoryRepository categoryRepository, BookRepository bookRepository) {
        this.categoryRepository = categoryRepository;
        this.bookRepository = bookRepository;
    }

    public List<Category> findAll() {
        return categoryRepository.findAll();
    }

    public Category findById(Long id) {
        return categoryRepository.findById(id).orElseThrow(() -> new RuntimeException("分类不存在"));
    }

    public Category create(Category category) {
        if (categoryRepository.existsByName(category.getName())) {
            throw new RuntimeException("分类名称已存在");
        }
        return categoryRepository.save(category);
    }

    public Category update(Long id, Category category) {
        var existing = findById(id);
        if (category.getName() != null) existing.setName(category.getName());
        if (category.getDescription() != null) existing.setDescription(category.getDescription());
        return categoryRepository.save(existing);
    }

    public void delete(Long id) {
        var category = findById(id);
        var booksInCategory = bookRepository.findByCategory(category);
        if (!booksInCategory.isEmpty()) {
            throw new RuntimeException("该分类下有 " + booksInCategory.size() + " 本图书，无法删除。请先将这些图书移动到其他分类，再尝试删除。");
        }
        categoryRepository.delete(category);
    }
}
