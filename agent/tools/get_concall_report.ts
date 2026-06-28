import { defineTool } from "eve/tools";
import { z } from "zod";
import fs from "fs";
import path from "path";

export default defineTool({
  description: "Retrieve the parsed earnings call (concall) transcript summary for a specific company symbol and optionally a specific quarter.",
  inputSchema: z.object({
    symbol: z.string().describe("The stock symbol of the company (e.g. RELIANCE, ADANIENT, TATAPOWER)."),
    quarter: z.string().optional().describe("Specific quarter if requested (e.g. Q2_FY26, Q4_FY25). If not specified, returns all available quarters."),
  }),
  async execute({ symbol, quarter }) {
    try {
      const cleanSymbol = symbol.trim().toUpperCase().replace('.NS', '').replace('.BO', '');
      const dbPath = path.join(process.cwd(), "concalls.json");
      
      if (!fs.existsSync(dbPath)) {
        return { error: "Concalls database file not found." };
      }
      
      const fileData = await fs.promises.readFile(dbPath, "utf-8");
      const db = JSON.parse(fileData);
      
      const companyData = db[cleanSymbol];
      if (!companyData) {
        return { error: `No concall data found for symbol: ${cleanSymbol}` };
      }
      
      if (quarter) {
        const quarterData = companyData[quarter];
        if (!quarterData) {
          return { 
            error: `No data found for quarter: ${quarter} under symbol: ${cleanSymbol}.`,
            availableQuarters: Object.keys(companyData)
          };
        }
        return { symbol: cleanSymbol, quarter, report: quarterData };
      }
      
      return { symbol: cleanSymbol, reports: companyData };
    } catch (error: any) {
      return { error: `Failed to retrieve concall data: ${error.message}` };
    }
  },
});
