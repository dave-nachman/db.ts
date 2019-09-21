import Bluebird from "bluebird";
import * as t from "io-ts";
import { Client } from "./client";

export const getEntityManager = (client: Client, time?: number) => {
  // API generally tries to mirrors typeorm's EntityManager API
  return {
    save: (data: object | object[]) =>
      Array.isArray(data)
        ? Bluebird.Promise.each(data, item => client.write({ data: item }))
        : client.write({ data }),

    find: (type: t.Type<object>) => client.readAll({ type, time }),

    useTime: (time: number) => getEntityManager(client, time)
  };
};
