import { supabase } from '../supabaseClient';
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
import { Api, ORDER_FEE } from './types';

const toProfile = (r: any): Profile => ({
  id: r.id,
  phone: r.phone ?? '',
  username: r.username ?? '',
  fullName: r.full_name ?? '',
  studentId: r.student_id ?? '',
  department: r.department ?? '',
  role: r.role ?? 'student',
});

const toMenuItem = (r: any): MenuItem => ({
  id: r.id,
  placeId: r.place_id,
  name: r.name,
  description: r.description ?? '',
  price: Number(r.price),
  available: r.available,
});

const toOrder = (r: any): Order => ({
  id: r.id,
  userId: r.user_id,
  userName: r.user_name,
  userPhone: r.user_phone,
  placeId: r.place_id,
  placeName: r.place_name,
  lines: r.lines ?? [],
  subtotal: Number(r.subtotal),
  fee: Number(r.fee),
  total: Number(r.total),
  dropPlaceId: r.drop_place_id,
  dropName: r.drop_name,
  note: r.note ?? '',
  status: r.status,
  runnerId: r.runner_id,
  runnerName: r.runner_name,
  runnerLat: r.runner_lat,
  runnerLng: r.runner_lng,
  createdAt: r.created_at,
});

const toShop = (r: any): Shop => ({
  id: r.id,
  ownerId: r.owner_id,
  ownerName: r.owner_name,
  name: r.name,
  description: r.description ?? '',
  imageUrl: r.image_url ?? null,
});

const toTip = (r: any): Tip => ({ id: r.id, title: r.title, description: r.description ?? '', link: r.link ?? null, createdAt: r.created_at });

const toProduct = (r: any): Product => ({
  id: r.id,
  kind: r.kind,
  shopId: r.shop_id,
  shopName: r.shop_name,
  sellerId: r.seller_id,
  sellerName: r.seller_name,
  sellerPhone: r.seller_phone,
  title: r.title,
  description: r.description ?? '',
  price: Number(r.price),
  condition: r.condition ?? '',
  imageUrl: r.image_url,
  verifiedSeller: r.moderation_status === 'approved',
  createdAt: r.created_at,
});

const toApplication = (r: any): MerchantApplication => ({
  id: r.id,
  userId: r.user_id,
  userName: r.user_name,
  userPhone: r.user_phone,
  shopName: r.shop_name,
  description: r.description ?? '',
  paymentProvider: r.payment_provider,
  paymentReference: r.payment_reference,
  paymentStatus: r.payment_status,
  status: r.status,
  createdAt: r.created_at,
});

function must<T>(v: { data: T; error: any }): T {
  if (v.error) throw new Error(v.error.message);
  return v.data;
}

async function requireUserId(): Promise<string> {
  const { data } = await supabase.auth.getUser();
  if (!data.user) throw new Error('Not signed in');
  return data.user.id;
}

