import type { Prisma } from "../generated/prisma/client.js";
import { prisma } from "../lib/prisma.js";
import {
  docParams,
  type CreateDocumentsInput,
  type ListDocumentsQueryInput,
} from "../schemas/document.js";
import { AppError } from "../util/AppError.js";
import { asyncHandler } from "../util/asyncHandler.js";

export const listDocuments = asyncHandler(async (req, res) => {
  const { page, limit, search } = res.locals.query as ListDocumentsQueryInput;
  const workspaceId = req.membership!.workspaceId;

  const where: Prisma.DocumentWhereInput = {
    workspaceId,
    ...(search && { title: { contains: search, mode: "insensitive" } }),
  };

  const [items, total] = await prisma.$transaction([
    prisma.document.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * limit,
      take: limit,
    }),
    prisma.document.count({ where }),
  ]);

  res.json({ items, page, limit, total, totalPages: Math.ceil(total / limit) });
});

// POST /api/v1/workspaces/:workspaceId/documents
export const createDocument = asyncHandler(async (req, res) => {
  const { title } = req.body as CreateDocumentsInput;

  const document = await prisma.document.create({
    data: { title, workspaceId: req.membership!.workspaceId },
  });

  res.status(201).json({ document });
});

// GET /api/v1/workspaces/:workspaceId/documents/:docId
export const getDocument = asyncHandler(async (req, res) => {
  const { workspaceId, docId } = docParams.parse(req.params);

  const document = await prisma.document.findFirst({
    where: { id: docId, workspaceId },
  });
  if (!document) throw AppError.notFound("Document not found");

  res.json({ document });
});

// DELETE /api/v1/workspaces/:workspaceId/documents/:docId
export const deleteDocument = asyncHandler(async (req, res) => {
  const { workspaceId, docId } = docParams.parse(req.params);

  const { count } = await prisma.document.deleteMany({
    where: { id: docId, workspaceId },
  });
  if (count === 0) throw AppError.notFound("Document not found");

  res.status(204).end();
});
