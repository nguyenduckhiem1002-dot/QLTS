# QLTS

QLTS là nền tảng quản lý tài sản nội bộ được thiết kế lại theo hướng gọn, dễ mở rộng và ưu tiên trải nghiệm tiếng Việt.

Dự án dùng DATN/Casla Assets làm tài liệu tham khảo về nghiệp vụ và luồng sử dụng, nhưng phần foundation này được tổ chức lại để tránh kéo theo các bề mặt SaaS và dependency không cần thiết.

## Kiến trúc

```text
QLTS/
├── apps/
│   ├── web/          # React 19 + Vite
│   └── api/          # Hono API
├── packages/
│   └── database/     # Prisma + PostgreSQL
├── docker-compose.yml
└── turbo.json
```

## Chức năng foundation

- Dashboard tổng quan tài sản.
- Danh sách tài sản với tìm kiếm nhanh.
- Danh mục tài sản.
- Vị trí tài sản.
- Người đang giữ tài sản và lịch sử bàn giao ở tầng dữ liệu.
- Audit log ở tầng dữ liệu.
- Giao diện Việt/Anh, mặc định tiếng Việt.
- App shell giữ nguyên khi điều hướng.
- Cache/prefetch dữ liệu để giảm cảm giác tải lại trang.
- PostgreSQL local bằng Docker Compose.

## Chạy local

Yêu cầu:

- Node.js >= 22.20
- pnpm 9.15.9
- Docker (khuyến nghị cho PostgreSQL)

```bash
cp .env.example .env
docker compose up -d

pnpm install
pnpm db:generate
pnpm db:push
pnpm db:seed
pnpm dev
```

Web: http://localhost:3000

API: http://localhost:3001

Health check: http://localhost:3001/health

## Nguyên tắc phát triển

1. Không hardcode text giao diện trong page mới; thêm key vào i18n.
2. Core không phụ thuộc Stripe, Crisp, PostHog hoặc Supabase.
3. Schema nghiệp vụ nằm trong `packages/database`.
4. Page chỉ gọi API qua `apps/web/src/lib/api.ts` để tận dụng cache/prefetch.
5. Mọi thay đổi schema cần có migration khi chuyển sang môi trường production.

## Bước tiếp theo

Foundation này chủ ý chưa nhồi toàn bộ chức năng của DATN vào một lần. Các module phù hợp để phát triển tiếp là QR/Barcode, import/export, kiểm kê, bàn giao/hoàn trả, bảo trì và phân quyền chi tiết.
