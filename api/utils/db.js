const fs = require('fs');
const path = require('path');

// Target file path for the local development database
const DB_FILE = path.join(process.cwd(), 'database.json');

// Helper to initialize and seed database if it doesn't exist
const initDb = () => {
  if (!fs.existsSync(DB_FILE)) {
    const defaultData = {
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
    fs.writeFileSync(DB_FILE, JSON.stringify(defaultData, null, 2), 'utf8');
  }
};

// Read database contents
const readData = () => {
  initDb();
  try {
    const content = fs.readFileSync(DB_FILE, 'utf8');
    return JSON.parse(content);
  } catch (error) {
    console.error("Failed to read JSON DB, returning empty schema", error);
    return { users: [], stocks: [], news: [], feedback: [], logs: [] };
  }
};

// Write database contents
const writeData = (data) => {
  try {
    fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2), 'utf8');
    return true;
  } catch (error) {
    console.error("Failed to write to JSON DB", error);
    return false;
  }
};

module.exports = {
  readData,
  writeData,
  initDb
};
