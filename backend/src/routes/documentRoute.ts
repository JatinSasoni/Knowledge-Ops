import { Router } from "express";
import { CreateDocumentSchema, ListDocumentQuery, UploadUrlSchema } from "../schemas/document.js";
import { validateQuery, validate } from "../middleware/validate.js";
import {
  createDocument,
  deleteDocument,
  getDocument,
  listDocuments,
  processDocument,
  requestUpload,
} from "../controllers/documentController.js";
const documentRouter = Router({ mergeParams: true });

documentRouter.post("/", validate(CreateDocumentSchema), createDocument);
documentRouter.get("/", validateQuery(ListDocumentQuery), listDocuments);
documentRouter.get("/:docId", getDocument);
documentRouter.delete("/:docId", deleteDocument);
documentRouter.post("/upload-url", validate(UploadUrlSchema), requestUpload);
documentRouter.post("/:docId/process", processDocument);

export default documentRouter;
