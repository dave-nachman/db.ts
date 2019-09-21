import * as t from "io-ts";

import { createSimpleStorage } from "./storage";
import { createOperations } from "./operations";

import { createServer } from "./server";
import { createClient } from "./client";

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



test("test client & server", async () => {
  const store = createSimpleStorage();
  let operations = createOperations(store, []);

  // TODO: add types via client, when that functionality is ready
  operations = await operations.addType(Person);
  operations = await operations.addType(PersonWithNickname);

  await createServer(operations);

  const client = await createClient();

  const data = {
    id: "1",
    name: "David",
    properties: {
      nickname: "Dave",
      age: 32
    }
  };

  await client.write({ data });

  const { id } = data;

  // PersonWithNickname is the primary type; we should still be able to read using person
  expect(await client.read({ type: Person, key: id })).toEqual(data);
});
