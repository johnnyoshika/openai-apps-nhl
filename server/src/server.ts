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
server.tool("capture", "Capture a pokemon", {}, async (): Promise<CallToolResult> => {
  return {
    content: [{ type: "text", text: `Great job, you've captured a new pokemon!` }],
    isError: false,
  };
});

export default server;
