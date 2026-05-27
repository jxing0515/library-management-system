package com.example.demo.service;

import com.example.demo.entity.Book;
import com.example.demo.entity.BorrowRecord;
import com.example.demo.entity.User;
import com.example.demo.repository.BorrowRecordRepository;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.time.LocalDate;
import java.util.List;

@Service
public class BorrowRecordService {

    private final BorrowRecordRepository borrowRecordRepository;
    private final BookService bookService;
    private final UserService userService;

    public BorrowRecordService(BorrowRecordRepository borrowRecordRepository,
                                BookService bookService, UserService userService) {
        this.borrowRecordRepository = borrowRecordRepository;
        this.bookService = bookService;
        this.userService = userService;
    }

    public List<BorrowRecord> findAll() {
        return borrowRecordRepository.findAllByOrderByCreatedAtDesc();
    }

    public BorrowRecord findById(Long id) {
        return borrowRecordRepository.findById(id).orElseThrow(() -> new RuntimeException("借阅记录不存在"));
    }

    public List<BorrowRecord> findByUser(Long userId) {
        var user = userService.findById(userId);
        return borrowRecordRepository.findByUserOrderByCreatedAtDesc(user);
    }

    public List<BorrowRecord> search(Long userId, String status, String keyword) {
        return borrowRecordRepository.searchRecords(userId, status, keyword);
    }

    @Transactional
    public BorrowRecord borrowBook(Long userId, Long bookId) {
        var user = userService.findById(userId);
        var book = bookService.findById(bookId);

        long activeBorrows = borrowRecordRepository.countByUserIdAndStatus(userId, "BORROWED");
        if (activeBorrows >= 5) {
            throw new RuntimeException("您已达到最大借阅数量(5本)，请先归还部分图书");
        }

        if (book.getAvailable() <= 0) {
            throw new RuntimeException("该书暂无库存");
        }

        var record = new BorrowRecord();
        record.setUser(user);
        record.setBook(book);
        record.setBorrowDate(LocalDate.now());
        record.setDueDate(LocalDate.now().plusDays(30));
        record.setStatus("BORROWED");
        record.setRenewCount(0);

        book.setAvailable(book.getAvailable() - 1);
        bookService.update(book.getId(), book);

        return borrowRecordRepository.save(record);
    }

    @Transactional
    public BorrowRecord returnBook(Long recordId) {
        var record = findById(recordId);
        if (!"BORROWED".equals(record.getStatus())) {
            throw new RuntimeException("该记录状态不是借出状态");
        }
        record.setReturnDate(LocalDate.now());
        record.setStatus("RETURNED");

        var book = record.getBook();
        // Don't let available exceed quantity
        int newAvailable = Math.min(book.getAvailable() + 1, book.getQuantity());
        book.setAvailable(newAvailable);
        bookService.update(book.getId(), book);

        return borrowRecordRepository.save(record);
    }

    @Transactional
    public BorrowRecord renewBook(Long recordId) {
        var record = findById(recordId);
        if (!"BORROWED".equals(record.getStatus())) {
            throw new RuntimeException("只能续借借出中的图书");
        }
        int currentRenew = record.getRenewCount() != null ? record.getRenewCount() : 0;
        if (currentRenew >= 2) {
            throw new RuntimeException("已达到最大续借次数(2次)，无法继续续借");
        }
        record.setDueDate(record.getDueDate().plusDays(14));
        record.setRenewCount(currentRenew + 1);
        return borrowRecordRepository.save(record);
    }

    public long getActiveBorrowCount(Long userId) {
        return borrowRecordRepository.countByUserIdAndStatus(userId, "BORROWED");
    }

    public long getTotalBorrowCount() {
        return borrowRecordRepository.count();
    }

    public long getOverdueCount() {
        return borrowRecordRepository.countOverdueRecords();
    }

    public long getActiveBorrowCountAll() {
        return borrowRecordRepository.countByStatus("BORROWED");
    }

    /**
     * Periodically mark overdue records (runs every hour).
     * Also called on application startup.
     */
    @Transactional
    @Scheduled(fixedRate = 3600000)
    public void checkAndUpdateOverdueRecords() {
        List<BorrowRecord> overdueRecords = borrowRecordRepository.findOverdueRecords();
        for (BorrowRecord record : overdueRecords) {
            // Only mark as OVERDUE if currently BORROWED and past due date
            if ("BORROWED".equals(record.getStatus()) &&
                record.getDueDate() != null &&
                record.getDueDate().isBefore(LocalDate.now())) {
                record.setStatus("OVERDUE");
                borrowRecordRepository.save(record);
            }
        }
        if (!overdueRecords.isEmpty()) {
            org.slf4j.LoggerFactory.getLogger(getClass()).info("逾期记录更新: {} 条标记为逾期", overdueRecords.size());
        }
    }

    }
