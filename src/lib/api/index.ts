import { hasSupabase } from '../supabaseClient';
import { mockApi } from './mock';
import { supabaseApi } from './supabase';
import { Api } from './types';

export const api: Api = hasSupabase ? supabaseApi : mockApi;
export * from './types';
