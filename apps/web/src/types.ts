export type AssetStatus =
  | "AVAILABLE"
  | "IN_USE"
  | "MAINTENANCE"
  | "LOST"
  | "DISPOSED";

export type LocationType =
  | "OFFICE"
  | "WAREHOUSE"
  | "ROOM"
  | "AREA"
  | "OTHER";

export type DashboardSummary = {
  total: number;
  inUse: number;
  available: number;
  maintenance: number;
  categories: number;
  locations: number;
};

export type Asset = {
  id: string;
  code: string;
  name: string;
  serialNumber: string | null;
  status: AssetStatus;
  category: { id: string; name: string } | null;
  location: { id: string; name: string } | null;
  custodian: {
    id: string;
    employeeCode: string;
    name: string;
    department: string | null;
  } | null;
};

export type Category = {
  id: string;
  name: string;
  description: string | null;
  _count: { assets: number };
};

export type Location = {
  id: string;
  name: string;
  type: LocationType;
  address: string | null;
  _count: { assets: number };
};
