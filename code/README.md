# 📚 智慧图书管理系统

基于 **Spring Boot 4 + Vue 3** 的全栈图书管理系统，支持图书检索、借阅管理、用户管理、智能推荐、数据统计等核心功能，提供角色化权限管理。

---

## 技术栈

| 后端 | 前端 |
|------|------|
| Java 21 + Spring Boot 4.0.6 | Vue 3 (Composition API) |
| Spring Data JPA + MySQL 8.0 | Vite + Element Plus |
| JWT 认证（手动实现） | Pinia + Vue Router |
| Maven + Lombok | Axios + ECharts |

---

## 用户功能清单

> 登录/注册为所有用户共用功能

### ADMIN（系统管理员）— 共 10 项功能

| 序号 | 功能 | 说明 |
|------|------|------|
| 1 | 图书浏览 | 浏览所有图书、搜索图书、查看详情 |
| 2 | 图书管理 | 新增/编辑/删除图书、上传封面 |
| 3 | 借阅管理 | 查看所有借阅记录、代借书、代还书、续借 |
| 4 | 用户管理 | 查看用户列表、编辑信息、删除用户 |
| 5 | 分类管理 | 新增/编辑/删除分类 |
| 6 | 我的借阅 | 查看自己的借阅记录、续借 |
| 7 | 我的收藏 | 收藏/取消收藏图书，查看收藏列表 |
| 8 | 智能推荐 | 基于借阅记录 + AI 推荐图书 |
| 9 | 个人中心 | 查看和编辑个人信息、修改密码 |
| 10 | 更换头像 | 上传和更换个人头像 |

### LIBRARIAN（图书管理员）— 共 8 项功能

| 序号 | 功能 | 说明 |
|------|------|------|
| 1 | 图书浏览 | 浏览所有图书、搜索图书、查看详情 |
| 2 | 图书管理 | 新增/编辑/删除图书、上传封面 |
| 3 | 借阅管理 | 查看所有借阅记录、代借书、代还书、续借 |
| 4 | 我的借阅 | 查看自己的借阅记录、续借 |
| 5 | 我的收藏 | 收藏/取消收藏图书，查看收藏列表 |
| 6 | 智能推荐 | 基于借阅记录 + AI 推荐图书 |
| 7 | 个人中心 | 查看和编辑个人信息、修改密码 |
| 8 | 更换头像 | 上传和更换个人头像 |

### READER（读者）— 共 7 项功能

| 序号 | 功能 | 说明 |
|------|------|------|
| 1 | 图书浏览 | 浏览所有图书、搜索图书、查看详情 |
| 2 | 借阅图书 | 在图书页点击借阅（30天期限） |
| 3 | 我的借阅 | 查看借阅记录、续借、逾期情况 |
| 4 | 我的收藏 | 收藏/取消收藏图书，查看收藏列表 |
| 5 | 智能推荐 | 基于借阅记录 + AI 推荐图书 |
| 6 | 个人中心 | 查看和编辑个人信息、修改密码 |
| 7 | 更换头像 | 上传和更换个人头像 |

---

## 项目结构

```
demo7/
├── backend/                  # Spring Boot 后端
│   ├── src/main/java/.../
│   │   ├── config/           # CORS、拦截器、RestTemplate
│   │   ├── controller/       # RESTful 控制器
│   │   ├── dto/              # 数据传输对象
│   │   ├── entity/           # JPA 实体类
│   │   ├── interceptor/      # JWT 认证拦截器
│   │   ├── repository/       # 数据访问层
│   │   ├── service/          # 业务逻辑层
│   │   └── Demo7Application.java
│   └── src/main/resources/
│       └── application.yaml  # 配置文件
├── frontend/                 # Vue 3 前端
│   └── src/
│       ├── api/              # API 请求封装
│       ├── components/       # 公共组件
│       ├── router/           # 路由配置
│       ├── stores/           # Pinia 状态管理
│       ├── utils/            # 工具函数
│       └── views/            # 页面组件
└── init.sql                  # 数据初始化脚本
```

## 快速开始

### 环境要求

- JDK 21+ / Node.js 18+ / MySQL 8.0+ / Maven 3.9+

### 1. 数据库初始化

```sql
CREATE DATABASE IF NOT EXISTS student_management DEFAULT CHARACTER SET utf8mb4;
```

修改 `backend/src/main/resources/application.yaml` 中的数据库用户名和密码。

### 2. 启动后端

```bash
cd backend
.mvnw clean spring-boot:run
```

服务启动在 `http://localhost:8081`，首次启动自动建表并插入管理员账号。

### 3. 启动前端

```bash
cd frontend
npm install
npm run dev
```

服务启动在 `http://localhost:5173`，API 请求自动代理到后端。

---

## API 接口概览

| 模块 | 方法 | 路径 | 说明 |
|------|------|------|------|
| **认证** | POST | `/api/auth/login` | 登录 |
| | POST | `/api/auth/register` | 注册 |
| **图书** | GET | `/api/books` | 图书列表 |
| | POST | `/api/books` | 新增图书 |
| | PUT | `/api/books/{id}` | 更新图书 |
| | DELETE | `/api/books/{id}` | 删除图书 |
| **借阅** | POST | `/api/borrows/borrow` | 借书 |
| | POST | `/api/borrows/return` | 还书 |
| | GET | `/api/borrows/user/{userId}` | 借阅记录 |
| **收藏** | GET | `/api/favorites/user/{userId}` | 收藏列表 |
| | POST | `/api/favorites/add` | 添加收藏 |
| | DELETE | `/api/favorites/remove` | 取消收藏 |
| **推荐** | GET | `/api/recommendations/user/{userId}` | 智能推荐 |
| **仪表盘** | GET | `/api/dashboard/stats` | 统计数据 |
| **用户** | GET/POST/PUT/DELETE | `/api/users/**` | 用户管理 |
| **分类** | GET/POST/PUT/DELETE | `/api/categories/**` | 分类管理 |

## 智能推荐说明

推荐功能支持三种模式，按优先级降级：

1. **AI 推荐** — 调用 AI API，基于借阅历史智能分析推荐（需配置 `ai.api.key`）
2. **偏好推荐** — AI 不可用时，按借阅历史分类权重随机推荐
3. **随机推荐** — 无借阅历史时纯随机推荐

支持任意 **OpenAI 兼容接口**（如腾讯混元、DeepSeek、通义千问、OpenAI 等），在 `application.yaml` 中配置即可：

```yaml
ai:
  api:
    key: sk-your-api-key           # 你的 API Key
    url: https://api.example.com/v1/chat/completions  # 替换为对应 API 地址
    model: gpt-4o-mini             # 替换为对应模型名
```

---

## 常见问题

**数据库连接失败？** 检查 MySQL 是否启动，及 `application.yaml` 中的连接信息。

**跨域报错？** 后端已配置 CORS，如前端地址不同请修改 `WebConfig.java`。

**如何修改端口？** 后端端口改 `application.yaml` 中 `server.port`，前端端口改 `vite.config.js`。

---

---

## 许可证

本项目仅供学习交流使用。
