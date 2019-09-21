import sortBy from "lodash/sortBy";
import last from "lodash/last";
import _ from "lodash";
import * as Bluebird from "bluebird";

import * as t from "io-ts";

import { EncodeOptions, encode, decode } from "./codec";
import { StorageEngine } from "./storage";
import { createTypeManager } from "./type-manager";

export interface Operations {
  write(input: { data: object; options?: EncodeOptions }): Promise<void>;
  read(input: {
    type: t.Type<object>;
    key: string;
    time?: number;
  }): Promise<object>;
  readAll(input: { type: t.Type<object>; time?: number }): Promise<object[]>;
  
  // return a new Operations object at the current timestamp with the additional type definition
  addType(type: t.Type<object>): Promise<Operations>;
}

class NoTypeError extends Error {}

/*
If an object has multiple valid types, it is only stored as one type ("primary type"),
and a "redirect" is stored as a pointer for other types ("secondary types")
*/
const redirectKey = {
  get: (typeId: string, id: string, ts: number) =>
    `${typeId}/${id}/__redirect/${ts}`,
  validate: (key: string) => key.split("/")[2] === "__redirect"
};

export const createOperations = (
  store: StorageEngine,
  types: t.Type<object>[],
  ts: number = 0
): Operations => {
  let typeManager = createTypeManager(types);

  const getTs = async (time?: number) => {
    if (!time) {
      return ts;
    }

    const timestamps = await store.getPrefix("timestamp");
    const futureTs = (timestamps.find(kv => JSON.parse(kv[1]) > time) || [
      undefined,
      undefined
    ])[0];

    if (futureTs) {
      return Number(futureTs.split("/")[1]) - 1;
    } else {
      return ts;
    }
  };

  return {
    write: async ({ data }: { data: object }) => {
      const typeIds = typeManager.getTypeIds(data);

      if (typeIds.length === 0) {
        throw new NoTypeError(
          `No type was found for ${JSON.stringify(data, null, 2)}`
        );
      }

      // TODO: make this transactional
      await Bluebird.Promise.each(
        encode(data, ts, { type: typeIds[0] }),
        ([key, value]) => store.put(key, value)
      );

      for (let typeId of typeIds.slice(1)) {
        const key = redirectKey.get(typeId, data["id"], ts);
        const value = `"${typeIds[0]}/${data["id"]}"`;
        store.put(key, value);
      }

      await store.put(`timestamp/${ts}`, String(Date.now()));
      ts++;
    },
    read: async ({
      type,
      key,
      time
    }: {
      type: t.Type<object>;
      key: string;
      time: number;
    }) => {
      const ts = await getTs(time);

      let keyValues = await store.getPrefix(
        `${typeManager.getTypeId(type)}/${key}`
      );

      // if it is a redirect, go look it up
      if (redirectKey.validate(keyValues.map(([key]) => key)[0])) {
        const [redirectTypeId, redirectKey] = JSON.parse(keyValues[0][1]).split(
          "/"
        );
        keyValues = await store.getPrefix(`${redirectTypeId}/${redirectKey}`);
      }

      return decode(
        // sort by timestamp
        sortBy(keyValues, ([key]) => last(key.split("/"))).filter(
          ([key]) => Number(last(key.split("/"))) <= ts
        )
      );
    },
    readAll: async ({
      type,
      time
    }: {
      type: t.Type<object>;
      time?: number;
    }) => {
      const ts = await getTs(time);

      const keyValues = store.getPrefix(`${typeManager.getTypeId(type)}`);

      // materialize objects that have redirects (i.e. this type is their secondary type)
      const keyValuesWithRedirects = await Bluebird.Promise.reduce(
        keyValues,
        async (kvs, [key, value]) => {
          if (redirectKey.validate(key)) {
            const [redirectTypeId, redirectKey] = JSON.parse(value).split("/");
            return kvs.concat(
              await store.getPrefix(`${redirectTypeId}/${redirectKey}`)
            );
          }

          return kvs.concat([[key, value]]);
        },
        [] as [string, string][]
      );

      return (
        _.chain(keyValuesWithRedirects)
          // filter out key/values that are greater than the timestamp
          .filter(([key]) => Number(last(key.split("/"))) <= ts)
          .groupBy(([key]) => key.split("/")[1])
          .values()
          .map(kvs =>
            decode(
              // sort by timestamp
              sortBy(kvs, ([key]) => last(key.split("/")))
            )
          )
          .value()
      );
    },
    addType: async (type: t.Type<object>) =>
      createOperations(store, types.concat([type]), ts)
  };
};
