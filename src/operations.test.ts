import * as t from "io-ts";

import { createSimpleStorage } from "./storage";
import { createOperations } from "./operations";

const Person = t.interface({
  id: t.string,
  name: t.string,
  properties: t.interface({
    age: t.number
  })
});

const PersonWithNickname = t.interface({
  id: t.string,
  name: t.string,
  properties: t.interface({
    nickname: t.string,
    age: t.number
  })
});

test("read and write with primary type", async () => {
  const store = createSimpleStorage();
  const operations = createOperations(store, [Person, PersonWithNickname]);

  const data = {
    id: "1",
    name: "David",
    properties: {
      nickname: "Dave",
      age: 32
    }
  };

  await operations.write({ data });

  const { id } = data;

  expect(await operations.read({ type: PersonWithNickname, key: id })).toEqual(
    data
  );
});

test("read and write with primary type, after adding type", async () => {
  const store = createSimpleStorage();
  let operations = createOperations(store, []);

  operations = await operations.addType(Person);
  operations = await operations.addType(PersonWithNickname);

  const data = {
    id: "1",
    name: "David",
    properties: {
      nickname: "Dave",
      age: 32
    }
  };

  await operations.write({ data });

  const { id } = data;

  expect(await operations.read({ type: PersonWithNickname, key: id })).toEqual(
    data
  );
});

test("read and write with secondary type", async () => {
  const store = createSimpleStorage();
  const operations = createOperations(store, [Person, PersonWithNickname]);

  const data = {
    id: "1",
    name: "David",
    properties: {
      nickname: "Dave",
      age: 32
    }
  };

  await operations.write({ data });

  const { id } = data;

  // PersonWithNickname is the primary type; we should still be able to read using person
  expect(await operations.read({ type: Person, key: id })).toEqual(data);
});

test("read all", async () => {
  const store = createSimpleStorage();
  const operations = createOperations(store, [Person, PersonWithNickname]);

  const data1 = {
    id: "1",
    name: "David",
    properties: {
      nickname: "Dave",
      age: 32
    }
  };

  await operations.write({ data: data1 });

  const data2 = {
    id: "2",
    name: "Steve",
    properties: {
      age: 32
    }
  };

  await operations.write({ data: data2 });

  expect((await operations.readAll({ type: Person })).length).toEqual(2);
  expect(
    (await operations.readAll({ type: PersonWithNickname })).length
  ).toEqual(1);
});

const sleep = (ms: number): Promise<void> => {
  return new Promise(resolve => setTimeout(() => resolve(), ms));
};

test("read all with multi-version", async () => {
  const store = createSimpleStorage();
  const operations = createOperations(store, [Person, PersonWithNickname]);

  const data1 = {
    id: "1",
    name: "David",
    properties: {
      nickname: "Dave",
      age: 32
    }
  };

  await operations.write({ data: data1 });

  const op1time = Date.now();

  await sleep(2000);

  const data2 = {
    id: "2",
    name: "Steve",
    properties: {
      age: 32
    }
  };

  await operations.write({ data: data2 });

  expect((await operations.readAll({ type: Person })).length).toEqual(2);
  expect(
    (await operations.readAll({ type: Person, time: op1time })).length
  ).toEqual(1);
});
