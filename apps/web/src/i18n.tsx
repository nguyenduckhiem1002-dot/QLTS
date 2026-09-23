import {
  createContext,
  type PropsWithChildren,
  useContext,
  useMemo,
  useState,
} from "react";

export type Locale = "vi" | "en";

const messages = {
  vi: {
    "app.name": "QLTS",
    "app.subtitle": "Quản lý tài sản",
    "nav.dashboard": "Tổng quan",
    "nav.assets": "Tài sản",
    "nav.categories": "Danh mục",
    "nav.locations": "Vị trí",
    "nav.settings": "Cài đặt",
    "common.loading": "Đang tải dữ liệu...",
    "common.retry": "Thử lại",
    "common.noData": "Chưa có dữ liệu",
    "common.assets": "tài sản",
    "dashboard.title": "Tổng quan tài sản",
    "dashboard.subtitle": "Theo dõi nhanh tình trạng tài sản trong toàn hệ thống.",
    "dashboard.total": "Tổng tài sản",
    "dashboard.inUse": "Đang sử dụng",
    "dashboard.available": "Sẵn sàng",
    "dashboard.maintenance": "Bảo trì",
    "dashboard.categories": "Danh mục",
    "dashboard.locations": "Vị trí",
    "dashboard.noteTitle": "Foundation đã sẵn sàng",
    "dashboard.noteBody":
      "Core hiện tập trung vào dữ liệu tài sản, danh mục, vị trí và người giữ tài sản. Các module QR, kiểm kê, import/export và bàn giao có thể bổ sung độc lập.",
    "assets.title": "Tài sản",
    "assets.subtitle": "Tra cứu tài sản, vị trí và người đang sử dụng.",
    "assets.search": "Tìm theo mã, tên hoặc serial...",
    "assets.code": "Mã tài sản",
    "assets.name": "Tên tài sản",
    "assets.category": "Danh mục",
    "assets.location": "Vị trí",
    "assets.custodian": "Người giữ",
    "assets.status": "Trạng thái",
    "assets.empty": "Không tìm thấy tài sản phù hợp.",
    "categories.title": "Danh mục tài sản",
    "categories.subtitle": "Nhóm tài sản theo mục đích và loại thiết bị.",
    "categories.name": "Tên danh mục",
    "categories.description": "Mô tả",
    "categories.assetCount": "Số tài sản",
    "locations.title": "Vị trí",
    "locations.subtitle": "Theo dõi tài sản theo văn phòng, kho hoặc khu vực.",
    "locations.name": "Tên vị trí",
    "locations.type": "Loại",
    "locations.address": "Địa chỉ",
    "locations.assetCount": "Số tài sản",
    "settings.title": "Cài đặt",
    "settings.subtitle": "Thiết lập trải nghiệm và thông tin kỹ thuật của ứng dụng.",
    "settings.language": "Ngôn ngữ",
    "settings.languageHelp": "Ngôn ngữ được lưu trên trình duyệt này.",
    "settings.architecture": "Kiến trúc",
    "settings.architectureValue": "React + Hono + Prisma + PostgreSQL",
    "settings.api": "API",
    "settings.apiValue": "Tách riêng khỏi web để dễ mở rộng và triển khai.",
    "language.vi": "Tiếng Việt",
    "language.en": "English",
    "status.AVAILABLE": "Sẵn sàng",
    "status.IN_USE": "Đang sử dụng",
    "status.MAINTENANCE": "Bảo trì",
    "status.LOST": "Thất lạc",
    "status.DISPOSED": "Thanh lý",
    "location.OFFICE": "Văn phòng",
    "location.WAREHOUSE": "Kho",
    "location.ROOM": "Phòng",
    "location.AREA": "Khu vực",
    "location.OTHER": "Khác",
    "error.load": "Không thể tải dữ liệu. Kiểm tra API và kết nối cơ sở dữ liệu.",
  },
  en: {
    "app.name": "QLTS",
    "app.subtitle": "Asset Management",
    "nav.dashboard": "Dashboard",
    "nav.assets": "Assets",
    "nav.categories": "Categories",
    "nav.locations": "Locations",
    "nav.settings": "Settings",
    "common.loading": "Loading data...",
    "common.retry": "Retry",
    "common.noData": "No data yet",
    "common.assets": "assets",
    "dashboard.title": "Asset overview",
    "dashboard.subtitle": "Track the current state of assets across the system.",
    "dashboard.total": "Total assets",
    "dashboard.inUse": "In use",
    "dashboard.available": "Available",
    "dashboard.maintenance": "Maintenance",
    "dashboard.categories": "Categories",
    "dashboard.locations": "Locations",
    "dashboard.noteTitle": "Foundation is ready",
    "dashboard.noteBody":
      "The core now focuses on assets, categories, locations and custodians. QR, inventory, import/export and handover modules can be added independently.",
    "assets.title": "Assets",
    "assets.subtitle": "Search assets, locations and current custodians.",
    "assets.search": "Search by code, name or serial...",
    "assets.code": "Asset code",
    "assets.name": "Asset name",
    "assets.category": "Category",
    "assets.location": "Location",
    "assets.custodian": "Custodian",
    "assets.status": "Status",
    "assets.empty": "No matching assets found.",
    "categories.title": "Asset categories",
    "categories.subtitle": "Group assets by purpose and equipment type.",
    "categories.name": "Category",
    "categories.description": "Description",
    "categories.assetCount": "Assets",
    "locations.title": "Locations",
    "locations.subtitle": "Track assets by office, warehouse or area.",
    "locations.name": "Location",
    "locations.type": "Type",
    "locations.address": "Address",
    "locations.assetCount": "Assets",
    "settings.title": "Settings",
    "settings.subtitle": "Configure the application experience and technical information.",
    "settings.language": "Language",
    "settings.languageHelp": "The language is saved in this browser.",
    "settings.architecture": "Architecture",
    "settings.architectureValue": "React + Hono + Prisma + PostgreSQL",
    "settings.api": "API",
    "settings.apiValue": "Separated from the web app for easier scaling and deployment.",
    "language.vi": "Tiếng Việt",
    "language.en": "English",
    "status.AVAILABLE": "Available",
    "status.IN_USE": "In use",
    "status.MAINTENANCE": "Maintenance",
    "status.LOST": "Lost",
    "status.DISPOSED": "Disposed",
    "location.OFFICE": "Office",
    "location.WAREHOUSE": "Warehouse",
    "location.ROOM": "Room",
    "location.AREA": "Area",
    "location.OTHER": "Other",
    "error.load": "Unable to load data. Check the API and database connection.",
  },
} as const;

type MessageKey = keyof (typeof messages)["vi"];

type I18nContextValue = {
  locale: Locale;
  setLocale: (locale: Locale) => void;
  t: (key: MessageKey) => string;
};

const I18nContext = createContext<I18nContextValue | null>(null);

export function I18nProvider({ children }: PropsWithChildren) {
  const [locale, setLocaleState] = useState<Locale>(() => {
    const saved = localStorage.getItem("qlts-locale");
    return saved === "en" ? "en" : "vi";
  });

  const value = useMemo<I18nContextValue>(
    () => ({
      locale,
      setLocale(next) {
        localStorage.setItem("qlts-locale", next);
        document.documentElement.lang = next;
        setLocaleState(next);
      },
      t(key) {
        return messages[locale][key] ?? messages.vi[key];
      },
    }),
    [locale],
  );

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

export function useI18n() {
  const value = useContext(I18nContext);

  if (!value) {
    throw new Error("useI18n must be used inside I18nProvider");
  }

  return value;
}
