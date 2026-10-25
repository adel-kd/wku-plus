import {
  LiveStream,
  MenuItem,
  MerchantApplication,
  MerchantStory,
  NewProductInput,
  Order,
  OrderStatus,
  PlaceOrderInput,
  Product,
  ProductKind,
  Profile,
  Role,
  Shop,
  Tip,
  Vendor,
} from '../types';

export interface Api {
  mode: 'supabase' | 'mock';

  // auth
  sendOtp(phone: string, shouldCreateUser?: boolean): Promise<void>;
  login(phone: string, password: string): Promise<Profile>;
  verifyOtp(phone: string, code: string): Promise<Profile>;
  getProfile(): Promise<Profile | null>;
  updateProfile(fullName: string, department: string): Promise<Profile>;
  changePassword(password: string): Promise<void>;
  sendAnnouncement(message: string, department?: string): Promise<{ sent: number; failed: number }>;
  sendPushNotification(title: string, message: string, department?: string): Promise<{ sent: number }>;
  registerPushToken(token: string, platform: string): Promise<void>;
  signOut(): Promise<void>;

  // delivery
  listVendors(): Promise<Vendor[]>;
  setVendor(placeId: string, active: boolean, description: string): Promise<void>;
  listMenu(placeId: string): Promise<MenuItem[]>;
  saveMenuItem(item: Omit<MenuItem, 'id'> & { id?: string }): Promise<void>;
  deleteMenuItem(id: string): Promise<void>;
  placeOrder(input: PlaceOrderInput): Promise<Order>;
  myOrders(): Promise<Order[]>;
  getOrder(id: string): Promise<Order | null>;
  cancelOrder(id: string): Promise<void>;
  openOrders(): Promise<Order[]>; // runner: waiting to be accepted
  runnerOrders(): Promise<Order[]>; // runner: assigned to me
  acceptOrder(id: string): Promise<void>;
  setOrderStatus(id: string, status: OrderStatus): Promise<void>;
  updateRunnerLocation(id: string, lat: number, lng: number): Promise<void>;
  allOrders(): Promise<Order[]>; // admin

  // gebeya
  listShops(): Promise<Shop[]>;
  myShop(): Promise<Shop | null>;
  createShop(name: string, description: string): Promise<Shop>;
  updateShopImage(imageUrl: string): Promise<void>;
  uploadGebeyaImage(uri: string): Promise<string>;
  listProducts(kind: ProductKind): Promise<Product[]>;
  createProduct(input: NewProductInput): Promise<void>;
  deleteProduct(id: string): Promise<void>;
  /** null when the user may post a used item now, otherwise the date they can post again. */
  nextUsedPostAt(): Promise<Date | null>;
  listMerchantStories(): Promise<MerchantStory[]>;
  createMerchantStory(text: string, imageUrl: string | null): Promise<void>;

  // tips
  listTips(): Promise<Tip[]>;
  saveTip(tip: { id?: string; title: string; description: string; link?: string | null }): Promise<void>;
  deleteTip(id: string): Promise<void>;

  // merchant approval
  myApplication(): Promise<MerchantApplication | null>;
  applyMerchant(shopName: string, description: string): Promise<void>;
  verifyMerchantPayment(provider: string, reference: string): Promise<{ status: string; message?: string }>;
  listApplications(): Promise<MerchantApplication[]>;
  decideApplication(id: string, approve: boolean): Promise<void>;

  // admin users
  listUsers(): Promise<Profile[]>;
  setRole(userId: string, role: Role): Promise<void>;

  // tv
  tvMatch(): Promise<string | null>; // call repeatedly; returns room name once paired
  tvLeave(): Promise<void>;
  report(reason: string, room: string): Promise<void>;
  listLive(): Promise<LiveStream[]>;
  startLive(title: string): Promise<LiveStream>;
  endLive(id: string): Promise<void>;
  getLiveKitToken(room: string, canPublish: boolean): Promise<string>;
}

export const ORDER_FEE = 15; // ETB student runner fee
export const USED_POST_INTERVAL_DAYS = 7;
