# Casla Assets

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


## Chế độ database / demo

QLTS ưu tiên dùng PostgreSQL thật ở mọi môi trường, bao gồm Vercel.

- Nếu có `DATABASE_URL`: ứng dụng dùng database thật.
- Nếu không có `DATABASE_URL`: ứng dụng tự fallback sang demo read-only.
- Đặt `QLTS_DEMO_MODE=true` để chủ động ép demo.
- Đặt `QLTS_DEMO_MODE=false` để chủ động ép dùng database; khi đó cần `DATABASE_URL` hợp lệ.

Health check trong demo mode trả:

```json
{
  "ok": true,
  "service": "qlts",
  "mode": "demo",
  "database": "not-required"
}
```


## Đăng nhập và phân quyền

Casla Assets dùng tài khoản và session lưu trực tiếp trong PostgreSQL, không phụ thuộc Supabase/Auth0.

| Vai trò | Quyền |
| --- | --- |
| `ADMIN` | Toàn quyền, quản lý tài khoản, role và SMTP test |
| `ASSET_MANAGER` | Tạo/sửa nghiệp vụ tài sản, danh mục, vị trí, nhân viên và bàn giao |
| `VIEWER` | Chỉ xem dữ liệu |

Session được lưu bằng token ngẫu nhiên; trình duyệt chỉ giữ token trong cookie HttpOnly và database chỉ lưu SHA-256 của token.

### Tạo Admin đầu tiên

Trong `.env`:

```env
QLTS_BOOTSTRAP_ADMIN_NAME="Quản trị Casla"
QLTS_BOOTSTRAP_ADMIN_EMAIL="admin@company.local"
QLTS_BOOTSTRAP_ADMIN_PASSWORD="mat-khau-tam-toi-thieu-10-ky-tu"
```

Khi Docker app khởi động sau migration, bootstrap chỉ tạo Admin nếu bảng User đang trống. Admin phải đổi mật khẩu ở lần đăng nhập đầu. Sau khi đăng nhập thành công, nên xóa `QLTS_BOOTSTRAP_ADMIN_PASSWORD` khỏi môi trường.

Nếu chạy development có thể bootstrap thủ công:

```bash
pnpm admin:bootstrap
```

## SMTP cấp tài khoản

SMTP chỉ đọc từ environment; mật khẩu SMTP không lưu trong database.

```env
APP_BASE_URL="https://assets.casla.local"

SMTP_HOST="smtp.example.com"
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER="no-reply@example.com"
SMTP_PASS="app-password-or-smtp-password"
SMTP_FROM="Casla Assets <no-reply@example.com>"
```

Thông thường:

- Port 587: `SMTP_SECURE=false` và dùng STARTTLS.
- Port 465: `SMTP_SECURE=true`.
- SMTP relay nội bộ không yêu cầu auth có thể để trống `SMTP_USER` và `SMTP_PASS`.

Admin vào **Tài khoản & phân quyền** để kiểm tra trạng thái SMTP và gửi mail test tới chính email Admin.

Có hai cách cấp tài khoản:

1. **Gửi lời mời qua email**: hệ thống tạo link kích hoạt dùng một lần, có hạn 24 giờ; người dùng tự đặt mật khẩu.
2. **Tạo trực tiếp**: Admin đặt mật khẩu tạm và cung cấp riêng cho người dùng. Hệ thống không gửi mật khẩu plaintext qua email và bắt đổi mật khẩu ở lần đăng nhập đầu.

## Cookie khi self-host

Nếu app chạy HTTP trong mạng nội bộ:

```env
AUTH_COOKIE_SECURE=false
```

Nếu app được đặt sau HTTPS reverse proxy:

```env
AUTH_COOKIE_SECURE=true
```

Vercel sẽ dùng PostgreSQL thật nếu project có `DATABASE_URL`. Chỉ dùng demo khi không có database hoặc khi đặt `QLTS_DEMO_MODE=true`.


## Ảnh tài sản, barcode và dashboard report

Từ phiên bản 0.4:

- Mỗi tài sản có thể có một ảnh chính JPEG/PNG/WebP, tối đa 4 MB.
- Ảnh được lưu trong bảng `AssetImage` riêng dưới dạng `BYTEA` để các truy vấn danh sách/report không tải blob.
- Có thể thêm, thay hoặc xóa ảnh từ trang chi tiết tài sản.
- Mỗi tài sản có `barcode` unique. Nếu để trống khi tạo, hệ thống dùng `code` làm giá trị barcode.
- Barcode được render dạng Code128 SVG tại `/api/assets/:id/barcode`, phù hợp để quét hoặc mở riêng để in tem.
- Dashboard có report tỷ lệ sử dụng, phân bố trạng thái, top danh mục và top vị trí.

Server Actions được cấu hình body limit 5 MB; ứng dụng chủ động giới hạn file ảnh ở 4 MB.
