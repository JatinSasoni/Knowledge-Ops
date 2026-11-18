import { searchPassages } from "../lib/retrieval.js";
import type { SearchInput } from "../schemas/search.js";
import { asyncHandler } from "../util/asyncHandler.js";

export const search = asyncHandler(async (req, res) => {
  const { query, limit } = req.body as SearchInput;
  const results = await searchPassages(req.membership!.workspaceId, query, limit);
  res.json({ query, results });
});
