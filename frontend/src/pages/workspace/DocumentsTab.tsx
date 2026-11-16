import { useState } from "react";
import { Button, ConfirmButton, FormError, Panel } from "../../components/ui";
import { useDeleteDocument, useDocuments, useRetryDocument } from "../../features/documents/hooks";
import { formatBytes, formatDate, plural } from "../../lib/format";
import { useDebounced } from "../../lib/useDebounced";
import type { DocumentStatus } from "../../types";
import { useWorkspaceContext } from "./context";
import { UploadPanel } from "./UploadPanel";

const STATUS = {
  UPLOADED: { label: "Uploaded", style: "bg-sand text-ink" },
  PROCESSING: { label: "Processing", style: "bg-marker/50 text-ink animate-pulse" },
  READY: { label: "Ready", style: "bg-pine/12 text-pine" },
  FAILED: { label: "Failed", style: "bg-danger/10 text-danger" },
} satisfies Record<DocumentStatus, { label: string; style: string }>;

function fileLabel(mimeType: string | null) {
  if (mimeType === "application/pdf") return "PDF";
  if (mimeType === "text/markdown") return "MD";
  if (mimeType === "text/plain") return "TXT";
  return "DOC";
}

export function DocumentsTab() {
  const { workspace } = useWorkspaceContext();

  const [page, setPage] = useState(1);
  const [searchText, setSearchText] = useState("");
  // Wait until typing pauses for 300ms before searching, instead of one request per key.
  const search = useDebounced(searchText.trim(), 300);

  const documents = useDocuments(workspace.id, page, search);
  const deleteDocument = useDeleteDocument(workspace.id);
  const retryDocument = useRetryDocument(workspace.id);

  function onSearchChange(value: string) {
    setSearchText(value);
    setPage(1); // a new search starts from the first page
  }

  function onDelete(documentId: string) {
    const isLastOnPage = documents.data?.items.length === 1;
    deleteDocument.mutate(documentId, {
      // Deleting the only document on a page would leave it empty: go back one page.
      onSuccess: () => {
        if (isLastOnPage && page > 1) setPage(page - 1);
      },
    });
  }

  const data = documents.data;
  const items = data?.items ?? [];
  const totalPages = data?.totalPages ?? 1;

  return (
    <div className="grid gap-8 lg:grid-cols-12 lg:gap-x-10">
      <div className="flex flex-col gap-4 lg:col-span-8">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <label className="block w-full sm:max-w-sm">
            <span className="sr-only">Search documents by title</span>
            <input
              type="search"
              value={searchText}
              onChange={(e) => onSearchChange(e.target.value)}
              placeholder="Search by title"
              maxLength={100}
              className="w-full rounded-md border border-line bg-surface px-3 py-2.5 outline-none focus:border-pine"
            />
          </label>
          <span className="text-sm text-muted" aria-live="polite">
            {data ? plural(data.total, "document") : ""}
          </span>
        </div>

        {documents.isPending && <p className="text-muted">Loading documents…</p>}

        {documents.isError && (
          <FormError message={`Couldn't load documents: ${documents.error.message}`} />
        )}

        {data && items.length === 0 && (
          <Panel className="px-6 py-8">
            <p className="font-display text-[20px] font-bold">
              {search ? `Nothing matches “${search}”` : "No documents yet"}
            </p>
            <p className="mt-1 text-muted">
              {search
                ? "Try a shorter or different word."
                : "Add the first one with the panel on the right."}
            </p>
          </Panel>
        )}

        {items.length > 0 && (
          // Slightly faded while the next page or search result is loading
          <Panel className={`overflow-hidden ${documents.isPlaceholderData ? "opacity-60" : ""}`}>
            <ul>
              {items.map((document, index) => (
                <li
                  key={document.id}
                  className={`flex items-center gap-4 px-5 py-3.5 ${index > 0 ? "border-t border-line" : ""}`}
                >
                  <span className="grid h-10 w-9 shrink-0 place-items-center rounded-sm bg-paper text-[10px] font-bold text-muted">
                    {fileLabel(document.mimeType)}
                  </span>
                  <span className="flex min-w-0 flex-col">
                    <span className="truncate font-semibold">{document.title}</span>
                    <span className="text-sm text-muted">
                      Added {formatDate(document.createdAt)}
                      {document.size !== null && ` · ${formatBytes(document.size)}`}
                    </span>
                    {document.status === "FAILED" && document.error && (
                      <span className="text-sm text-danger">{document.error}</span>
                    )}
                  </span>
                  <span
                    className={`ml-auto shrink-0 rounded px-2 py-0.5 text-xs font-semibold ${STATUS[document.status].style}`}
                  >
                    {STATUS[document.status].label}
                  </span>
                  {document.status === "FAILED" && (
                    <button
                      type="button"
                      onClick={() => retryDocument.mutate(document.id)}
                      disabled={retryDocument.isPending}
                      className="rounded-md px-3 py-1.5 text-sm font-semibold text-pine transition-colors hover:bg-pine/10 disabled:opacity-50"
                    >
                      Retry
                    </button>
                  )}
                  <span>
                    <ConfirmButton
                      label="Delete"
                      confirmLabel="Delete for everyone?"
                      onConfirm={() => onDelete(document.id)}
                      disabled={deleteDocument.isPending}
                    />
                  </span>
                </li>
              ))}
            </ul>
          </Panel>
        )}

        {retryDocument.isError && (
          <FormError message={`Couldn't retry: ${retryDocument.error.message}`} />
        )}

        {deleteDocument.isError && (
          <FormError message={`Couldn't delete: ${deleteDocument.error.message}`} />
        )}

        {totalPages > 1 && (
          <nav aria-label="Pages" className="flex items-center justify-between gap-3">
            <Button variant="quiet" onClick={() => setPage(page - 1)} disabled={page <= 1}>
              Previous
            </Button>
            <span className="text-sm text-muted">
              Page {page} of {totalPages}
            </span>
            <Button variant="quiet" onClick={() => setPage(page + 1)} disabled={page >= totalPages}>
              Next
            </Button>
          </nav>
        )}
      </div>

      <aside className="lg:col-span-4">
        <UploadPanel workspaceId={workspace.id} />
      </aside>
    </div>
  );
}
