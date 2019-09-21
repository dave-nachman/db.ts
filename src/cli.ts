import program from "commander";
import repl from "repl";

import { createClient } from "./client";
import { createOperations } from "./operations";
import { createServer } from "./server";
import { createSimpleStorage } from "./storage";

program.command("server").action(() => {
  // this will need to be configurable
  const store = createSimpleStorage();
  const operations = createOperations(store, []);

  createServer(operations);
});

program.command("client").action(async () => {
  const client = await createClient();

  repl.start({
    prompt: "db.ts> ",
    eval: async (input: string, context, file, callback) => {
      const [cmd, ...restArray] = input.split(" ");
      const rest = restArray.join(" ");

      switch (cmd.toLowerCase().trim()) {
        case "write": {
          const result = await client.write(JSON.parse(rest.trim()));
          return callback(null, result);
        }
        case "read": {
          const result = await client.read(JSON.parse(rest.trim()));
          return callback(null, result);
        }
        case "read-all": {
          const result = await client.readAll(JSON.parse(rest.trim()));
          return callback(null, result);
        }
        // TODO: finish implementation
        case "add-interface": {
          const result = await client.addType(JSON.parse(rest.trim()));
          return callback(null, result);
        }
        default: {
          callback(new Error("Unknown command"), null);
        }
      }
    }
  });
});

program.parse(process.argv);
