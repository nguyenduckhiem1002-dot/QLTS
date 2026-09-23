import Link from "next/link";

export default function NotFound() {
  return (
    <main className="not-found">
      <strong>404</strong>
      <h1>Không tìm thấy dữ liệu</h1>
      <Link href="/">Về trang tổng quan</Link>
    </main>
  );
}
