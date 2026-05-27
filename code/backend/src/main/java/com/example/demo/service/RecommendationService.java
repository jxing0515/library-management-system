package com.example.demo.service;

import com.example.demo.entity.Book;
import com.example.demo.entity.BorrowRecord;
import com.example.demo.entity.User;
import com.example.demo.repository.BookRepository;
import com.example.demo.repository.BorrowRecordRepository;
import com.example.demo.repository.UserRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.*;
import org.springframework.stereotype.Service;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.web.client.HttpClientErrorException;
import org.springframework.web.client.RestTemplate;

import java.io.PrintWriter;
import java.io.StringWriter;
import java.util.*;
import java.util.stream.Collectors;

@Service
public class RecommendationService {

    private String lastRecommendMode = "random";

    public String getLastMode() {
        return lastRecommendMode;
    }

    private static final Logger log = LoggerFactory.getLogger(RecommendationService.class);


    @Value("${ai.api.key}")
    private String apiKey;

    @Value("${ai.api.url}")
    private String apiUrl;

    @Value("${ai.api.model}")
    private String model;

    private final BookRepository bookRepository;
    private final BorrowRecordRepository borrowRecordRepository;
    private final UserRepository userRepository;
    private final RestTemplate restTemplate;

    public RecommendationService(BookRepository bookRepository,
                                 BorrowRecordRepository borrowRecordRepository,
                                 UserRepository userRepository,
                                 RestTemplate restTemplate) {
        this.bookRepository = bookRepository;
        this.borrowRecordRepository = borrowRecordRepository;
        this.userRepository = userRepository;
        this.restTemplate = restTemplate;
    }

    public List<Book> getRecommendations(Long userId, int limit) {
        log.info("===========================================");
        log.info("开始为用户生成推荐 [userId={}]", userId);
        log.info("[诊断] ai.api.url='{}'  ai.api.model='{}'", apiUrl, model);
        User user = userRepository.findById(userId).orElse(null);
        if (user == null) {
            log.warn("用户不存在，返回空推荐");
            return Collections.emptyList();
        }
        log.info("用户: {} (用户名: {})", user.getDisplayName(), user.getUsername());

        List<BorrowRecord> userRecords = borrowRecordRepository.findByUserOrderByCreatedAtDesc(user);
        log.info("用户借阅记录数: {} 本", userRecords.size());
        if (!userRecords.isEmpty()) {
            log.info("已借阅的图书:");
            userRecords.stream()
                    .map(r -> String.format("  - %s by %s", r.getBook().getTitle(), r.getBook().getAuthor()))
                    .distinct()
                    .forEach(log::info);
        }

        Set<Long> borrowedBookIds = userRecords.stream()
                .map(r -> r.getBook().getId())
                .collect(Collectors.toSet());

        List<Book> allBooks = bookRepository.findAll();
        log.info("图书馆总藏书: {} 本", allBooks.size());
        log.info("可推荐图书(排除已借): {} 本", allBooks.size() - borrowedBookIds.size());

        String borrowedContext = buildBorrowedContext(userRecords);
        String availableContext = buildAvailableContext(allBooks, borrowedBookIds);

        List<Book> recommendations = callAiApi(borrowedContext, availableContext, userRecords, limit);

        List<Book> filtered = recommendations.stream()
                .filter(b -> !borrowedBookIds.contains(b.getId()))
                .distinct()
                .limit(limit)
                .collect(Collectors.toList());

        log.info("最终推荐结果 ({} 本):", filtered.size());
        for (int i = 0; i < filtered.size(); i++) {
            Book b = filtered.get(i);
            log.info("  {}. {} by {} [分类: {}] [库存: {}/{}]",
                    i + 1, b.getTitle(), b.getAuthor(),
                    b.getCategory() != null ? b.getCategory().getName() : "未分类",
                    b.getAvailable(), b.getQuantity());
        }
        log.info("===========================================");

        return filtered;
    }

    private String buildBorrowedContext(List<BorrowRecord> records) {
        if (records.isEmpty()) return "No borrowing history (new user)";
        return records.stream()
                .map(r -> String.format("{%s} by %s", r.getBook().getTitle(), r.getBook().getAuthor()))
                .distinct()
                .collect(Collectors.joining(", "));
    }

