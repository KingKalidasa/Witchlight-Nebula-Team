// ----------------------------- weather.ts -----------------------------
// Purpose: Defines and registers a tool to query weather data for the MCP server.
// ------------------------------------------------------------------

import { z, number, date, string } from "zod"; // zod is used to define and validate input/output schemas
import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { getJson } from "serpapi";
import dotenv from 'dotenv';

dotenv.config();


export function register(server: McpServer) {

  server.registerTool(
    "get_weather", // internal name used by MCP 
    {
      title: "Weather Query Tool", // human-readable name
      description: "take location by name and day (YYYY-MM-DD) to get weather conditions in Fahrenheit", 
      
      inputSchema: z.object({
        location_name: z.string(),
        date_YYYYMMDD: z.date()
      }).shape,
      outputSchema: z.object({ 
        temperature: z.number(), 
        winds: z.string(),
        precipitation: z.string()
      }).shape, 
    },
    
    async ({ location_name, date_YYYYMMDD }) => {
      
      // const output = { result: location_name + date_YYYYMMDD };
      const query = "what is the weather in " + location_name + " on " + date_YYYYMMDD.toString;
      const json= await new Promise((resolve, reject) => {
        getJson(
        {
          api_key: process.env.SERPAPI_KEY,
          engine: "google",
          q: query,
          google_domain: "google.com",
          gl: "us",
          hl: "en"
        },
        (result) => {
          if (result) resolve(result);
          else reject(new Error("No result from SerpAPI"));
        }
      );
  });

 const body = (json as any)?.answer_box;
 let output;

  if (body) {
    output = { 
      temperature: body.temperature,
      winds: body.wind,
      precipitation: body.precipitation
     };
  } else {
    output = { result: "not found" };
  }
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
