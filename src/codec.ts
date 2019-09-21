import set from "lodash/set";

export interface EncodeOptions {
  primaryKey?: string;
  type?: string;
}

const makeKey = (type: string, id: string, path: string[], ts: number) =>
  `${type}/${id}/${path.join("/")}/${ts}`;

class NoPrimaryKey extends Error {}

// encode an object into an array of key/value pairs
export const encode = (data: object, ts: number, options?: EncodeOptions) => {
  const primaryKey =
    // try a bunch of possibilities for the primary key
    (options || {}).primaryKey ||
    "id" ||
    "_id" ||
    `${data["type"]}Id` ||
    `${data["kind"]}Id` ||
    "name";

  if (!primaryKey) {
    throw new NoPrimaryKey(
      `No primary key was identified for ${JSON.stringify(data, null, 2)}`
    );
  }

  const type = (options || {}).type || data["type"] || "any";

  const keyValues: [string, string][] = [];

  const encodeOne = (x: any, path: string[]) => {
    if (Array.isArray(x)) {
      x.forEach((y, index) => encodeOne(y, path.concat([String(index)])));
    } else if (typeof x === "object" && x !== null) {
      Object.entries(x).forEach(([k, v]) => encodeOne(v, path.concat([k])));
    } else {
      keyValues.push([
        makeKey(type, data[primaryKey], path, ts),
        JSON.stringify(x)
      ]);
    }
  };

  encodeOne(data, []);
  return keyValues;
};

// decode key/value pairs into an object
export const decode = (keyValues: [string, string][]) =>
  keyValues.reduce((result, [key, value]) => {
    const path = key.split("/").slice(2, key.split("/").length - 1);
    return set(result, path, JSON.parse(value));
  }, {});
