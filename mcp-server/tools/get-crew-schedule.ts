// -------------------------- get-iss-schedule.ts -------------------------
// MCP tool that reads the ISS crew schedule from a local CSV file.
// Returns full or filtered schedule entries (by day or crew member).
// -----------------------------------------------------------------------

import fs from "fs";
import path from "path";
import csv from "csv-parser";
import { z } from "zod";
import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";

// Define the shape of a schedule record
const CrewRecordSchema = z.object({
  Date: z.string(),
  Day: z.string(),
  "Crew Member": z.string(),
  Role: z.string(),
  "Shift Start (UTC)": z.string(),
  "Shift End (UTC)": z.string(),
  Activity: z.string(),
  Location: z.string(),
  Notes: z.string().optional(),
});

export function register(server: McpServer) {
  server.registerTool(
    "get-iss-schedule",
    {
      title: "Get ISS Crew Schedule",
      description:
        "Read the ISS crew schedule from a CSV file. Optionally filter by day or crew member name.",
      inputSchema: z
        .object({
          day: z
            .string()
            .optional()
            .describe("Filter schedule by day (e.g., 'Monday')"),
          name: z
            .string()
            .optional()
            .describe("Filter schedule by crew member name (case-insensitive)"),
        })
        .shape,
      outputSchema: z.object({
        results: z.array(CrewRecordSchema),
      }).shape,
    },
    async ({ day, name }) => {
      try {
        // Resolve path to CSV (in util/ directory)
        const csvPath = path.join(__dirname,"data", "iss_schedule.csv");

        if (!fs.existsSync(csvPath)) {
          throw new Error("Schedule file not found in util/ directory");
        }

        // Read and parse CSV asynchronously
        const records: any[] = await new Promise((resolve, reject) => {
          const rows: any[] = [];
          fs.createReadStream(csvPath)
            .pipe(csv())
            .on("data", (row) => rows.push(row))
            .on("end", () => resolve(rows))
            .on("error", reject);
        });

        // Apply filters if provided
        let filtered = records;
        if (day) {
          filtered = filtered.filter(
            (r) => r.Day.toLowerCase() === day.toLowerCase()
          );
        }
        if (name) {
          filtered = filtered.filter((r) =>
            r["Crew Member"].toLowerCase().includes(name.toLowerCase())
          );
        }

        if (filtered.length === 0) {
          return {
            content: [
              {
                type: "text",
                text: `No schedule entries found for filters: day="${day || "—"}", name="${name || "—"}"`,
              },
            ],
            structuredContent: { results: [] },
          };
        }

        // Format a nice textual summary
        const summary = filtered
          .map(
            (r) =>
              `📅 **${r.Day} (${r.Date})** — ${r["Crew Member"]} (${r.Role})\n🕕 ${r["Shift Start (UTC)"]} → ${r["Shift End (UTC)"]}\n🔧 **Activity:** ${r.Activity}\n📍 ${r.Location}${r.Notes ? `\n📝 ${r.Notes}` : ""}`
          )
          .join("\n\n---\n\n");

        return {
          content: [
            {
              type: "text",
              text: `🛰️ **ISS Crew Schedule** (${filtered.length} entries)\n\n${summary}`,
            },
          ],
          structuredContent: { results: filtered },
        };
      } catch (err) {
        const message = err instanceof Error ? err.message : String(err);
        return {
          content: [
            { type: "text", text: `Failed to read ISS schedule: ${message}` },
          ],
          structuredContent: { error: message },
        };
      }
    }
  );
}
