import { WebSocketServer, type WebSocket } from "ws";

type WsEvent =
  | { type: "init"; payload: unknown }
  | { type: "sensor:reading"; payload: unknown }
  | { type: "sensor:error"; payload: unknown }
  | { type: "device-action:created"; payload: unknown }
  | { type: "device-state:changed"; payload: unknown };

export class WsHub {
  private readonly server: WebSocketServer;
  private readonly clients = new Set<WebSocket>();

  constructor(server: WebSocketServer) {
    this.server = server;
    this.server.on("connection", (socket) => {
      this.clients.add(socket);
      socket.on("close", () => this.clients.delete(socket));
    });
  }

  broadcast(event: WsEvent) {
    const message = JSON.stringify(event);
    for (const client of this.clients) {
      if (client.readyState === client.OPEN) {
        client.send(message);
      }
    }
  }
}
