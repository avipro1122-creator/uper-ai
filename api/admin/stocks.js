const { getSessionUser } = require('../utils/auth');
const { readData, writeData } = require('../utils/db');

module.exports = async (req, res) => {
  // Authentication & Authorization check
  const user = getSessionUser(req);
  if (!user) {
    return res.status(401).json({ error: "Unauthorized. Please sign in." });
  }
  if (user.role !== 'ADMIN') {
    return res.status(403).json({ error: "Forbidden. Admin privileges required." });
  }

  const data = readData();
  const now = new Date().toISOString();

  // GET: Retrieve all stocks
  if (req.method === 'GET') {
    try {
      return res.status(200).json({
        success: true,
        stocks: data.stocks
      });
    } catch (e) {
      return res.status(500).json({ error: "Failed to load stocks" });
    }
  }

  // POST: Add new stock record
  if (req.method === 'POST') {
    try {
      const { ticker, name, price, change, marketCap, peRatio, divYield, roe } = req.body;
      if (!ticker || !name || price === undefined) {
        return res.status(400).json({ error: "Missing required fields: ticker, name, price" });
      }

      const cleanTicker = ticker.toUpperCase().trim();

      // Check duplicates
      if (data.stocks.some(s => s.ticker === cleanTicker)) {
        return res.status(400).json({ error: `Stock with ticker ${cleanTicker} already exists.` });
      }

      const newStock = {
        id: String(data.stocks.length + 1),
        ticker: cleanTicker,
        name: name.trim(),
        price: Number(price),
        change: change || "+0.00%",
        marketCap: marketCap || "N/A",
        peRatio: peRatio || "N/A",
        divYield: divYield || "N/A",
        roe: roe || "N/A"
      };

      data.stocks.push(newStock);

      // Log action
      data.logs.push({
        id: String(data.logs.length + 1),
        email: user.email,
        action: "STOCK_CREATED",
        details: `Created stock: ${newStock.ticker} (${newStock.name})`,
        timestamp: now
      });

      writeData(data);

      return res.status(201).json({
        success: true,
        stock: newStock
      });
    } catch (e) {
      console.error(e);
      return res.status(500).json({ error: "Failed to create stock record" });
    }
  }

  // PUT: Update stock details
  if (req.method === 'PUT') {
    try {
      const { id, ticker, name, price, change, marketCap, peRatio, divYield, roe } = req.body;
      if (!id) {
        return res.status(400).json({ error: "Missing stock ID in body" });
      }

      const stock = data.stocks.find(s => s.id === String(id));
      if (!stock) {
        return res.status(404).json({ error: "Stock not found" });
      }

      // Update fields
      if (ticker) stock.ticker = ticker.toUpperCase().trim();
      if (name) stock.name = name.trim();
      if (price !== undefined) stock.price = Number(price);
      if (change !== undefined) stock.change = change;
      if (marketCap !== undefined) stock.marketCap = marketCap;
      if (peRatio !== undefined) stock.peRatio = peRatio;
      if (divYield !== undefined) stock.divYield = divYield;
      if (roe !== undefined) stock.roe = roe;

      // Log action
      data.logs.push({
        id: String(data.logs.length + 1),
        email: user.email,
        action: "STOCK_UPDATED",
        details: `Updated stock details for: ${stock.ticker}`,
        timestamp: now
      });

      writeData(data);

      return res.status(200).json({
        success: true,
        stock
      });
    } catch (e) {
      console.error(e);
      return res.status(500).json({ error: "Failed to update stock record" });
    }
  }

  // DELETE: Remove stock record
  if (req.method === 'DELETE') {
    try {
      const { id } = req.body;
      if (!id) {
        return res.status(400).json({ error: "Missing stock ID in body" });
      }

      const stockIdx = data.stocks.findIndex(s => s.id === String(id));
      if (stockIdx === -1) {
        return res.status(404).json({ error: "Stock not found" });
      }

      const stock = data.stocks[stockIdx];
      data.stocks.splice(stockIdx, 1);

      // Log action
      data.logs.push({
        id: String(data.logs.length + 1),
        email: user.email,
        action: "STOCK_DELETED",
        details: `Deleted stock record: ${stock.ticker}`,
        timestamp: now
      });

      writeData(data);

      return res.status(200).json({
        success: true,
        message: "Stock record deleted successfully"
      });
    } catch (e) {
      console.error(e);
      return res.status(500).json({ error: "Failed to delete stock record" });
    }
  }

  res.setHeader('Allow', ['GET', 'POST', 'PUT', 'DELETE']);
  return res.status(405).json({ error: `Method ${req.method} Not Allowed` });
};
