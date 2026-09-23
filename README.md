# QLTS

QLTS là hệ thống quản lý tài sản nội bộ, xây dựng theo hướng self-host, ít phụ thuộc dịch vụ cloud và ưu tiên trải nghiệm điều hướng nhanh.

## Kiến trúc

```text
Browser
   │
   ▼
Next.js 16 App Router
   │
   ├── Server Components ──► Prisma ──► PostgreSQL
   │
   └── Server Actions ─────► Prisma ──► PostgreSQL
```

Không có một REST API riêng chỉ để web tự gọi chính nó. Những phần cần API cho mobile hoặc tích hợp ngoài có thể bổ sung bằng Route Handlers trong `app/api`.

## Stack

- Next.js **16.3.6**
- React 19
- TypeScript
- PostgreSQL 16 self-host
- Prisma ORM
- Docker / Docker Compose
- Lucide icons

## Chức năng hiện có

- Dashboard tổng quan tài sản.
- Danh sách tài sản với tìm kiếm và lọc trạng thái ở client.
- Tạo tài sản.
- Trang chi tiết tài sản.
- Bàn giao tài sản cho nhân viên.
- Hoàn trả tài sản.
- Lưu lịch sử bàn giao.
- Audit log ở tầng dữ liệu.
- Quản lý danh mục.
- Quản lý vị trí.
- Quản lý nhân viên và số tài sản đang giữ.
- Việt/Anh bằng cookie, mặc định tiếng Việt.
- Persistent dashboard layout.
- Next.js Link prefetch + route loading skeleton.
- Health endpoint kiểm tra cả app và PostgreSQL.

## Chạy nhanh bằng Docker

```bash
docker compose up -d --build
```

Ứng dụng:

```text
http://localhost:3000
```

Health check:

```text
http://localhost:3000/api/health
```

Database được lưu trong Docker volume `qlts_postgres_data`.

## Chạy development

Yêu cầu:

- Node.js >= 22.20
- pnpm 9.15.9
- PostgreSQL 16 hoặc Docker

Khởi động PostgreSQL:

```bash
docker compose up -d postgres
```

Cài đặt và chuẩn bị database:

```bash
cp .env.example .env
pnpm install
pnpm db:generate
pnpm db:deploy
pnpm db:seed
```

Chạy Next.js:

```bash
pnpm dev
```

## Database

Schema chính nằm tại:

```text
prisma/schema.prisma
```

Các migration được commit trong:

```text
prisma/migrations/
```

Development khi sửa schema:

```bash
pnpm db:migrate
```

Production:

```bash
pnpm db:deploy
```

## Nguyên tắc phát triển

1. Không tạo API nội bộ nếu Server Component hoặc Server Action giải quyết trực tiếp được.
2. Không hardcode text giao diện trong component nghiệp vụ; thêm key vào `lib/i18n.ts`.
3. Không phụ thuộc Stripe, Crisp, PostHog hoặc Supabase trong core.
4. PostgreSQL là nguồn dữ liệu chính và được self-host.
5. Mutation nghiệp vụ cần ghi audit log nếu ảnh hưởng tới trạng thái hoặc người giữ tài sản.
6. Giữ dashboard layout ở server layout để sidebar không remount khi đổi trang.
7. Interaction như search/filter chạy ở client; dữ liệu ban đầu được lấy ở server.

## Backup PostgreSQL

Ví dụ backup:

```bash
docker exec qlts-postgres pg_dump -U qlts -d qlts -Fc > qlts-backup.dump
```

Restore:

```bash
cat qlts-backup.dump | docker exec -i qlts-postgres pg_restore -U qlts -d qlts --clean --if-exists
```

## Hướng phát triển tiếp

Các module tiếp theo nên phát triển độc lập trên foundation này:

- QR / Barcode.
- Import / Export Excel, CSV.
- Kiểm kê tài sản.
- Bảo trì / bảo hành.
- Quản lý nhân viên đầy đủ.
- RBAC và đăng nhập nội bộ.
- File / hình ảnh bằng MinIO nếu cần self-host object storage.


## Preview trên Vercel

Vercel được dùng để review giao diện và tự động chạy ở chế độ demo read-only.

- Khi `VERCEL=1`, QLTS mặc định dùng dữ liệu mẫu và không kết nối PostgreSQL.
- Có thể ép demo ở bất kỳ môi trường nào bằng `QLTS_DEMO_MODE=true`.
- Có thể ép Vercel dùng database thật bằng `QLTS_DEMO_MODE=false`, nhưng `DATABASE_URL` khi đó phải là PostgreSQL mà hạ tầng Vercel truy cập được.
- PostgreSQL nằm trong LAN / Docker nội bộ nên được dùng cho deployment self-host, không dùng trực tiếp cho preview public.

Health check trong demo mode trả:

```json
{
  "ok": true,
  "service": "qlts",
  "mode": "demo",
  "database": "not-required"
}
```
