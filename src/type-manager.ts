import crypto from "crypto";
import fromPairs from "lodash/fromPairs";
import sortBy from "lodash/sortBy";

import * as t from "io-ts";

export const createTypeManager = (types: t.Type<object>[]) => {
  const typesToHashs = fromPairs(
    types.map(type => [
      type.name,
      crypto
        .createHash("sha256")
        .update(type.name)
        .digest("hex")
        .slice(0, 8)
    ])
  );

  const typesToComplexityScore = fromPairs(
    types.map(type => [
      type.name,
      // this is a heuristic for how complex/rich a type is
      JSON.stringify(type.name).length
    ])
  );

  const getTypeIds = (data: object) =>
    sortBy(
      types
        // filter out types that aren't valid for the data
        .filter(type => type.validate(data, [])._tag === "Right"),
      // sort by most complex
      type => -typesToComplexityScore[type.name]
    ).map(type => typesToHashs[type.name]);

  return {
    getTypeIds,
    getTypeId: (type: t.Type<object>) => typesToHashs[type.name]
  };
};
