import { encode, decode } from "./codec";

test("encode", () => {
  const data = {
    id: "1",
    type: "person",
    name: "David",
    properties: {
      nickname: "Dave",
      age: 32
    }
  };

  expect(encode(data, 0)).toEqual([
    ["person/1/id/0", '"1"'],
    ["person/1/type/0", '"person"'],
    ["person/1/name/0", '"David"'],
    ["person/1/properties/nickname/0", '"Dave"'],
    ["person/1/properties/age/0", "32"]
  ]);
});

test("decode", () => {
  const data = {
    id: "1",
    type: "person",
    name: "David",
    properties: {
      nickname: "Dave",
      age: 32
    }
  };

  expect(decode([
    ["person/1/id/0", '"1"'],
    ["person/1/type/0", '"person"'],
    ["person/1/name/0", '"David"'],
    ["person/1/properties/nickname/0", '"Dave"'],
    ["person/1/properties/age/0", "32"]
  ])).toEqual(data);
});
