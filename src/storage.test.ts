import { createSimpleStorage } from "./storage";

const store = createSimpleStorage();

test("put and get", async () => {
  await store.put("test", "123");
  expect(await store.get("test")).toBe("123");
});

test("delete", async () => {
  await store.put("test", "123");
  await store.delete("test");
  expect(await store.get("test")).toBe(undefined);
});

test("prefix", async () => {
  await store.put("abc/1", "1");
  await store.put("abc/2", "2");
  await store.put("abc/3", "3");

  await store.put("xyz/1", "1");

  expect((await store.getPrefix("abc")).length).toBe(3);
});
