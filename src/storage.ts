/*
Interface for pluggable storage engines

If an operation fails, an error should be thrown
*/
export interface StorageEngine {
  // if key is missing, return undefined
  get(key: string): Promise<string | undefined>;

  // get keys by a prefix
  getPrefix(key: string): Promise<KeyValue[]>;

  put(key: string, value: string): Promise<void>;
  delete(key: string): Promise<void>;
}

export type KeyValue = [string, string];

/*
This implementation is naive and inefficient (scanning all key/value pairs for "getPrefix" e.g.)
It is just a placeholder simple implementation
*/
export const createSimpleStorage = (): StorageEngine => {
  let db: { [key: string]: string } = {};

  return {
    get: async (key: string) => db[key],
    getPrefix: async (key: string) =>
      Object.entries(db).filter(([k]) => k.startsWith(key)),
    put: async (key: string, value: string) => {
      db[key] = value;
    },
    delete: async (key: string) => {
      delete db[key];
    }
  };
};