    private String buildAvailableContext(List<Book> allBooks, Set<Long> excludeIds) {
        return allBooks.stream()
                .filter(b -> !excludeIds.contains(b.getId()))
                .map(b -> String.format("{%s} by %s | Cat: %s | Desc: %s",
                        b.getTitle(), b.getAuthor(),
                        b.getCategory() != null ? b.getCategory().getName() : "N/A",
                        b.getDescription() != null ? b.getDescription() : "N/A"))
                .collect(Collectors.joining(System.lineSeparator()));
    }

    private List<Book> findBooksByTitles(List<String> titles) {
        List<Book> allBooks = bookRepository.findAll();
        return titles.stream()
                .map(title -> {
                    String clean = title.replaceAll("[{}\"'\\s]", "").trim().toLowerCase();
                    if (clean.isEmpty()) return null;
                    return allBooks.stream()
                            .filter(b -> {
                                String bt = b.getTitle().replaceAll("\\s", "").toLowerCase();
                                return bt.contains(clean) || clean.contains(bt);
                            })
                            .findFirst()
                            .orElse(null);
                })
                .filter(Objects::nonNull)
                .collect(Collectors.toList());
    }

    @SuppressWarnings("unchecked")
    private List<Book> callAiApi(String borrowedContext, String availableContext, List<BorrowRecord> userRecords, int limit) {
        if (apiKey == null || apiKey.isEmpty() || apiKey.equals("sk-your-openai-api-key")) {
            log.warn("AI API 未配置 (api.key = {})", apiKey);
            log.info("降级为随机推荐模式 (Fallback)");
            this.lastRecommendMode = userRecords.isEmpty() ? "random" : "category";
            return getFallbackRecommendations(userRecords, limit);
        }

        // 确保 URL 完整
        String fullUrl = apiUrl;
        if (!fullUrl.endsWith("/chat/completions")) {
            if (fullUrl.endsWith("/v1")) {
                fullUrl = fullUrl + "/chat/completions";
            } else if (!fullUrl.endsWith("/")) {
                fullUrl = fullUrl + "/v1/chat/completions";
            }
            log.info("API URL 已自动补全: {} -> {}", apiUrl, fullUrl);
        }

        log.info("AI API 已配置，正在调用: {}", fullUrl);

        try {
            String prompt = "You are a library recommendation system. Based on the user's borrowing history and available books, recommend "
                    + limit + " most suitable books.\n\n"
                    + "User's history:\n" + borrowedContext + "\n\n"
                    + "Available:\n" + availableContext + "\n\n"
                    + "Return ONLY book titles, one per line, no numbering or extra text.";

            log.info("发送 Prompt (长度: {} 字符)", prompt.length());

            Map<String, Object> requestBody = new HashMap<>();
            requestBody.put("model", model);

            List<Map<String, String>> messages = new ArrayList<>();
            messages.add(Map.of("role", "user", "content", prompt));
            requestBody.put("messages", messages);

            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_JSON);
            headers.setBearerAuth(apiKey);

            HttpEntity<Map<String, Object>> entity = new HttpEntity<>(requestBody, headers);

            ResponseEntity<Map> response = restTemplate.exchange(fullUrl, HttpMethod.POST, entity, Map.class);

            this.lastRecommendMode = "ai";
            log.info("AI API 响应状态: {}", response.getStatusCode());

            if (response.getBody() != null) {
                List<Map<String, Object>> choices = (List<Map<String, Object>>) response.getBody().get("choices");
                if (choices != null && !choices.isEmpty()) {
                    Map<String, Object> message = (Map<String, Object>) choices.get(0).get("message");
                    String content = (String) message.get("content");
                    if (content != null) {
                        log.info("AI 返回内容:\n{}", content);
                        List<String> titles = Arrays.stream(content.split("\n"))
                                .map(String::trim)
                                .filter(s -> !s.isEmpty())
                                .map(s -> s.replaceAll("^\\d+[.\\s]*", ""))
                                .collect(Collectors.toList());
                        log.info("解析到 {} 个书名: {}", titles.size(), titles);
                        return findBooksByTitles(titles);
                    }
                }
            }
        } catch (Exception e) {
            log.error("AI API 调用失败: {}", e.getMessage());
            // 打印完整错误堆栈以便调试
            StringWriter sw = new StringWriter();
            PrintWriter pw = new PrintWriter(sw);
            e.printStackTrace(pw);
            log.debug("完整错误: {}", sw.toString());

            // 如果是 404 或 401 等 HTTP 错误，尝试打印响应体
            if (e instanceof HttpClientErrorException) {
                HttpClientErrorException httpEx = (HttpClientErrorException) e;
                log.error("HTTP 状态码: {}, 响应体: {}", httpEx.getStatusCode(), httpEx.getResponseBodyAsString());
            }
            log.info("降级为随机推荐模式");
            this.lastRecommendMode = userRecords.isEmpty() ? "random" : "category";
        }

