import AsyncStorage from '@react-native-async-storage/async-storage';
import { PLACES } from '@/data/places';
import {
  LiveStream,
  MenuItem,
  MerchantApplication,
  NewProductInput,
  Order,
  OrderStatus,
  PlaceOrderInput,
  Product,
  ProductKind,
  Profile,
  Role,
  Shop,
  Vendor,
} from '../types';
import { Api, ORDER_FEE, USED_POST_INTERVAL_DAYS } from './types';

/**
 * Offline sample-data backend so the whole app can be tried without any server.
 * Test phone numbers: +251900000001 = admin, +251900000002 = merchant, +251900000003 = runner.
 * Any other number is a student. The OTP code is always 123456.
 */

const KEY = 'wku.mock.userId';
let uid = 100;
const nid = (p: string) => `${p}-${++uid}`;
const now = () => new Date().toISOString();

const users: Profile[] = [
  { id: 'u-admin', phone: '+251900000001', username: 'admin', fullName: 'Campus Admin', studentId: 'ADMIN', department: 'Administration', role: 'admin' },
  { id: 'u-merchant', phone: '+251900000002', username: 'selam', fullName: 'Selam Merchant', studentId: 'WKU/0101/15', department: 'Business', role: 'merchant' },
  { id: 'u-runner', phone: '+251900000003', username: 'kidus', fullName: 'Kidus Runner', studentId: 'WKU/0202/14', department: 'Logistics', role: 'runner' },
];

const foodPlaces = PLACES.filter((p) => p.category === 'food');
const vendors: Vendor[] = foodPlaces.map((p) => ({
  placeId: p.id,
  active: true,
  description: 'Fast campus delivery',
}));

const SAMPLE_MENU: [string, string, number][] = [
  ['Shiro with injera', 'Classic chickpea stew', 60],
  ['Firfir', 'Injera in spicy sauce', 70],
  ['Pasta with sauce', 'Tomato or meat sauce', 80],
  ['Egg sandwich', 'Fresh bread and egg', 45],
  ['Macchiato', 'Hot Ethiopian macchiato', 20],
  ['Fresh juice', 'Avocado or mango', 50],
];
const menu: MenuItem[] = [];
foodPlaces.slice(0, 5).forEach((p) =>
  SAMPLE_MENU.forEach(([name, description, price]) =>
    menu.push({ id: nid('m'), placeId: p.id, name, description, price, available: true }),
  ),
);

const orders: Order[] = [];
const shops: Shop[] = [
  { id: 's-1', ownerId: 'u-merchant', ownerName: 'Selam Merchant', name: 'Selam Stationery', description: 'Notebooks, pens, printing', imageUrl: null },
];
const products: Product[] = [
  { id: 'p-1', kind: 'new', shopId: 's-1', shopName: 'Selam Stationery', sellerId: 'u-merchant', sellerName: 'Selam Merchant', sellerPhone: '+251900000002', title: 'A4 notebook (200 pages)', description: 'Hard cover', price: 55, condition: 'New', imageUrl: null, createdAt: now() },
  { id: 'p-2', kind: 'used', shopId: null, shopName: null, sellerId: 'u-seed', sellerName: 'Nahom B.', sellerPhone: '+251911000000', title: 'Calculus textbook', description: 'Some highlights inside', price: 250, condition: 'Good', imageUrl: null, createdAt: now() },
];
const applications: MerchantApplication[] = [];
const lives: LiveStream[] = [];

let currentId: string | null = null;
const me = (): Profile => {
  const u = users.find((x) => x.id === currentId);
  if (!u) throw new Error('Not signed in');
  return u;
};

const clone = <T,>(x: T): T => JSON.parse(JSON.stringify(x));
const delay = () => new Promise((r) => setTimeout(r, 120));

