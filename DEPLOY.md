# RAG 知识库系统 — 部署说明书

## 目录

1. [系统要求](#1-系统要求)
2. [本地开发环境搭建](#2-本地开发环境搭建)
3. [环境变量配置](#3-环境变量配置)
4. [生产部署方案](#4-生产部署方案)
   - 4.1 [方案A：VPS / 云服务器（推荐）](#41-方案a-vps--云服务器推荐)
   - 4.2 [方案B：Railway](#42-方案b-railway)
   - 4.3 [方案C：Vercel](#43-方案c-vercel)
5. [注意事项](#5-注意事项)
6. [常见问题](#6-常见问题)

---

## 1. 系统要求

| 项目 | 最低要求 | 推荐 |
|------|---------|------|
| Node.js | 20.x | 22.x LTS |
| Bun | 1.x | 最新版 |
| 内存 | 512 MB | 1 GB+ |
| 磁盘 | 500 MB | 2 GB+（存储文档） |
| 操作系统 | Linux / macOS / Windows WSL2 | Ubuntu 22.04 |

> **注意**：better-sqlite3 是原生模块，需要 Node.js 原生编译环境（build-essential / python3），不支持纯 Edge Runtime 或 Serverless 函数。

---

## 2. 本地开发环境搭建

### 第一步：安装 Bun

```bash
# macOS / Linux
curl -fsSL https://bun.sh/install | bash

# 验证安装
bun --version
```

### 第二步：克隆项目

```bash
git clone https://github.com/<你的用户名>/<仓库名>.git
cd <仓库名>
```

### 第三步：安装依赖

```bash
bun install
```

> 这会自动编译 `better-sqlite3` 原生模块，首次安装需要几十秒。

### 第四步：配置环境变量（可选）

```bash
cp .env.example .env.local   # 如果没有 .env.example，手动创建
```

编辑 `.env.local`：

```env
# 可选：填写后启用 OpenAI 向量化和智能问答
# 不填则使用哈希向量（仍可正常检索，但精度较低）
OPENAI_API_KEY=sk-xxxxxxxxxxxxxxxxxxxxxxxx

# 可选：指定模型，默认 gpt-4o-mini
OPENAI_MODEL=gpt-4o-mini
```

### 第五步：启动开发服务器

```bash
bun dev
```

浏览器访问 [http://localhost:3000](http://localhost:3000)

数据库文件 `rag.db` 会在项目根目录自动创建。

---

## 3. 环境变量配置

| 变量名 | 是否必需 | 说明 |
|--------|---------|------|
| `OPENAI_API_KEY` | 否 | OpenAI API Key，用于向量嵌入（text-embedding-3-small）和问答（GPT-4o-mini）。不配置时系统会用哈希向量回退，仍可使用但语义搜索精度较低。 |
| `OPENAI_MODEL` | 否 | 指定问答模型，默认 `gpt-4o-mini`，可改为 `gpt-4o` 等。 |

---

## 4. 生产部署方案

### 4.1 方案A：VPS / 云服务器（推荐）

适合：阿里云、腾讯云、AWS EC2、DigitalOcean、Hetzner 等，数据持久化最稳定。

#### 4.1.1 服务器初始化（Ubuntu 22.04 为例）

```bash
# 更新系统
sudo apt update && sudo apt upgrade -y

# 安装编译工具（better-sqlite3 需要）
sudo apt install -y build-essential python3 git

# 安装 Node.js 20
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs

# 安装 Bun
curl -fsSL https://bun.sh/install | bash
source ~/.bashrc

# 安装 PM2（进程守护）
npm install -g pm2
```

#### 4.1.2 部署项目

```bash
# 克隆代码
git clone https://github.com/<你的用户名>/<仓库名>.git /opt/ragapp
cd /opt/ragapp

# 安装依赖
bun install

# 配置环境变量
cat > .env.local << 'EOF'
OPENAI_API_KEY=sk-xxxxxxxxxxxxxxxxxxxxxxxx
OPENAI_MODEL=gpt-4o-mini
EOF

# 构建生产版本
bun run build

# 用 PM2 启动（监听 3000 端口）
pm2 start "bun start" --name ragapp
pm2 save
pm2 startup   # 按提示执行输出的命令，设置开机自启
```

#### 4.1.3 配置 Nginx 反向代理（可选，推荐）

```bash
sudo apt install -y nginx

# 创建配置文件
sudo nano /etc/nginx/sites-available/ragapp
```

填入以下内容（替换 `your-domain.com`）：

```nginx
server {
    listen 80;
    server_name your-domain.com;

    client_max_body_size 50M;   # 允许上传最大 50MB 文件

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_cache_bypass $http_upgrade;
    }
}
```

```bash
sudo ln -s /etc/nginx/sites-available/ragapp /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
```

#### 4.1.4 配置 HTTPS（Let's Encrypt）

```bash
sudo apt install -y certbot python3-certbot-nginx
sudo certbot --nginx -d your-domain.com
```

#### 4.1.5 后续更新代码

```bash
cd /opt/ragapp
git pull
bun install
bun run build
pm2 restart ragapp
```

---

### 4.2 方案B：Railway

Railway 支持 Node.js 服务，数据库文件存储在持久化磁盘上。

#### 步骤

1. 访问 [railway.app](https://railway.app) 并登录
2. 点击 **New Project** → **Deploy from GitHub repo**，选择本仓库
3. Railway 会自动检测 Next.js 项目
4. 在项目设置中点击 **Variables**，添加环境变量：
   ```
   OPENAI_API_KEY = sk-xxx
   OPENAI_MODEL   = gpt-4o-mini
   ```
5. 在 **Settings → Volumes** 中挂载一个持久化卷到 `/app` 目录（确保 `rag.db` 不会在重启后丢失）
6. 设置启动命令（如 Railway 未自动识别）：
   ```
   bun run build && bun start
   ```

> **注意**：Railway 免费套餐有每月 500 小时限制，推荐升级到 Hobby 套餐（$5/月）。

---

### 4.3 方案C：Vercel

> **重要限制**：Vercel 的 Serverless Functions 不支持原生模块（`better-sqlite3`）和本地文件写入，因此**本项目无法直接部署到 Vercel**。
>
> 如需使用 Vercel，需将数据库替换为 Vercel Postgres 或 Turso，工程量较大。**推荐使用方案A或B。**

---

## 5. 注意事项

### 数据库文件持久化

本项目使用 SQLite，数据库文件 `rag.db` 存储在项目根目录。

- **VPS 部署**：文件在磁盘上，天然持久化，建议定期备份：
  ```bash
  cp /opt/ragapp/rag.db /opt/ragapp/backup/rag_$(date +%Y%m%d).db
  ```
- **容器部署**（Docker）：必须挂载数据卷，否则容器重启后数据丢失：
  ```
  -v /host/data:/app/data
  ```

### GitHub Pages 不可用

项目根目录有 `.github/workflows/deploy.yml`，它原本配置为 GitHub Pages 部署，但本项目包含 API 路由和 SQLite，**无法使用 GitHub Pages**（静态托管不支持服务端代码）。请忽略该 workflow 或将其删除。

### 文件上传大小

默认 Next.js 限制请求体为 4MB。如需上传大型 PDF，在 API 路由中已有处理，但 Nginx 层需同步调整 `client_max_body_size`（见上文 Nginx 配置）。

---

## 6. 常见问题

**Q：启动时报错 `Cannot find module 'better-sqlite3'`**

```bash
bun install   # 重新安装，触发原生模块编译
```

如果仍然报错，检查是否安装了编译工具：
```bash
sudo apt install -y build-essential python3
```

---

**Q：OpenAI API 调用失败，但我配置了 API Key**

检查 `.env.local` 文件是否在项目根目录，变量名是否正确（注意没有多余空格）。也可以在终端临时测试：
```bash
OPENAI_API_KEY=sk-xxx bun start
```

---

**Q：不配置 OpenAI API Key 能用吗？**

可以。系统会自动回退：
- 向量嵌入：使用哈希函数生成伪向量（检索可用，语义精度较低）
- 智能问答：直接返回检索到的原文片段，不经过 GPT 生成

---

**Q：如何备份和恢复数据？**

```bash
# 备份
cp rag.db rag_backup_$(date +%Y%m%d).db

# 恢复
cp rag_backup_20260101.db rag.db
pm2 restart ragapp
```

---

**Q：PM2 常用命令**

```bash
pm2 list              # 查看所有进程
pm2 logs ragapp       # 查看实时日志
pm2 restart ragapp    # 重启
pm2 stop ragapp       # 停止
pm2 delete ragapp     # 删除
```

---

**Q：端口 3000 已被占用**

```bash
# 用其他端口启动
PORT=3001 bun start

# 或者查找并结束占用进程
sudo lsof -i :3000
sudo kill -9 <PID>
```
