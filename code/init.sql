-- =====================================================
-- 智慧图书管理系统
-- 数据库初始化脚本
-- 目标数据库: student_management (MySQL 8.0.34)
-- =====================================================

-- 创建数据库（如不存在）
CREATE DATABASE IF NOT EXISTS `student_management`
  DEFAULT CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

USE `student_management`;

-- =====================================================
-- 1. 删除旧表（按外键依赖顺序）
-- =====================================================
DROP TABLE IF EXISTS `borrow_records`;
DROP TABLE IF EXISTS `books`;
DROP TABLE IF EXISTS `categories`;
DROP TABLE IF EXISTS `users`;

-- =====================================================
-- 2. 用户表
-- =====================================================
CREATE TABLE `users` (
    `id`          BIGINT       NOT NULL AUTO_INCREMENT COMMENT '用户ID',
    `username`    VARCHAR(50)  NOT NULL                COMMENT '用户名',
    `password`    VARCHAR(200) NOT NULL                COMMENT '密码(SHA-256)',
    `role`        VARCHAR(20)  NOT NULL                COMMENT '角色: ADMIN/LIBRARIAN/READER',
    `display_name` VARCHAR(50) DEFAULT NULL            COMMENT '显示名称',
    `email`       VARCHAR(100) DEFAULT NULL            COMMENT '邮箱',
    `phone`       VARCHAR(20)  DEFAULT NULL            COMMENT '手机号',
    `status`      VARCHAR(10)  DEFAULT 'ACTIVE'        COMMENT '状态: ACTIVE/DISABLED',
    `created_at`  DATETIME(6)  DEFAULT NULL            COMMENT '创建时间',
    `updated_at`  DATETIME(6)  DEFAULT NULL            COMMENT '更新时间',
    PRIMARY KEY (`id`),
    UNIQUE KEY `uk_username` (`username`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='用户表';

-- =====================================================
-- 3. 分类表
-- =====================================================
CREATE TABLE `categories` (
    `id`          BIGINT       NOT NULL AUTO_INCREMENT COMMENT '分类ID',
    `name`        VARCHAR(50)  NOT NULL                COMMENT '分类名称',
    `description` VARCHAR(200) DEFAULT NULL            COMMENT '分类描述',
    `created_at`  DATETIME(6)  DEFAULT NULL            COMMENT '创建时间',
    `updated_at`  DATETIME(6)  DEFAULT NULL            COMMENT '更新时间',
    PRIMARY KEY (`id`),
    UNIQUE KEY `uk_name` (`name`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='图书分类表';

-- =====================================================
-- 4. 图书表
-- =====================================================
CREATE TABLE `books` (
    `id`          BIGINT       NOT NULL AUTO_INCREMENT COMMENT '图书ID',
    `title`       VARCHAR(200) NOT NULL                COMMENT '书名',
    `author`      VARCHAR(100) NOT NULL                COMMENT '作者',
    `isbn`        VARCHAR(20)  DEFAULT NULL            COMMENT 'ISBN编号',
    `publisher`   VARCHAR(100) DEFAULT NULL            COMMENT '出版社',
    `category_id` BIGINT       DEFAULT NULL            COMMENT '分类ID',
    `quantity`    INT          NOT NULL DEFAULT 0      COMMENT '库存总量',
    `available`   INT          NOT NULL DEFAULT 0      COMMENT '可借数量',
    `description` TEXT         DEFAULT NULL            COMMENT '简介',
    `cover_url`   VARCHAR(500) DEFAULT NULL            COMMENT '封面图片URL',
    `created_at`  DATETIME(6)  DEFAULT NULL            COMMENT '创建时间',
    `updated_at`  DATETIME(6)  DEFAULT NULL            COMMENT '更新时间',
    PRIMARY KEY (`id`),
    UNIQUE KEY `uk_isbn` (`isbn`),
    KEY `idx_category` (`category_id`),
    CONSTRAINT `fk_book_category` FOREIGN KEY (`category_id`) REFERENCES `categories` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='图书表';

-- =====================================================
-- 5. 借阅记录表
-- =====================================================
CREATE TABLE `borrow_records` (
    `id`          BIGINT       NOT NULL AUTO_INCREMENT COMMENT '记录ID',
    `user_id`     BIGINT       NOT NULL                COMMENT '用户ID',
    `book_id`     BIGINT       NOT NULL                COMMENT '图书ID',
    `borrow_date` DATE         NOT NULL                COMMENT '借书日期',
    `due_date`    DATE         NOT NULL                COMMENT '应还日期',
    `return_date` DATE         DEFAULT NULL            COMMENT '实际归还日期',
    `status`      VARCHAR(20)  NOT NULL                COMMENT '状态: BORROWED/RETURNED/OVERDUE',
    `created_at`  DATETIME(6)  DEFAULT NULL            COMMENT '创建时间',
    `updated_at`  DATETIME(6)  DEFAULT NULL            COMMENT '更新时间',
    PRIMARY KEY (`id`),
    KEY `idx_user` (`user_id`),
    KEY `idx_book` (`book_id`),
    KEY `idx_status` (`status`),
    CONSTRAINT `fk_borrow_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`),
    CONSTRAINT `fk_borrow_book` FOREIGN KEY (`book_id`) REFERENCES `books` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='借阅记录表';

-- =====================================================
-- 6. 初始数据
-- =====================================================

-- 6.1 初始用户（密码为 SHA-256 加密）
-- admin   / admin123
-- librarian / lib123
-- reader  / read123
INSERT INTO `users` (`username`, `password`, `role`, `display_name`, `email`, `phone`, `status`, `created_at`, `updated_at`) VALUES
('admin',     '240be518fabd2724ddb6f04eeb1da5967448d7e831c08c8fa822809f74c720a9', 'ADMIN',     '系统管理员', 'admin@library.com',     '13800000001', 'ACTIVE', NOW(), NOW()),
('librarian', '0b82e3bb3c19d48ed4eaaa73b3a79f013a1edbd9a3525e70fa62a70da9f2417d', 'LIBRARIAN', '图书管理员', 'librarian@library.com', '13800000002', 'ACTIVE', NOW(), NOW()),
('reader',    '0f0fe4e36e3680e08de7af826b8189ca2c40d9e25c63e2b2d46b2de16f89808d', 'READER',    '普通读者',   'reader@library.com',    '13800000003', 'ACTIVE', NOW(), NOW());

-- 6.2 初始分类
INSERT INTO `categories` (`name`, `description`, `created_at`, `updated_at`) VALUES
('计算机科学', '计算机编程、软件开发相关书籍', NOW(), NOW()),
('文学小说',   '文学作品、小说、散文等',       NOW(), NOW()),
('自然科学',   '物理、化学、生物等自然科学类', NOW(), NOW()),
('历史地理',   '历史、地理类书籍',             NOW(), NOW()),
('艺术设计',   '艺术、设计类书籍',             NOW(), NOW()),
('经济管理',   '经济、管理、商业类书籍',       NOW(), NOW());

-- 6.3 初始图书
INSERT INTO `books` (`title`, `author`, `isbn`, `publisher`, `category_id`, `quantity`, `available`, `description`, `created_at`, `updated_at`) VALUES
('Java核心技术 卷I',         'Cay S. Horstmann', '978-7-111-23456-7', '机械工业出版社',   1, 10, 8,  'Java编程经典教材，全面介绍Java核心技术', NOW(), NOW()),
('Spring实战 第6版',        'Craig Walls',      '978-7-115-56789-0', '人民邮电出版社',   1,  8, 6,  'Spring框架入门与进阶指南',           NOW(), NOW()),
('深入理解计算机系统',      'Randal E. Bryant', '978-7-111-34567-8', '机械工业出版社',   1,  5, 4,  '计算机系统核心知识',                 NOW(), NOW()),
('算法导论',                'Thomas H. Cormen', '978-7-111-45678-9', '机械工业出版社',   1,  6, 5,  '经典算法教材',                       NOW(), NOW()),
('Python编程从入门到实践', 'Eric Matthes',     '978-7-115-56780-1', '人民邮电出版社',   1, 12, 10, 'Python入门经典',                     NOW(), NOW()),
('百年孤独',                '加西亚·马尔克斯', '978-7-5442-1234-5', '南海出版社',       2,  8, 6,  '魔幻现实主义文学名著',               NOW(), NOW()),
('活着',                    '余华',             '978-7-5063-2345-6', '作家出版社',       2, 15, 12, '中国当代文学经典',                   NOW(), NOW()),
('三体',                    '刘慈欣',           '978-7-5366-3456-7', '重庆出版社',       2, 20, 15, '中国科幻文学里程碑',                 NOW(), NOW()),
('红楼梦',                  '曹雪芹',           '978-7-0200-4567-8', '人民文学出版社',   2,  5, 3,  '中国古典四大名著之一',               NOW(), NOW()),
('时间简史',                '斯蒂芬·霍金',     '978-7-5357-5678-9', '湖南科学技术出版社', 3,  7, 5,  '宇宙学经典科普读物',                 NOW(), NOW()),
('物种起源',                '达尔文',           '978-7-301-6789-0', '北京大学出版社',   3,  4, 3,  '进化论奠基之作',                     NOW(), NOW()),
('人类简史',                '尤瓦尔·赫拉利',   '978-7-5086-7890-1', '中信出版社',       4, 10, 8,  '从动物到上帝',                       NOW(), NOW()),
('明朝那些事儿',            '当年明月',         '978-7-213-8901-2', '浙江人民出版社',   4, 18, 14, '幽默解读明朝历史',                   NOW(), NOW()),
('设计中的设计',            '原研哉',           '978-7-5321-9012-3', '山东人民出版社',   5,  6, 4,  '设计理念经典之作',                   NOW(), NOW()),
('国富论',                  '亚当·斯密',       '978-7-100-0123-4', '商务印书馆',       6,  5, 4,  '经济学奠基之作',                     NOW(), NOW()),
('穷查理宝典',              '彼得·考夫曼',     '978-7-5086-2345-6', '中信出版社',       6,  8, 6,  '查理·芒格的智慧箴言',               NOW(), NOW());

-- =====================================================
-- 7. 收藏夹表
-- =====================================================
DROP TABLE IF EXISTS `favorites`;
CREATE TABLE `favorites` (
    `id`          BIGINT       NOT NULL AUTO_INCREMENT COMMENT '收藏ID',
    `user_id`     BIGINT       NOT NULL                COMMENT '用户ID',
    `book_id`     BIGINT       NOT NULL                COMMENT '图书ID',
    `created_at`  DATETIME     DEFAULT CURRENT_TIMESTAMP COMMENT '收藏时间',
    PRIMARY KEY (`id`),
    UNIQUE KEY `uk_user_book` (`user_id`, `book_id`),
    CONSTRAINT `fk_fav_user` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE,
    CONSTRAINT `fk_fav_book` FOREIGN KEY (`book_id`) REFERENCES `books`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='收藏夹表';
