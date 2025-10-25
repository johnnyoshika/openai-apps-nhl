import { type CallToolResult } from "@modelcontextprotocol/sdk/types.js";
import { getTeamScoreboard } from "./nhl-scoreboard.js";
import { z } from "zod";
import { McpServer } from "skybridge/server";

const server = new McpServer(
  {
    name: "alpic-openai-app",
    version: "0.0.1",
  },
  { capabilities: {} },
);

server.widget(
  "nhl-scoreboard",
  {
    description: "NHL team scoreboard for upcoming and live games",
  },
  {
    description: "Show multiple upcoming or live games for an NHL team (3-letter code).",
    inputSchema: {
      team: z.string().describe("NHL team 3-letter code, e.g., VAN"),
    },
    outputSchema: {
      team: z.string(),
    },
  },
  async ({ team }): Promise<CallToolResult> => {
    try {
      const code = (team || "VAN").toUpperCase();
      const scoreboard = await getTeamScoreboard(code);

      return {
        _meta: {},
        structuredContent: scoreboard,
        content: [
          {
            type: "text",
            text: `${code} games: ${scoreboard.games.length}`,
          },
        ],
        isError: false,
      };
    } catch (error) {
      return {
        content: [{ type: "text", text: `Error: ${error}` }],
        isError: true,
      };
    }
  },
);

// MCP tools, resource and prompt APIs remains available and unchanged for other clients
server.tool(
  "nhl-next-game",
  "Get the next upcoming or live game for an NHL team",
  { team: z.string().describe("NHL team 3-letter code, e.g., VAN").optional() },
  async ({ team }): Promise<CallToolResult> => {
    try {
      const code = (team ?? "VAN").toUpperCase();
      const { games } = await getTeamScoreboard(code);

      const order = new Map([
        ["LIVE", 0],
        ["CRIT", 1],
        ["PRE", 2],
        ["FUT", 3],
      ]);

      const next = games.slice().sort((a, b) => {
        const ao = order.get(a.state) ?? 99;
        const bo = order.get(b.state) ?? 99;
        if (ao !== bo) return ao - bo;
        return new Date(a.startTimeUTC).getTime() - new Date(b.startTimeUTC).getTime();
      })[0];

      if (!next) {
        return {
          content: [{ type: "text", text: `No upcoming or live games found for ${code}.` }],
          isError: false,
        };
      }

      const isHome = next.home.abbrev === code;
      const opp = isHome ? next.away : next.home;
      const vs = isHome ? "vs" : "@";
      const d = new Date(next.startTimeUTC);
      const when = `${d.toLocaleDateString()} ${d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}`;
      const tv = next.tv.length ? ` TV: ${next.tv.join(", ")}.` : "";
      const links: string[] = [];
      if (next.links.gameCenter) links.push(`Game Center: ${next.links.gameCenter}`);
      if (next.links.tickets) links.push(`Tickets: ${next.links.tickets}`);
      const linksText = links.length ? ` ${links.join("  ")}` : "";

      const text = `${code} ${vs} ${opp.abbrev} on ${when} at ${next.venue}. State: ${next.state}.${tv}${linksText}`;

      return {
        content: [{ type: "text", text }],
        isError: false,
      };
    } catch (error) {
      return {
        content: [{ type: "text", text: `Error: ${error}` }],
        isError: true,
      };
    }
  },
);

export default server;
