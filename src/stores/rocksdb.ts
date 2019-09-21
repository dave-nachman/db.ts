import rocksdb from "rocksdb";

import { createLevelUpStore } from "./levelup";

export const createRocksDbStore = (location: string) =>
  createLevelUpStore(rocksdb(location));
