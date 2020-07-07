import http from "http";
import https from "https";
import express from "express";
import cors from "cors";
import fs from "fs";
import { applyMiddleware, applyRoutes } from "./utils";
import middleware from "./middleware";
import errorHandlers from "./middleware/error-handlers";
import routes from "./services";
import { SocketService } from "./services/websocket/socket-service";

require("dotenv").config({ path: __dirname + "/.env" });

process.on("uncaughtException", e => {
  console.log(e);
  process.exit(1);
});

process.on("unhandledRejection", e => {
  console.log(e);
  process.exit(1);
});

const router = express();
router.use('/public', express.static('public'));
router.use(cors());
applyMiddleware(middleware, router);
applyRoutes(routes, router);
applyMiddleware(errorHandlers, router);

let server: any;

if (process.env.SERVER_PROTOCOL == 'http') {
  server = http.createServer(router);
} else {
  const options = {
    cert: fs.readFileSync(String(process.env.CERT_PATH), "utf-8"),
    key: fs.readFileSync(String(process.env.PRV_KEY_PATH), "utf-8")
  };

  server = https.createServer(options, router);
}

const NODE_PORT = Number(process.env.NODE_PORT) ? Number(process.env.NODE_PORT) : 28100;
const CSM_AGENT_PORT: number = Number(process.env.CSM_AGENT_PORT);
const CSM_AGENT_HOST: string = process.env.CSM_AGENT_HOST || "";

server.listen(NODE_PORT, () => {
  console.log("Server is running at " + process.env.SERVER_PROTOCOL + "://localhost:" + NODE_PORT);

  // Server shoud send data over other socket
  const socketServer = new SocketService(server);
  socketServer.getConnection("ws://" + CSM_AGENT_HOST + ":" + CSM_AGENT_PORT + "/ws");

}
);
