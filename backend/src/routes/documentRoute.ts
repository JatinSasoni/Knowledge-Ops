import { Router } from "express";
import { CreateDocumentSchema, ListDocumentQuery } from "../schemas/document.js";
import { validateQuery, validate } from "../middleware/validate.js";
import {
  createDocument,
  deleteDocument,
  getDocument,
  listDocuments,
} from "../controllers/documentController.js";
const documentRouter = Router({ mergeParams: true });

documentRouter.post("/", validate(CreateDocumentSchema), createDocument);
documentRouter.get("/", validateQuery(ListDocumentQuery), listDocuments);
documentRouter.get("/:docId", getDocument);
documentRouter.delete("/:docId", deleteDocument);

export default documentRouter;
