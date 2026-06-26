import fs from 'fs';
import path from 'path';

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

const getDbFilePath = (): string => {
  if (process.env.VERCEL === '1' || process.env.NOW_BUILDER === '1') {
    return path.join('/tmp', 'database.json');
  }
  return path.join(process.cwd(), 'database.json');
};

const DB_FILE = getDbFilePath();

export const initDb = (): void => {
  if (!fs.existsSync(DB_FILE)) {
    const defaultData: DatabaseSchema = {
      users: [
        {
          id: "1",
          googleId: "111111111111111111111",
          name: "Administrator",
          email: "AviPro1122@gmail.com",
          profileImage: "https://api.dicebear.com/7.x/bottts/svg?seed=Admin",
          role: "ADMIN",
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          lastLogin: new Date().toISOString()
        }
      ],
      stocks: [
        { id: "1", ticker: "RELIANCE", name: "Reliance Industries Ltd.", price: 2945.60, change: "+1.85%", marketCap: "₹19.92 Lakh Cr", peRatio: "27.4", divYield: "0.34%", roe: "9.6%" },
        { id: "2", ticker: "TATAPOWER", name: "Tata Power Company Ltd.", price: 435.25, change: "+4.12%", marketCap: "₹1.39 Lakh Cr", peRatio: "34.8", divYield: "0.52%", roe: "12.4%" },
        { id: "3", ticker: "TATAMOTORS", name: "Tata Motors Ltd.", price: 960.40, change: "+2.11%", marketCap: "₹3.18 Lakh Cr", peRatio: "11.2", divYield: "0.60%", roe: "22.4%" }
      ],
      news: [
        { id: "1", title: "PM Surya Ghar Yojana Boosts Tata Power Solar Pipeline", content: "Tata Power Solar registered an 18% YoY growth in its order book, reaching ₹15,400 crore, following the implementation of the PM Surya Ghar Muft Bijli Yojana.", author: "UperAI News Desk", date: new Date().toISOString() },
        { id: "2", title: "Auto Sector Valuation Dispersion Widens in Q1 FY26", content: "Divergence between CVs and Two-Wheelers recovery maps to higher premium values for structural profiles like Bajaj Auto and Tata Motors.", author: "UperAI Analysts", date: new Date().toISOString() }
      ],
      feedback: [
        { id: "1", name: "Rohan Das", email: "rohan@gmail.com", type: "feedback", message: "Terminal is super fast and clean. Love the interactive chart!", date: new Date().toISOString() }
      ],
      logs: [
        { id: "1", email: "AviPro1122@gmail.com", action: "DATABASE_INITIALIZED", details: "Local JSON Database seeded and verified.", timestamp: new Date().toISOString() }
      ]
    };
    try {
      fs.mkdirSync(path.dirname(DB_FILE), { recursive: true });
      fs.writeFileSync(DB_FILE, JSON.stringify(defaultData, null, 2), 'utf8');
    } catch (error) {
      console.error("Failed to initialize JSON database file:", error);
    }
  }
};

export const readData = (): DatabaseSchema => {
  initDb();
  try {
    const content = fs.readFileSync(DB_FILE, 'utf8');
    return JSON.parse(content) as DatabaseSchema;
  } catch (error) {
    console.error("Failed to read JSON DB, returning empty schema", error);
    return { users: [], stocks: [], news: [], feedback: [], logs: [] };
  }
};

export const writeData = (data: DatabaseSchema): boolean => {
  try {
    fs.mkdirSync(path.dirname(DB_FILE), { recursive: true });
    fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2), 'utf8');
    return true;
  } catch (error) {
    console.error("Failed to write to JSON DB", error);
    return false;
  }
};
