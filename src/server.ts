import net from "net";
import uuid from "uuid/v1";

import { Operations } from "./operations";
import { ClientMessage, ServerMessage } from "./protocol";
import { logger } from "./logger";

export const createServer = (
  operations: Operations,
  host?: string,
  port?: number
) => {
  return new Promise(resolve => {
    const server = new net.Server(socket => {
      const send = (message: ServerMessage) => {
        logger.info(`Sending ${JSON.stringify(message, null, 2)}`);
        return socket.write(JSON.stringify(message));
      };

      socket.on("data", async data => {
        const message: ClientMessage = JSON.parse(data.toString("utf-8"));

        logger.info(`Received ${JSON.stringify(message, null, 2)}`);

        switch (message.kind) {
          case "write": {
            try {
              const result = await operations.write(message.payload);

              return send({
                kind: "ack",
                id: uuid(),
                payload: {
                  clientMessageId: message.id,
                  value: result
                }
              });
            } catch (e) {
              console.error(e);
              return send({
                kind: "ack",
                id: uuid(),
                payload: {
                  clientMessageId: message.id,
                  value: String(e)
                }
              });
            }
          }
          case "read": {
            const result = await operations.read(message.payload);

            return send({
              kind: "ack",
              id: uuid(),
              payload: {
                clientMessageId: message.id,
                value: result
              }
            });
          }
          case "readAll": {
            const result = await operations.readAll(message.payload);

            return send({
              kind: "ack",
              id: uuid(),
              payload: {
                clientMessageId: message.id,
                value: result
              }
            });
          }
          // TODO: finish implementation by deserializing JSON to io-ts type
          case "addType": {
            operations = await operations.addType(message.payload.type);

            return send({
              kind: "ack",
              id: uuid(),
              payload: {
                clientMessageId: message.id,
                value: true
              }
            });
          }
        }
      });
    });

    server.listen(port || 9210, host || "127.0.0.1");
    logger.info(`Server started on ${host || "127.0.0.1"}:${port || 9210}`);
    resolve(undefined);
  });
};