export const supabaseApi: Api = {
  mode: 'supabase',

  async sendOtp(phone: string, shouldCreateUser = true) {
    const { error } = await supabase.auth.signInWithOtp({ phone, options: { shouldCreateUser } });
    if (error) throw new Error(error.message);
  },
  async login(phone, password) {
    const { data, error } = await supabase.auth.signInWithPassword({ phone, password });
    if (error) throw new Error(error.message);
    const { data: row, error: profileError } = await supabase.from('profiles').select('*').eq('id', data.user.id).single();
    if (profileError) throw new Error(profileError.message);
    return toProfile(row);
  },
  async verifyOtp(phone: string, code: string) {
    const { data, error } = await supabase.auth.verifyOtp({ phone, token: code, type: 'sms' });
    if (error) throw new Error(error.message);
    const uid = data.user!.id;
    // profile row is created by a DB trigger on auth.users insert; fetch (with brief retry for first login)
    for (let i = 0; i < 5; i++) {
      const { data: row } = await supabase.from('profiles').select('*').eq('id', uid).maybeSingle();
      if (row) return toProfile(row);
      await new Promise((r) => setTimeout(r, 300));
    }
    throw new Error('Could not load profile after sign-in');
  },
  async getProfile() {
    const { data } = await supabase.auth.getUser();
    if (!data.user) return null;
    const { data: row, error } = await supabase.from('profiles').select('*').eq('id', data.user.id).maybeSingle();
    if (error) throw new Error(error.message);
    return row ? toProfile(row) : null;
  },
  async updateProfile(fullName, department) {
    const uid = await requireUserId();
    const row = must<any>(
      await supabase
        .from('profiles')
        .update({ username: fullName, full_name: fullName, department })
        .eq('id', uid)
        .select()
        .single(),
    );
    return toProfile(row);
  },
  async changePassword(password) {
    const { error } = await supabase.auth.updateUser({ password });
    if (error) throw new Error(error.message);
  },
  async sendAnnouncement(message, department) {
    const { data, error } = await supabase.functions.invoke('send-sms', { body: { message, department } });
    if (error) throw new Error(error.message);
    if (!data?.sent && !data?.failed) throw new Error('SMS service returned an invalid response');
    return data;
  },
  async sendPushNotification(title, message, department) {
    const { data, error } = await supabase.functions.invoke('send-push', { body: { title, message, department } });
    if (error) throw new Error(error.message);
    if (data?.error) throw new Error(data.error);
    return data;
  },
  async registerPushToken(token, platform) {
    const uid = await requireUserId();
    const { error } = await supabase.from('push_tokens').upsert({ token, user_id: uid, platform, updated_at: new Date().toISOString() }, { onConflict: 'token' });
    if (error) throw new Error(error.message);
  },
  async signOut() {
    await supabase.auth.signOut();
  },

  async listVendors() {
    const rows = must<any[]>(await supabase.from('vendors').select('*'));
    return rows.map((r: any) => ({ placeId: r.place_id, active: r.active, description: r.description ?? '' }));
  },
  async setVendor(placeId, active, description) {
    const { error } = await supabase
      .from('vendors')
      .upsert({ place_id: placeId, active, description }, { onConflict: 'place_id' });
    if (error) throw new Error(error.message);
  },
  async listMenu(placeId) {
    const rows = must<any[]>(await supabase.from('menu_items').select('*').eq('place_id', placeId).order('name'));
    return rows.map(toMenuItem);
  },
  async saveMenuItem(item) {
    const row = {
      id: item.id,
      place_id: item.placeId,
      name: item.name,
      description: item.description,
      price: item.price,
      available: item.available,
    };
    const { error } = await supabase.from('menu_items').upsert(row);
    if (error) throw new Error(error.message);
  },
  async deleteMenuItem(id) {
    const { error } = await supabase.from('menu_items').delete().eq('id', id);
    if (error) throw new Error(error.message);
  },
  async placeOrder(input: PlaceOrderInput) {
    const uid = await requireUserId();
    const { data: prof } = await supabase.from('profiles').select('full_name, phone').eq('id', uid).single();
    const subtotal = input.lines.reduce((s, l) => s + l.price * l.qty, 0);
    const row = must<any>(
      await supabase
        .from('orders')
        .insert({
          user_id: uid,
          user_name: prof?.full_name || prof?.phone || '',
          user_phone: prof?.phone || '',
          place_id: input.placeId,
          place_name: input.placeName,
          lines: input.lines,
          subtotal,
          fee: ORDER_FEE,
          total: subtotal + ORDER_FEE,
          drop_place_id: input.dropPlaceId,
          drop_name: input.dropName,
          note: input.note,
        })
        .select()
        .single(),
    );
    return toOrder(row);
  },
  async myOrders() {
    const uid = await requireUserId();
    const rows = must<any[]>(
      await supabase.from('orders').select('*').eq('user_id', uid).order('created_at', { ascending: false }),
    );
    return rows.map(toOrder);
  },
  async getOrder(id) {
    const { data } = await supabase.from('orders').select('*').eq('id', id).maybeSingle();
    return data ? toOrder(data) : null;
  },
  async cancelOrder(id) {
    const { error } = await supabase.from('orders').update({ status: 'cancelled' }).eq('id', id);
    if (error) throw new Error(error.message);
  },
  async openOrders() {
    const rows = must<any[]>(
      await supabase.from('orders').select('*').eq('status', 'placed').order('created_at'),
    );
    return rows.map(toOrder);
  },
  async runnerOrders() {
    const uid = await requireUserId();
    const rows = must<any[]>(
      await supabase.from('orders').select('*').eq('runner_id', uid).order('created_at', { ascending: false }),
    );
    return rows.map(toOrder);
  },
  async acceptOrder(id) {
    const { error } = await supabase.rpc('accept_order', { order_id: id });
    if (error) throw new Error(error.message);
  },
  async setOrderStatus(id, status: OrderStatus) {
    const { error } = await supabase.from('orders').update({ status }).eq('id', id);
    if (error) throw new Error(error.message);
  },
  async updateRunnerLocation(id, lat, lng) {
    const { error } = await supabase.from('orders').update({ runner_lat: lat, runner_lng: lng }).eq('id', id);
    if (error) throw new Error(error.message);
  },
  async allOrders() {
    const rows = must<any[]>(await supabase.from('orders').select('*').order('created_at', { ascending: false }));
    return rows.map(toOrder);
  },

  async listShops() {
    const rows = must<any[]>(await supabase.from('shops').select('*'));
    return rows.map(toShop);
  },
  async myShop() {
    const uid = await requireUserId();
    const { data } = await supabase.from('shops').select('*').eq('owner_id', uid).maybeSingle();
    return data ? toShop(data) : null;
  },
  async createShop(name, description) {
    const uid = await requireUserId();
    const { data: prof } = await supabase.from('profiles').select('full_name, phone').eq('id', uid).single();
    const row = must<any>(
      await supabase
        .from('shops')
        .insert({ owner_id: uid, owner_name: prof?.full_name || prof?.phone || '', name, description })
        .select()
        .single(),
    );
    return toShop(row);
  },
  async updateShopImage(imageUrl) {
    const uid = await requireUserId();
    const { error } = await supabase.from('shops').update({ image_url: imageUrl }).eq('owner_id', uid);
    if (error) throw new Error(error.message);
  },
  async uploadGebeyaImage(uri) {
    const uid = await requireUserId();
    const response = await fetch(uri);
    const bytes = await response.arrayBuffer();
    const path = `${uid}/${Date.now()}.jpg`;
    const { error } = await supabase.storage.from('gebeya-images').upload(path, bytes, { contentType: 'image/jpeg', upsert: false });
    if (error) throw new Error(error.message);
    return supabase.storage.from('gebeya-images').getPublicUrl(path).data.publicUrl;
  },
  async listProducts(kind: ProductKind) {
    let query = supabase.from('products').select('*').eq('kind', kind).order('created_at', { ascending: false });
    if (kind === 'used') query = query.eq('moderation_status', 'approved');
    const rows = must<any[]>(await query);
    return rows.map(toProduct);
  },
  async createProduct(input: NewProductInput) {
    const uid = await requireUserId();
    const { data: prof } = await supabase.from('profiles').select('full_name, phone').eq('id', uid).single();
    let effectiveShopId = input.shopId;
    if (input.kind === 'new' && !effectiveShopId) {
      const { data: ownShop } = await supabase.from('shops').select('id').eq('owner_id', uid).maybeSingle();
      effectiveShopId = ownShop?.id ?? null;
      if (!effectiveShopId) throw new Error('Create your shop before adding products.');
    }
    let shopName: string | null = null;
    if (effectiveShopId) {
      const { data: shop } = await supabase.from('shops').select('name').eq('id', effectiveShopId).single();
      shopName = shop?.name ?? null;
    }
    let moderationStatus = 'approved';
    let moderationNote = '';
    if (input.kind === 'used') {
      const check = await supabase.functions.invoke('moderate-product', { body: { title: input.title, description: input.description, condition: input.condition } });
      if (check.error) throw new Error(check.error.message);
      moderationStatus = check.data?.approved ? 'approved' : 'pending';
      moderationNote = check.data?.reason ?? '';
    }
    const { error } = await supabase.from('products').insert({
      kind: input.kind,
      shop_id: effectiveShopId,
      shop_name: shopName,
      seller_id: uid,
      seller_name: prof?.full_name || prof?.phone || '',
      seller_phone: prof?.phone || '',
      title: input.title,
      description: input.description,
      price: input.price,
      condition: input.condition,
      image_url: input.imageUrl,
      moderation_status: moderationStatus,
      moderation_note: moderationNote,
    });
    if (error) {
      if (error.message.includes('WEEKLY_LIMIT')) throw new Error('You can only post one used item per week.');
      throw new Error(error.message);
    }
  },
  async deleteProduct(id) {
    const { error } = await supabase.from('products').delete().eq('id', id);
    if (error) throw new Error(error.message);
  },
  async nextUsedPostAt() {
    const uid = await requireUserId();
    const { data } = await supabase
      .from('products')
      .select('created_at')
      .eq('seller_id', uid)
      .eq('kind', 'used')
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();
    if (!data) return null;
    const next = new Date(new Date(data.created_at).getTime() + 7 * 86400000);
    return next.getTime() > Date.now() ? next : null;
  },
  async listMerchantStories() {
    const rows = must<any[]>(await supabase.from('merchant_stories').select('*').gt('expires_at', new Date().toISOString()).order('created_at', { ascending: false }));
    const shops = await supabaseApi.listShops();
    return rows.map((r: any): MerchantStory => { const shop = shops.find((s) => s.ownerId === r.merchant_id); return { id: r.id, merchantId: r.merchant_id, merchantName: shop?.ownerName ?? '', shopName: shop?.name ?? '', shopImageUrl: shop?.imageUrl ?? null, text: r.text, imageUrl: r.image_url ?? null, createdAt: r.created_at, expiresAt: r.expires_at }; });
  },
  async createMerchantStory(text, imageUrl) {
    const uid = await requireUserId();
    const { error } = await supabase.from('merchant_stories').insert({ merchant_id: uid, text, image_url: imageUrl });
    if (error) throw new Error(error.message);
  },
  async listTips() {
    const rows = must<any[]>(await supabase.from('tips').select('*').order('created_at', { ascending: false }));
    return rows.map(toTip);
  },
  async saveTip(tip) {
    const values = { title: tip.title, description: tip.description, link: tip.link || null, updated_at: new Date().toISOString() };
    const { error } = tip.id ? await supabase.from('tips').update(values).eq('id', tip.id) : await supabase.from('tips').insert(values);
    if (error) throw new Error(error.message);
  },
  async deleteTip(id) {
    const { error } = await supabase.from('tips').delete().eq('id', id);
    if (error) throw new Error(error.message);
  },

  async myApplication() {
    const uid = await requireUserId();
    const { data } = await supabase
      .from('merchant_applications')
      .select('*')
      .eq('user_id', uid)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();
    return data ? toApplication(data) : null;
  },
  async applyMerchant(shopName, description) {
    const uid = await requireUserId();
    const { data: prof } = await supabase.from('profiles').select('full_name, phone').eq('id', uid).single();
    const { error } = await supabase.from('merchant_applications').insert({
      user_id: uid,
      user_name: prof?.full_name || prof?.phone || '',
      user_phone: prof?.phone || '',
      shop_name: shopName,
      description,
    });
    if (error) throw new Error(error.message);
  },
  async verifyMerchantPayment(provider: string, reference: string) {
    const { data, error } = await supabase.functions.invoke('verify-merchant-payment', { body: { provider, reference } });
    if (error) throw new Error(error.message);
    return data;
  },
  async listApplications() {
    const rows = must<any[]>(
      await supabase.from('merchant_applications').select('*').order('created_at', { ascending: false }),
    );
    return rows.map(toApplication);
  },
  async decideApplication(id, approve) {
    const status = approve ? 'approved' : 'rejected';
    const { data: appRow, error } = await supabase
      .from('merchant_applications')
      .update({ status })
      .eq('id', id)
      .select()
      .single();
    if (error) throw new Error(error.message);
    if (approve) {
      await supabase.from('profiles').update({ role: 'merchant' }).eq('id', appRow.user_id);
      const { error: shopError } = await supabase.from('shops').upsert({ owner_id: appRow.user_id, owner_name: appRow.user_name, name: appRow.shop_name, description: appRow.description }, { onConflict: 'owner_id' });
      if (shopError) throw new Error(shopError.message);
    }
  },

  async listUsers() {
    const rows = must<any[]>(await supabase.from('profiles').select('*').order('full_name'));
    return rows.map(toProfile);
  },
  async setRole(userId, role: Role) {
    const { error } = await supabase.from('profiles').update({ role }).eq('id', userId);
    if (error) throw new Error(error.message);
  },

  async tvMatch() {
    const { data, error } = await supabase.rpc('tv_match');
    if (error) throw new Error(error.message);
    return data ?? null;
  },
  async tvLeave() {
    await supabase.rpc('tv_leave');
  },
  async report(reason, room) {
    const uid = await requireUserId();
    const { error } = await supabase.from('reports').insert({ reporter_id: uid, reason, room });
    if (error) throw new Error(error.message);
  },
  async listLive() {
    const rows = must<any[]>(await supabase.from('tv_live').select('*').order('started_at', { ascending: false }));
    return rows.map(
      (r: any): LiveStream => ({
        id: r.id,
        hostId: r.host_id,
        hostName: r.host_name,
        title: r.title,
        roomName: r.room_name,
        startedAt: r.started_at,
      }),
    );
  },
  async startLive(title) {
    const uid = await requireUserId();
    const { data: prof } = await supabase.from('profiles').select('full_name, phone').eq('id', uid).single();
    const row = must<any>(
      await supabase
        .from('tv_live')
        .insert({
          host_id: uid,
          host_name: prof?.full_name || prof?.phone || '',
          title,
          room_name: `live-${uid}`,
        })
        .select()
        .single(),
    );
    return { id: row.id, hostId: row.host_id, hostName: row.host_name, title: row.title, roomName: row.room_name, startedAt: row.started_at };
  },
  async endLive(id) {
    const { error } = await supabase.from('tv_live').delete().eq('id', id);
    if (error) throw new Error(error.message);
  },
  async getLiveKitToken(room: string, canPublish: boolean) {
    const { data, error } = await supabase.functions.invoke('livekit-token', { body: { room, canPublish } });
    if (error) throw new Error(error.message);
    return data.token as string;
  },
};
