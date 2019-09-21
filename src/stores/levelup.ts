import levelup from "levelup";
import { AbstractLevelDOWN } from "abstract-leveldown";

import { StorageEngine, KeyValue } from "../storage";

export const createLevelUpStore = (db: AbstractLevelDOWN): StorageEngine => {
  const levels = levelup(db);

  return {
    get: (key: string) =>
      new Promise<string>((resolve, reject) =>
        levels.get(key, (err, value) => {
          if (err) {
            if (err.message.includes("Key not found")) {
              resolve(undefined);
            }
            reject(err);
          }

          resolve(value ? value.toString("utf-8") : undefined);
        })
      ),
    put: (key: string, value: string) =>
      new Promise<void>((resolve, reject) =>
        levels.put(key, value, err => {
          if (err) {
            reject(err);
          }
          resolve(undefined);
        })
      ),

    delete: (key: string) =>
      new Promise<void>((resolve, reject) =>
        levels.del(key, err => {
          if (err) {
            reject(err);
          }
          resolve(undefined);
        })
      ),
    getPrefix: (key: string) =>
      new Promise<KeyValue[]>((resolve, reject) => {
        const kvs: KeyValue[] = [];

        levels
          .createReadStream({
            gte: key,
            // TODO: is this the correct end bound?
            lt: key + "0"
          })
          .on("data", data => {
            const decoded = {
              key: data.key.toString("utf-8"),
              value: data.value.toString("utf-8")
            };
            // TODO: is this check necessary based on gte/lt bounds?
            if (decoded.key === key || decoded.key.startsWith(key + "/")) {
              kvs.push([decoded.key, decoded.value]);
            }
          })
          .on("error", err => reject(err))
          .on("end", () => resolve(kvs));
      })
  };
};
