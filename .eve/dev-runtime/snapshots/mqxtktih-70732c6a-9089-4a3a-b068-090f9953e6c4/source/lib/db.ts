import { supabase } from './supabase';

export interface User {
  id: string;
  googleId: string;
  name: string;
  email: string;
  profileImage: string;
  role: 'ADMIN' | 'USER';
  createdAt: string;
  updatedAt: string;
  lastLogin: string;
}

export interface Stock {
  id: string;
  ticker: string;
  name: string;
  price: number;
  change: string;
  marketCap: string;
  peRatio: string;
  divYield: string;
  roe: string;
}

export interface NewsArticle {
  id: string;
  title: string;
  content: string;
  author: string;
  date: string;
}

export interface Feedback {
  id: string;
  name: string;
  email: string;
  type: string;
  message: string;
  date: string;
}

export interface SystemLog {
  id: string;
  email: string;
  action: string;
  details: string;
  timestamp: string;
}

export interface DatabaseSchema {
  users: User[];
  stocks: Stock[];
  news: NewsArticle[];
  feedback: Feedback[];
  logs: SystemLog[];
}

const mapUserFromDb = (u: any): User => ({
  id: u.id,
  googleId: u.google_id || '',
  name: u.name || '',
  email: u.email || '',
  profileImage: u.profile_image || '',
  role: u.role || 'USER',
  createdAt: u.created_at || '',
  updatedAt: u.updated_at || '',
  lastLogin: u.last_login || '',
});

const mapUserToDb = (u: User) => ({
  id: u.id,
  google_id: u.googleId,
  name: u.name,
  email: u.email,
  profile_image: u.profileImage,
  role: u.role,
  created_at: u.createdAt,
  updated_at: u.updatedAt,
  last_login: u.lastLogin,
});

const mapStockFromDb = (s: any): Stock => ({
  id: s.id,
  ticker: s.ticker || '',
  name: s.name || '',
  price: s.price || 0,
  change: s.change || '',
  marketCap: s.market_cap || '',
  peRatio: s.pe_ratio || '',
  divYield: s.div_yield || '',
  roe: s.roe || '',
});

const mapStockToDb = (s: Stock) => ({
  id: s.id,
  ticker: s.ticker,
  name: s.name,
  price: s.price,
  change: s.change,
  market_cap: s.marketCap,
  pe_ratio: s.peRatio,
  div_yield: s.divYield,
  roe: s.roe,
});

export const readData = async (): Promise<DatabaseSchema> => {
  try {
    const [usersRes, stocksRes, newsRes, feedbackRes, logsRes] = await Promise.all([
      supabase.from('users').select('*'),
      supabase.from('stocks').select('*'),
      supabase.from('news').select('*'),
      supabase.from('feedback').select('*'),
      supabase.from('logs').select('*')
    ]);

    return {
      users: (usersRes.data || []).map(mapUserFromDb),
      stocks: (stocksRes.data || []).map(mapStockFromDb),
      news: newsRes.data || [],
      feedback: feedbackRes.data || [],
      logs: logsRes.data || []
    };
  } catch (error) {
    console.error("Failed to read JSON DB, returning empty schema", error);
    return { users: [], stocks: [], news: [], feedback: [], logs: [] };
  }
};

export const writeData = async (data: DatabaseSchema): Promise<boolean> => {
  try {
    const usersToDb = data.users.map(mapUserToDb);
    const stocksToDb = data.stocks.map(mapStockToDb);
    const newsToDb = data.news;
    const feedbackToDb = data.feedback;
    const logsToDb = data.logs;

    // Fetch existing records to handle deletes
    const [dbUsers, dbStocks, dbNews, dbFeedback, dbLogs] = await Promise.all([
      supabase.from('users').select('id'),
      supabase.from('stocks').select('id'),
      supabase.from('news').select('id'),
      supabase.from('feedback').select('id'),
      supabase.from('logs').select('id')
    ]);

    const usersToDelete = (dbUsers.data || []).filter(row => !data.users.some(u => u.id === row.id)).map(row => row.id);
    const stocksToDelete = (dbStocks.data || []).filter(row => !data.stocks.some(s => s.id === row.id)).map(row => row.id);
    const newsToDelete = (dbNews.data || []).filter(row => !data.news.some(n => n.id === row.id)).map(row => row.id);
    const feedbackToDelete = (dbFeedback.data || []).filter(row => !data.feedback.some(f => f.id === row.id)).map(row => row.id);
    const logsToDelete = (dbLogs.data || []).filter(row => !data.logs.some(l => l.id === row.id)).map(row => row.id);

    const deletePromises = [];
    if (usersToDelete.length > 0) deletePromises.push(supabase.from('users').delete().in('id', usersToDelete));
    if (stocksToDelete.length > 0) deletePromises.push(supabase.from('stocks').delete().in('id', stocksToDelete));
    if (newsToDelete.length > 0) deletePromises.push(supabase.from('news').delete().in('id', newsToDelete));
    if (feedbackToDelete.length > 0) deletePromises.push(supabase.from('feedback').delete().in('id', feedbackToDelete));
    if (logsToDelete.length > 0) deletePromises.push(supabase.from('logs').delete().in('id', logsToDelete));

    await Promise.all([
      ...deletePromises,
      usersToDb.length > 0 ? supabase.from('users').upsert(usersToDb) : Promise.resolve(),
      stocksToDb.length > 0 ? supabase.from('stocks').upsert(stocksToDb) : Promise.resolve(),
      newsToDb.length > 0 ? supabase.from('news').upsert(newsToDb) : Promise.resolve(),
      feedbackToDb.length > 0 ? supabase.from('feedback').upsert(feedbackToDb) : Promise.resolve(),
      logsToDb.length > 0 ? supabase.from('logs').upsert(logsToDb) : Promise.resolve(),
    ]);

    return true;
  } catch (error) {
    console.error("Failed to write to JSON DB", error);
    return false;
  }
};
