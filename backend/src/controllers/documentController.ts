import { randomUUID } from "node:crypto";
import type { Prisma } from "../generated/prisma/client.js";
import { prisma } from "../lib/prisma.js";
import {
  docParams,
  type CreateDocumentsInput,
  type ListDocumentsQueryInput,
  type UploadUrlInput,
} from "../schemas/document.js";
import { AppError } from "../util/AppError.js";
import { asyncHandler } from "../util/asyncHandler.js";
import { createUploadUrl, deleteFile, fileExists } from "../lib/storage.js";

const EXTENSION = {
  "application/pdf": ".pdf",
  "text/markdown": ".md",
  "text/plain": ".txt",
} as const;

export const requestUpload = asyncHandler(async (req, res) => {
  const { fileName, mimeType, size } = req.body as UploadUrlInput;
  const workspaceId = req.membership!.workspaceId;
  const id = randomUUID();
  const fileKey = `${workspaceId}/${id}${EXTENSION[mimeType]}`;

  const document = await prisma.document.create({
    data: { id, title: fileName, fileKey, mimeType, size, workspaceId },
  });
  const uploadUrl = await createUploadUrl(fileKey, mimeType, size);

  return res.status(201).json({ document, uploadUrl });
});

export const processDocument = asyncHandler(async (req, res) => {
  const { workspaceId, docId } = docParams.parse(req.params);
  const document = await prisma.document.findFirst({ where: { id: docId, workspaceId } });
  if (!document) throw AppError.notFound("Document not found");
  if (!document.fileKey) throw AppError.badRequest("This document has no file");
  if (!(await fileExists(document.fileKey))) {
    throw AppError.conflict("The file hasn't finished uploading");
  }
  res.status(202).json({ document });
});

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

  const document = await prisma.document.findFirst({ where: { id: docId, workspaceId } });
  if (!document) throw AppError.notFound("Document not found");

  await prisma.document.delete({ where: { id: document.id } });
  if (document.fileKey) await deleteFile(document.fileKey).catch(() => {});

  res.status(204).end();
});
