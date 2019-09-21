import * as t from "io-ts";

import { createSimpleStorage } from "./storage";
import { getEntityManager } from "./entity-manager";
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
  const client = createOperations(store, [Person, PersonWithNickname]);
  const entityManager = getEntityManager(client);

  const data = {
    id: "1",
    name: "David",
    properties: {
      nickname: "Dave",
      age: 32
    }
  };

  await entityManager.save(data);

  expect((await entityManager.find(PersonWithNickname))[0]).toEqual(data);
});

test("read and write with secondary type", async () => {
  const store = createSimpleStorage();
  const client = createOperations(store, [Person, PersonWithNickname]);
  const entityManager = getEntityManager(client);

  const data = {
    id: "1",
    name: "David",
    properties: {
      nickname: "Dave",
      age: 32
    }
  };

  await entityManager.save(data);

  // PersonWithNickname is the primary type; we should still be able to read using person
  expect((await entityManager.find(Person))[0]).toEqual(data);
});

test("read all", async () => {
  const store = createSimpleStorage();
  const client = createOperations(store, [Person, PersonWithNickname]);
  const entityManager = getEntityManager(client);

  const data1 = {
    id: "1",
    name: "David",
    properties: {
      nickname: "Dave",
      age: 32
    }
  };

  const data2 = {
    id: "2",
    name: "Steve",
    properties: {
      age: 32
    }
  };

  await entityManager.save([data1, data2]);

  expect((await entityManager.find(Person)).length).toEqual(2);
  expect((await entityManager.find(PersonWithNickname)).length).toEqual(1);
});

const sleep = (ms: number): Promise<void> => {
  return new Promise(resolve => setTimeout(() => resolve(), ms));
};

test("read all with multi-version", async () => {
  const store = createSimpleStorage();
  const client = createOperations(store, [Person, PersonWithNickname]);
  const entityManager = getEntityManager(client);

  const data1 = {
    id: "1",
    name: "David",
    properties: {
      nickname: "Dave",
      age: 32
    }
  };

  await entityManager.save(data1);

  const op1time = Date.now();

  await sleep(2000);

  const data2 = {
    id: "2",
    name: "Steve",
    properties: {
      age: 32
    }
  };

  await entityManager.save(data2);

  expect((await entityManager.find(Person)).length).toEqual(2);
  expect((await entityManager.useTime(op1time).find(Person)).length).toEqual(1);
});
