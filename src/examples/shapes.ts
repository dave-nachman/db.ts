import * as t from "io-ts";

import { getEntityManager } from "../entity-manager";
import { createRocksDbStore } from "../stores/rocksdb";
import { createOperations } from "../operations";

const RectT = t.interface({
  id: t.number,
  x: t.number,
  y: t.number,
  width: t.number,
  height: t.number
});

const CircleT = t.interface({
  id: t.number,
  radius: t.number,
  cx: t.number,
  cy: t.number,
  width: t.number,
  height: t.number
});

const WidthHeightT = t.interface({
  width: t.number,
  height: t.number
});

const ShapeT = t.union([RectT, CircleT]);

// derive normal Typescript type
type Shape = t.TypeOf<typeof ShapeT>;

const store = createRocksDbStore("test-db");

const typeDefinitions = [RectT, CircleT, WidthHeightT, ShapeT];
const ops = createOperations(store, typeDefinitions);
const entityManager = getEntityManager(ops);

const instances: Shape[] = [
  { id: 0, width: 20, height: 20, x: 10, y: 10 },
  { id: 1, width: 20, height: 20, radius: 5, cx: 10, cy: 10 }
];

(async () => {
  await entityManager.save(instances);

  console.log("Shapes", (await entityManager.find(ShapeT)).length);
  console.log("Circles", (await entityManager.find(CircleT)).length);
  console.log("Rects", (await entityManager.find(RectT)).length);
  console.log("WidthHeight", (await entityManager.find(WidthHeightT)).length);
})();
