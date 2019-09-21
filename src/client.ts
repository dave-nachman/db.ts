import net from "net";
import uuid from "uuid/v1";

import { Operations } from "./operations";
import { ClientMessage, ServerMessage } from "./protocol";

// synonym
export type Client = Operations;

export const createClient = (host?: string, port?: number): Promise<Client> => {
  var client = new net.Socket();

  const promises: { [key: string]: any } = {};

  const send = (message: ClientMessage) =>
    client.write(JSON.stringify(message));

  return new Promise<Operations>(resolve => {
    client.connect(port || 9210, host || "127.0.0.1", function() {
      resolve({
        write: payload => {
          const id = uuid();
          return new Promise(resolve => {
            send({
              kind: "write",
              id,
              payload
            });
            promises[id] = resolve;
          });
        },
        read: payload => {
          const id = uuid();
          return new Promise(resolve => {
            send({
              kind: "read",
              id,
              payload
            });
            promises[id] = resolve;
          });
        },
        readAll: payload => {
          const id = uuid();
          return new Promise(resolve => {
            send({
              kind: "readAll",
              id,
              payload
            });
            promises[id] = resolve;
          });
        },
        addType: type => {
          const id = uuid();
          return new Promise(resolve => {
            send({
              kind: "addType",
              id,
              payload: {
                type
              }
            });
            promises[id] = resolve;
          });
        }
      });
    });

    client.on("data", function(data) {
      const message: ServerMessage = JSON.parse(data.toString("utf-8"));

      switch (message.kind) {
        case "ack": {
          return promises[message.payload.clientMessageId](
            message.payload.value
          );
        }
      }
    });

    client.on("close", function() {
      console.log("Connection closed");
    });
  });
};
