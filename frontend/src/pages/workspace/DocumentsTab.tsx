import { useState, type FormEvent } from "react";
import { Button, ConfirmButton, FormError, Panel } from "../../components/ui";
import { useCreateDocument, useDeleteDocument, useDocuments } from "../../features/documents/hooks";
import { fieldError } from "../../lib/api";
import { formatDate, plural } from "../../lib/format";
import { useDebounced } from "../../lib/useDebounced";
import { useWorkspaceContext } from "./context";

export function DocumentsTab() {
  const { workspace } = useWorkspaceContext();

  const [page, setPage] = useState(1);
  const [searchText, setSearchText] = useState("");
  // Wait until typing pauses for 300ms before searching, instead of one request per key.
  const search = useDebounced(searchText.trim(), 300);

  const documents = useDocuments(workspace.id, page, search);
  const createDocument = useCreateDocument(workspace.id);
  const deleteDocument = useDeleteDocument(workspace.id);
  const [title, setTitle] = useState("");

  function onSearchChange(value: string) {
    setSearchText(value);
    setPage(1); // a new search starts from the first page
  }

  function onAddDocument(e: FormEvent) {
    e.preventDefault();
    createDocument.mutate(title.trim(), {
      onSuccess: () => setTitle(""),
    });
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
                : "Add the first one with the form on the right."}
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
                  <span className="grid h-10 w-8 shrink-0 place-items-center rounded-sm bg-paper text-[10px] font-bold text-muted">
                    DOC
                  </span>
                  <span className="flex min-w-0 flex-col">
                    <span className="truncate font-semibold">{document.title}</span>
                    <span className="text-sm text-muted">
                      Added {formatDate(document.createdAt)}
                    </span>
                  </span>
                  <span className="ml-auto">
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
        <Panel className="bg-sand p-6">
          <h2 className="font-display text-[22px] font-bold">Add a document</h2>
          <p className="mt-1 text-[15px] text-ink/75">
            For now a document is its title. Uploading files and asking questions come next.
          </p>
          <form onSubmit={onAddDocument} className="mt-4 flex flex-col gap-3" noValidate>
            <label htmlFor="doc-title" className="text-sm font-medium">
              Title
            </label>
            <input
              id="doc-title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Refund policy"
              maxLength={200}
              className="rounded-md border border-line bg-surface px-3 py-2.5 outline-none focus:border-pine"
            />
            {createDocument.isError && (
              <FormError
                message={fieldError(createDocument.error, "title") ?? createDocument.error.message}
              />
            )}
            <Button type="submit" disabled={createDocument.isPending || !title.trim()}>
              {createDocument.isPending ? "Adding…" : "Add document"}
            </Button>
          </form>
        </Panel>
      </aside>
    </div>
  );
}
