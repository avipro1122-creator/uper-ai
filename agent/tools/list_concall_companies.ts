import { defineTool } from "eve/tools";
import { z } from "zod";
import fs from "fs";
import path from "path";

export default defineTool({
  description: "List all company symbols available in the concalls database.",
  inputSchema: z.object({}),
  async execute() {
    try {
      const dbPath = path.join(process.cwd(), "concalls.json");
      if (!fs.existsSync(dbPath)) {
        return { error: "Concalls database file not found." };
      }
      
      const fileData = await fs.promises.readFile(dbPath, "utf-8");
      const db = JSON.parse(fileData);
      const symbols = Object.keys(db);
      return { symbols };
    } catch (error: any) {
      return { error: `Failed to list companies: ${error.message}` };
    }
  },
});
