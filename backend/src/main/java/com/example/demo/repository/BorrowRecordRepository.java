package com.example.demo.repository;

import com.example.demo.entity.BorrowRecord;
import com.example.demo.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import java.time.LocalDate;
import java.util.List;

@Repository
public interface BorrowRecordRepository extends JpaRepository<BorrowRecord, Long> {
    List<BorrowRecord> findAllByOrderByCreatedAtDesc();
    List<BorrowRecord> findByUserOrderByCreatedAtDesc(User user);
    List<BorrowRecord> findByBookId(Long bookId);
    long countByUserIdAndStatus(Long userId, String status);
    long countByBookIdAndStatus(Long bookId, String status);
    long countByStatus(String status);
    @Query("SELECT b FROM BorrowRecord b WHERE " +
           "(:userId IS NULL OR b.user.id = :userId) " +
           "AND (:status IS NULL OR b.status = :status) " +
           "ORDER BY b.createdAt DESC")
    List<BorrowRecord> searchRecords(@Param("userId") Long userId, @Param("status") String status);

    @Query("SELECT COUNT(b) FROM BorrowRecord b WHERE b.status = 'BORROWED' AND b.dueDate < CURRENT_DATE")
    long countOverdueRecords();
}
