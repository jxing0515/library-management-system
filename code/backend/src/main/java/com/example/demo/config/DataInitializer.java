package com.example.demo.config;

import com.example.demo.entity.Book;
import com.example.demo.entity.Category;
import com.example.demo.entity.User;
import com.example.demo.repository.BookRepository;
import com.example.demo.repository.CategoryRepository;
import com.example.demo.repository.UserRepository;
import com.example.demo.service.AuthService;
import org.springframework.boot.CommandLineRunner;
import org.springframework.stereotype.Component;

@Component
public class DataInitializer implements CommandLineRunner {

    private final UserRepository userRepository;
    private final CategoryRepository categoryRepository;
    private final BookRepository bookRepository;

    public DataInitializer(UserRepository userRepository,
                            CategoryRepository categoryRepository,
                            BookRepository bookRepository) {
        this.userRepository = userRepository;
        this.categoryRepository = categoryRepository;
        this.bookRepository = bookRepository;
    }

    @Override
    public void run(String... args) {
        // Initialize users only if empty
        if (userRepository.count() == 0) {
            var admin = new User();
            admin.setUsername("admin");
            admin.setPassword(AuthService.encryptPassword("admin123"));
            admin.setRole("ADMIN");
            admin.setDisplayName("系统管理员");
            admin.setEmail("admin@library.com");
            admin.setPhone("13800000001");
            admin.setStatus("ACTIVE");
            userRepository.save(admin);

            var librarian = new User();
            librarian.setUsername("librarian");
            librarian.setPassword(AuthService.encryptPassword("lib123"));
            librarian.setRole("LIBRARIAN");
            librarian.setDisplayName("图书管理员");
            librarian.setEmail("librarian@library.com");
            librarian.setPhone("13800000002");
            librarian.setStatus("ACTIVE");
            userRepository.save(librarian);

            var reader = new User();
            reader.setUsername("reader");
            reader.setPassword(AuthService.encryptPassword("read123"));
            reader.setRole("READER");
            reader.setDisplayName("普通读者");
            reader.setEmail("reader@library.com");
            reader.setPhone("13800000003");
            reader.setStatus("ACTIVE");
            userRepository.save(reader);

            System.out.println("--- 初始用户已创建 ---");
            System.out.println("管理员: admin / admin123");
            System.out.println("图书管理员: librarian / lib123");
            System.out.println("读者: reader / read123");
        }

        // Initialize categories only if empty
        if (categoryRepository.count() == 0) {
            createCategory("计算机科学", "计算机编程、软件开发相关书籍");
            createCategory("文学小说", "文学作品、小说、散文等");
            createCategory("自然科学", "物理、化学、生物等自然科学类");
            createCategory("历史地理", "历史、地理类书籍");
            createCategory("艺术设计", "艺术、设计类书籍");
            createCategory("经济管理", "经济、管理、商业类书籍");
            System.out.println("--- 初始分类已创建 ---");
        }

        // Initialize books only if empty
        if (bookRepository.count() == 0) {
            var cs = categoryRepository.findByName("计算机科学").orElse(null);
            var lit = categoryRepository.findByName("文学小说").orElse(null);
            var science = categoryRepository.findByName("自然科学").orElse(null);
            var history = categoryRepository.findByName("历史地理").orElse(null);
            var art = categoryRepository.findByName("艺术设计").orElse(null);
            var econ = categoryRepository.findByName("经济管理").orElse(null);

            if (cs != null) {
                createBook("Java核心技术 卷I", "Cay S. Horstmann", "978-7-111-23456-7", "机械工业出版社", cs, 10, 8, "Java编程经典教材，全面介绍Java核心技术");
                createBook("Spring实战 第6版", "Craig Walls", "978-7-115-56789-0", "人民邮电出版社", cs, 8, 6, "Spring框架入门与进阶指南");
                createBook("深入理解计算机系统", "Randal E. Bryant", "978-7-111-34567-8", "机械工业出版社", cs, 5, 4, "计算机系统核心知识");
                createBook("算法导论", "Thomas H. Cormen", "978-7-111-45678-9", "机械工业出版社", cs, 6, 5, "经典算法教材");
                createBook("Python编程从入门到实践", "Eric Matthes", "978-7-115-56780-1", "人民邮电出版社", cs, 12, 10, "Python入门经典");
            }
            if (lit != null) {
                createBook("百年孤独", "加西亚·马尔克斯", "978-7-5442-1234-5", "南海出版社", lit, 8, 6, "魔幻现实主义文学名著");
                createBook("活着", "余华", "978-7-5063-2345-6", "作家出版社", lit, 15, 12, "中国当代文学经典");
                createBook("三体", "刘慈欣", "978-7-5366-3456-7", "重庆出版社", lit, 20, 15, "中国科幻文学里程碑");
                createBook("红楼梦", "曹雪芹", "978-7-0200-4567-8", "人民文学出版社", lit, 5, 3, "中国古典四大名著之一");
            }
            if (science != null) {
                createBook("时间简史", "斯蒂芬·霍金", "978-7-5357-5678-9", "湖南科学技术出版社", science, 7, 5, "宇宙学经典科普读物");
                createBook("物种起源", "达尔文", "978-7-301-6789-0", "北京大学出版社", science, 4, 3, "进化论奠基之作");
            }
            if (history != null) {
                createBook("人类简史", "尤瓦尔·赫拉利", "978-7-5086-7890-1", "中信出版社", history, 10, 8, "从动物到上帝");
                createBook("明朝那些事儿", "当年明月", "978-7-213-8901-2", "浙江人民出版社", history, 18, 14, "幽默解读明朝历史");
            }
            if (art != null) {
                createBook("设计中的设计", "原研哉", "978-7-5321-9012-3", "山东人民出版社", art, 6, 4, "设计理念经典之作");
            }
            if (econ != null) {
                createBook("国富论", "亚当·斯密", "978-7-100-0123-4", "商务印书馆", econ, 5, 4, "经济学奠基之作");
                createBook("穷查理宝典", "彼得·考夫曼", "978-7-5086-2345-6", "中信出版社", econ, 8, 6, "查理·芒格的智慧箴言");
            }
            System.out.println("--- 初始图书已创建 ---");
        }
    }

    private void createCategory(String name, String description) {
        var cat = new Category();
        cat.setName(name);
        cat.setDescription(description);
        categoryRepository.save(cat);
    }

    private void createBook(String title, String author, String isbn, String publisher,
                             Category category, int quantity, int available, String description) {
        var book = new Book();
        book.setTitle(title);
        book.setAuthor(author);
        book.setIsbn(isbn);
        book.setPublisher(publisher);
        book.setCategory(category);
        book.setQuantity(quantity);
        book.setAvailable(available);
        book.setDescription(description);
        bookRepository.save(book);
    }
}
