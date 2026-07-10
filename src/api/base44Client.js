// src/api/base44Client.js
// Drop-in Supabase replacement for Base44 SDK

import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    detectSessionInUrl: true,
    persistSession: true,
    flowType: 'pkce',
  }
});

// ── Auth helpers ──────────────────────────────────────────────
export const auth = {
  signUp: ({ email, password, fullName, phone }) =>
    supabase.auth.signUp({
      email,
      password,
      options: { data: { full_name: fullName, phone } },
    }),

  signIn: ({ email, password }) =>
    supabase.auth.signInWithPassword({ email, password }),

  signOut: () => supabase.auth.signOut(),

  getUser: () => supabase.auth.getUser(),

  resetPassword: (email) =>
    supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    }),

  updatePassword: (newPassword) =>
    supabase.auth.updateUser({ password: newPassword }),

  onAuthStateChange: (callback) =>
    supabase.auth.onAuthStateChange(callback),
};

// ── Generic CRUD factory ──────────────────────────────────────
function createEntity(tableName) {
  return {
    list: async (filters = {}) => {
      let query = supabase.from(tableName).select('*');
      Object.entries(filters).forEach(([key, val]) => {
        query = query.eq(key, val);
      });
      const { data, error } = await query.order('created_at', { ascending: false });
      if (error) throw error;
      return data;
    },

    get: async (id) => {
      const { data, error } = await supabase
        .from(tableName)
        .select('*')
        .eq('id', id)
        .single();
      if (error) throw error;
      return data;
    },

    create: async (payload) => {
      const { data, error } = await supabase
        .from(tableName)
        .insert(payload)
        .select()
        .single();
      if (error) throw error;
      return data;
    },

    update: async (id, payload) => {
      const { data, error } = await supabase
        .from(tableName)
        .update(payload)
        .eq('id', id)
        .select()
        .single();
      if (error) throw error;
      return data;
    },

    delete: async (id) => {
      const { error } = await supabase.from(tableName).delete().eq('id', id);
      if (error) throw error;
      return true;
    },

    filter: async (column, operator, value) => {
      const { data, error } = await supabase
        .from(tableName)
        .select('*')
        .filter(column, operator, value)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data;
    },
  };
}

// ── Entities ──────────────────────────────────────────────────
export const Group             = createEntity('groups');
export const Membership        = createEntity('memberships');
export const Contribution      = createEntity('contributions');
export const WithdrawalRequest = createEntity('withdrawal_requests');
export const Notification      = createEntity('notifications');

// ── Default export ────────────────────────────────────────────
export default supabase;

// ── Legacy base44 export ──────────────────────────────────────
export const base44 = {
  auth: {
    me: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      return user;
    },
    logout: async () => await supabase.auth.signOut(),
    redirectToLogin: () => { window.location.href = '/login'; }
  }
};