export const mockApi: Api = {
  mode: 'mock',

  async sendOtp() {
    await delay();
  },
  async login(phone, password) {
    await delay();
    if (password.length < 8) throw new Error('Invalid phone number or password.');
    const u = users.find((x) => x.phone === phone);
    if (!u) throw new Error('Invalid phone number or password.');
    currentId = u.id;
    await AsyncStorage.setItem(KEY, JSON.stringify(u));
    return clone(u);
  },
  async verifyOtp(phone, code) {
    await delay();
    if (code !== '123456') throw new Error('Wrong code. In sample mode use 123456.');
    let u = users.find((x) => x.phone === phone);
    if (!u) {
      u = { id: nid('u'), phone, username: '', fullName: '', studentId: '', department: '', role: 'student' };
      users.push(u);
    }
    currentId = u.id;
    await AsyncStorage.setItem(KEY, JSON.stringify(u));
    return clone(u);
  },
  async getProfile() {
    if (!currentId) {
      const raw = await AsyncStorage.getItem(KEY);
      if (raw) {
        const saved = JSON.parse(raw) as Profile;
        if (!users.find((x) => x.id === saved.id)) users.push(saved);
        currentId = saved.id;
      }
    }
    return currentId ? clone(me()) : null;
  },
  async updateProfile(fullName, department) {
    const u = me();
    u.username = fullName;
    u.fullName = fullName;
    u.department = department;
    await AsyncStorage.setItem(KEY, JSON.stringify(u));
    return clone(u);
  },
  async changePassword() {
    await delay();
  },
  async sendAnnouncement() {
    throw new Error('SMS announcements require a connected Supabase project.');
  },
  async sendPushNotification() { return { sent: 0 }; },
  async registerPushToken() {},
  async signOut() {
    currentId = null;
    await AsyncStorage.removeItem(KEY);
  },

  async listVendors() {
    return clone(vendors);
  },
  async setVendor(placeId, active, description) {
    const v = vendors.find((x) => x.placeId === placeId);
    if (v) {
      v.active = active;
      v.description = description;
    } else vendors.push({ placeId, active, description });
  },
  async listMenu(placeId) {
    return clone(menu.filter((m) => m.placeId === placeId));
  },
  async saveMenuItem(item) {
    if (item.id) {
      const i = menu.findIndex((m) => m.id === item.id);
      if (i >= 0) menu[i] = { ...menu[i], ...item, id: item.id };
    } else menu.push({ ...item, id: nid('m') });
  },
  async deleteMenuItem(id) {
    const i = menu.findIndex((m) => m.id === id);
    if (i >= 0) menu.splice(i, 1);
  },
  async placeOrder(input: PlaceOrderInput) {
    const u = me();
    const subtotal = input.lines.reduce((s, l) => s + l.price * l.qty, 0);
    const o: Order = {
      id: nid('o'),
      userId: u.id,
      userName: u.fullName || u.phone,
      userPhone: u.phone,
      ...input,
      subtotal,
      fee: ORDER_FEE,
      total: subtotal + ORDER_FEE,
      status: 'placed',
      runnerId: null,
      runnerName: null,
      runnerLat: null,
      runnerLng: null,
      createdAt: now(),
    };
    orders.unshift(o);
    return clone(o);
  },
  async myOrders() {
    return clone(orders.filter((o) => o.userId === me().id));
  },
  async getOrder(id) {
    const o = orders.find((x) => x.id === id);
    return o ? clone(o) : null;
  },
  async cancelOrder(id) {
    const o = orders.find((x) => x.id === id);
    if (o && o.status === 'placed') o.status = 'cancelled';
  },
  async openOrders() {
    return clone(orders.filter((o) => o.status === 'placed'));
  },
  async runnerOrders() {
    return clone(orders.filter((o) => o.runnerId === me().id));
  },
  async acceptOrder(id) {
    const o = orders.find((x) => x.id === id);
    if (!o || o.status !== 'placed') throw new Error('Order already taken');
    const u = me();
    o.status = 'accepted';
    o.runnerId = u.id;
    o.runnerName = u.fullName || u.phone;
  },
  async setOrderStatus(id, status: OrderStatus) {
    const o = orders.find((x) => x.id === id);
    if (o) o.status = status;
  },
  async updateRunnerLocation(id, lat, lng) {
    const o = orders.find((x) => x.id === id);
    if (o) {
      o.runnerLat = lat;
      o.runnerLng = lng;
    }
  },
  async allOrders() {
    return clone(orders);
  },

  async listShops() {
    return clone(shops);
  },
  async myShop() {
    const s = shops.find((x) => x.ownerId === me().id);
    return s ? clone(s) : null;
  },
  async createShop(name, description) {
    const u = me();
    if (u.role !== 'merchant') throw new Error('Only approved merchants can open a shop.');
    const s: Shop = { id: nid('s'), ownerId: u.id, ownerName: u.fullName || u.phone, name, description, imageUrl: null };
    shops.push(s);
    return clone(s);
  },
  async updateShopImage(imageUrl) { const shop = shops.find((x) => x.ownerId === me().id); if (shop) shop.imageUrl = imageUrl; },
  async uploadGebeyaImage(uri) { return uri; },
  async listProducts(kind: ProductKind) {
    return clone(products.filter((p) => p.kind === kind)).sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  },
  async createProduct(input: NewProductInput) {
    const u = me();
    if (input.kind === 'new') {
      if (u.role !== 'merchant') throw new Error('Only merchants can sell new products.');
    } else {
      const next = await mockApi.nextUsedPostAt();
      if (next) throw new Error(`You can post another used item on ${next.toDateString()}.`);
    }
    const shop = input.shopId ? shops.find((s) => s.id === input.shopId) : null;
    products.unshift({
      id: nid('p'),
      kind: input.kind,
      shopId: input.shopId,
      shopName: shop?.name ?? null,
      sellerId: u.id,
      sellerName: u.fullName || u.phone,
      sellerPhone: u.phone,
      title: input.title,
      description: input.description,
      price: input.price,
      condition: input.condition,
      imageUrl: input.imageUrl,
      createdAt: now(),
    });
  },
  async deleteProduct(id) {
    const i = products.findIndex((p) => p.id === id && p.sellerId === me().id);
    if (i >= 0) products.splice(i, 1);
  },
  async nextUsedPostAt() {
    const mine = products.filter((p) => p.kind === 'used' && p.sellerId === me().id);
    if (!mine.length) return null;
    const last = Math.max(...mine.map((p) => new Date(p.createdAt).getTime()));
    const next = new Date(last + USED_POST_INTERVAL_DAYS * 86400000);
    return next.getTime() > Date.now() ? next : null;
  },
  async listMerchantStories() { return []; },
  async createMerchantStory() {},
  async listTips() { return []; },
  async saveTip() {},
  async deleteTip() {},

  async myApplication() {
    const a = applications.filter((x) => x.userId === me().id).pop();
    return a ? clone(a) : null;
  },
  async applyMerchant(shopName, description) {
    const u = me();
    applications.push({
      id: nid('a'),
      userId: u.id,
      userName: u.fullName || u.phone,
      userPhone: u.phone,
      shopName,
      description,
      status: 'pending',
      createdAt: now(),
    });
  },
  async verifyMerchantPayment() { return { status: 'MANUAL_REVIEW', message: 'Sample mode: an admin must verify payment.' }; },
  async listApplications() {
    return clone(applications).reverse();
  },
  async decideApplication(id, approve) {
    const a = applications.find((x) => x.id === id);
    if (!a) return;
    a.status = approve ? 'approved' : 'rejected';
    if (approve) {
      const u = users.find((x) => x.id === a.userId);
      if (u && u.role === 'student') u.role = 'merchant';
    }
  },

  async listUsers() {
    return clone(users);
  },
  async setRole(userId, role) {
    const u = users.find((x) => x.id === userId);
    if (u) u.role = role;
  },

  async tvMatch() {
    return null; // pairing needs the real backend
  },
  async tvLeave() {},
  async report() {},
  async listLive() {
    return clone(lives);
  },
  async startLive(title) {
    const u = me();
    const l: LiveStream = { id: nid('l'), hostId: u.id, hostName: u.fullName || u.phone, title, roomName: `live-${u.id}`, startedAt: now() };
    lives.push(l);
    return clone(l);
  },
  async endLive(id) {
    const i = lives.findIndex((l) => l.id === id);
    if (i >= 0) lives.splice(i, 1);
  },
  async getLiveKitToken() {
    throw new Error('Video needs Supabase and LiveKit set up (see README).');
  },
};
