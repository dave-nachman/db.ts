# db.ts

This is a pre-alpha work-in-progress prototype of an _object database_ that utilizes Typescript's type system. Unlike a relational database, which is table-oriented, an object database represents data in an object-oriented manner.

db.ts supports Typescript interfaces, types, and classes, including subtype relationships. db.ts leverages [io-ts](https://github.com/gcanti/io-ts), a run-time type system library for Typescript, for run-time representations of Typescrpt types. 

As an example, let's say that you have an BaseAnimal interface, which is subtyped by a Dog and Cat interface, which together compose a union type of CommonAnimal. Using db.ts, you can query instances using any of those four types.

## Motivation

Object databases have never caught on in the mainstream. One reason they didn't catch on was that object databases were often coupled to a particular type system, e.g. a type system of a particular programming language or a custom type system.

The ubiquity of JSON and use of Javascript on the web along with the rising popularity of Typescript might represent a new opportunity for a Typescript-based object database. In addition, the rise of key/value stores as the underlying storage for many modern databases creates a pathway for creating an object database that fundamentally might not look that different than the implementation of modern relational databases.

## Example

```ts
import * as t from "io-ts";

import { getEntityManager } from "../entity-manager";
import { createRocksDbStore } from "../stores/rocksdb";

// define our types using io-ts
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

// derive normal Typescript type from the io-ts type
type Shape = t.TypeOf<typeof ShapeT>;

// Sample data
const instances: Shape[] = [
  { id: 0, width: 20, height: 20, x: 10, y: 10 },
  { id: 1, width: 20, height: 20, radius: 5, cx: 10, cy: 10 }
];

// Now create store and entity manager
const store = createRocksDbStore("test-db");

const typeDefinitions = [RectT, CircleT, WidthHeightT, ShapeT];
const entityManager = getEntityManager(store, typeDefinitions);

// Save our instances and query the database
(async () => {
  await entityManager.save(instances);

  console.log("Shapes", (await entityManager.find(ShapeT)).length); // 2
  console.log("Circles", (await entityManager.find(CircleT)).length); // 1
  console.log("Rects", (await entityManager.find(RectT)).length); // 1
  console.log("WidthHeight", (await entityManager.find(WidthHeightT)).length); // 2
})();
```

## Implementation

db.ts is currently implemented in Typescript, but in the future the idea is to divide it up into a Rust backend and a Typescript frontend.

It stores its data as key/value pairs, and different key/value storage engines can be plugged in -- right now the default storage engines are RocksDb or an in-memory store. A "levelup" key/value store interface is exposed, so any "abstract-level" storage engine can easily be plugged in.

## Architecture

Layers (currents):
- **Clients**
  - Entity Manager: convenient Typescript API
  - CLI
- **Client/server layer**: Client and server implementations over HTTP using a message protocol 
- **Operations manager**: Exposes type and version aware CRUD operations on top of storage engine
- **Storage engine**: Simple key/value abstraction with default implementations (levelup, RocksDb)

## Status

Focus is currently on getting a core set of features working with the goal of figuring out architecture and API, rather than, e.g., focusing on an efficient implementation. As the thinking solidifies, all or part of the server will likely be rewritten in Rust.

Outstanding features:
- Transactions
- MVCC
- Multi-node
