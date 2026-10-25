export type Role = 'student' | 'merchant' | 'runner' | 'admin';

export interface Profile {
  id: string;
  phone: string;
  username: string;
  fullName: string;
  studentId: string;
  department: string;
  role: Role;
}

export interface Vendor {
  placeId: string;
  active: boolean;
  description: string;
}

export interface MenuItem {
  id: string;
  placeId: string;
  name: string;
  description: string;
  price: number; // ETB
  available: boolean;
}

export type OrderStatus = 'placed' | 'accepted' | 'picked_up' | 'delivered' | 'cancelled';

export interface OrderLine {
  menuItemId: string;
  name: string;
  price: number;
  qty: number;
}

export interface Order {
  id: string;
  userId: string;
  userName: string;
  userPhone: string;
  placeId: string;
  placeName: string;
  lines: OrderLine[];
  subtotal: number;
  fee: number;
  total: number;
  dropPlaceId: string;
  dropName: string;
  note: string;
  status: OrderStatus;
  runnerId: string | null;
  runnerName: string | null;
  runnerLat: number | null;
  runnerLng: number | null;
  createdAt: string;
}

export interface PlaceOrderInput {
  placeId: string;
  placeName: string;
  lines: OrderLine[];
  dropPlaceId: string;
  dropName: string;
  note: string;
}

export interface Shop {
  id: string;
  ownerId: string;
  ownerName: string;
  name: string;
  description: string;
  imageUrl: string | null;
}

export interface Tip {
  id: string;
  title: string;
  description: string;
  link: string | null;
  createdAt: string;
}

export interface MerchantStory {
  id: string;
  merchantId: string;
  merchantName: string;
  shopName: string;
  shopImageUrl: string | null;
  text: string;
  imageUrl: string | null;
  createdAt: string;
  expiresAt: string;
}

export type ProductKind = 'new' | 'used';

export interface Product {
  id: string;
  kind: ProductKind;
  shopId: string | null;
  shopName: string | null;
  sellerId: string;
  sellerName: string;
  sellerPhone: string;
  title: string;
  description: string;
  price: number;
  condition: string;
  imageUrl: string | null;
  verifiedSeller?: boolean;
  createdAt: string;
}

export interface NewProductInput {
  kind: ProductKind;
  shopId: string | null;
  title: string;
  description: string;
  price: number;
  condition: string;
  imageUrl: string | null;
}

export interface MerchantApplication {
  id: string;
  userId: string;
  userName: string;
  userPhone: string;
  shopName: string;
  description: string;
  paymentProvider?: string;
  paymentReference?: string;
  paymentStatus?: 'not_submitted' | 'verified' | 'manual_review' | 'rejected';
  status: 'pending' | 'approved' | 'rejected';
  createdAt: string;
}

export interface LiveStream {
  id: string;
  hostId: string;
  hostName: string;
  title: string;
  roomName: string;
  startedAt: string;
}
