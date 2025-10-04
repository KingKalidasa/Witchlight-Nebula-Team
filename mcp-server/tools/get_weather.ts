// ----------------------------- weather.ts -----------------------------
// Purpose: Defines and registers a tool to query weather data for the MCP server.
// ------------------------------------------------------------------

import { date, z } from "zod"; // zod is used to define and validate input/output schemas
import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";


export function register(server: McpServer) {

  server.registerTool(
    "get_weather", // internal name used by MCP 
    {
      title: "Weather Query Tool", // human-readable name
      description: "take location by name and day (YYYY-MM-DD) to get historical temperature average in Fahrenheit", 
      
      inputSchema: z.object({
        location_name: z.string(),
        date_YYYYMMDD: z.date()
      }).shape,
      outputSchema: z.object({ result: z.number() }).shape, // output will contain a "result" number
    },

    async ({ location_name, date_YYYYMMDD }) => {
      
      // const output = { result: location_name + date_YYYYMMDD };
      const output = { result: 80 };

      // Return both a text representation and a structured JSON object
      return {
        content: [
          {
            type: "text", 
            text: JSON.stringify(output), 
          },
        ],
        structuredContent: output,
      };
    }
  );
}