        return getFallbackRecommendations(userRecords, limit);
    }

    private List<Book> getFallbackRecommendations(List<BorrowRecord> userRecords, int limit) {
        List<Book> allBooks = bookRepository.findAll();
        if (allBooks.isEmpty()) {
            log.warn("图书馆无藏书，返回空列表");
            return Collections.emptyList();
        }

        // 统计用户历史借阅的分类权重
        Map<String, Integer> categoryWeights = new HashMap<>();
        for (BorrowRecord record : userRecords) {
            Book b = record.getBook();
            if (b.getCategory() != null) {
                String catName = b.getCategory().getName();
                categoryWeights.put(catName, categoryWeights.getOrDefault(catName, 0) + 1);
            }
        }

        List<Book> result;
        if (!categoryWeights.isEmpty()) {
            // 基于分类权重的推荐
            log.info("基于借阅历史分类权重推荐:");
            for (Map.Entry<String, Integer> entry : categoryWeights.entrySet()) {
                log.info("  分类: {} - {} 次", entry.getKey(), entry.getValue());
            }

            int totalWeight = categoryWeights.values().stream().mapToInt(Integer::intValue).sum();
            Random rand = new Random();

            // 按权重从每个分类中抽取对应比例的书
            List<Book> candidateBooks = new ArrayList<>(allBooks);
            // 已借过的排除
            Set<Long> borrowedIds = userRecords.stream()
                    .map(r -> r.getBook().getId()).collect(Collectors.toSet());
            candidateBooks.removeIf(b -> borrowedIds.contains(b.getId()));

            // 打乱并分类筛选
            Collections.shuffle(candidateBooks, rand);
            result = new ArrayList<>();
            int targetSize = Math.min(limit, candidateBooks.size());

            // 按权重比例分配每个分类的选取数量
            int remaining = targetSize;
            List<Map.Entry<String, Integer>> sortedCategories = new ArrayList<>(categoryWeights.entrySet());
            sortedCategories.sort((a, b) -> b.getValue().compareTo(a.getValue()));

            for (int i = 0; i < sortedCategories.size() && remaining > 0; i++) {
                Map.Entry<String, Integer> entry = sortedCategories.get(i);
                double ratio = (double) entry.getValue() / totalWeight;
                int take = Math.max(1, (int) Math.round(ratio * targetSize));
                if (i == sortedCategories.size() - 1) take = remaining; // 最后一个分类拿剩余

                List<Book> fromCat = candidateBooks.stream()
                        .filter(b -> b.getCategory() != null && b.getCategory().getName().equals(entry.getKey()))
                        .limit(take)
                        .collect(Collectors.toList());
                result.addAll(fromCat);
                remaining -= fromCat.size();
            }

            // 如果还不够，从其他分类补充
            if (remaining > 0) {
                List<Book> rest = candidateBooks.stream()
                        .filter(b -> result.stream().noneMatch(r -> r.getId().equals(b.getId())))
                        .limit(remaining)
                        .collect(Collectors.toList());
                result.addAll(rest);
            }

            log.info("基于分类权重推荐结果 ({} 本):", result.size());
            for (int i = 0; i < result.size(); i++) {
                Book b = result.get(i);
                log.info("  {}. {} by {} [分类: {}]",
                        i + 1, b.getTitle(), b.getAuthor(),
                        b.getCategory() != null ? b.getCategory().getName() : "N/A");
            }
        } else {
            // 无借阅历史，纯随机推荐
            log.info("用户无借阅历史，采用纯随机推荐: 从 {} 本中随机选 {} 本",
                    allBooks.size(), Math.min(limit, allBooks.size()));
            Collections.shuffle(allBooks, new Random());
            result = allBooks.stream().limit(limit).collect(Collectors.toList());

            log.info("随机选取结果:");
            for (int i = 0; i < result.size(); i++) {
                Book b = result.get(i);
                log.info("  {}. {} by {}", i + 1, b.getTitle(), b.getAuthor());
            }
        }

        return result;
    }
}
