import { useRef, useState, type ChangeEvent, type DragEvent } from "react";
import { FormError, Panel } from "../../components/ui";
import { useUploadDocument } from "../../features/documents/hooks";
import { ApiError } from "../../lib/api";
import { formatBytes } from "../../lib/format";

const MAX_BYTES = 20 * 1024 * 1024; // must match the backend's limit

// Browsers often report no type at all for .md files, so we decide by extension.
const TYPE_BY_EXTENSION: Record<string, string> = {
  pdf: "application/pdf",
  md: "text/markdown",
  markdown: "text/markdown",
  txt: "text/plain",
};

function mimeTypeFor(fileName: string): string | undefined {
  const extension = fileName.split(".").pop()?.toLowerCase() ?? "";
  return TYPE_BY_EXTENSION[extension];
}

function uploadErrorMessage(error: unknown): string {
  if (error instanceof ApiError) return error.message;
  // Not our API: the upload to storage itself failed (expired link, storage down...)
  return "The upload didn't go through. Check your connection and try again.";
}

export function UploadPanel({ workspaceId }: { workspaceId: string }) {
  const upload = useUploadDocument(workspaceId);
  const inputRef = useRef<HTMLInputElement>(null);

  const [step, setStep] = useState("");
  const [progress, setProgress] = useState(0);
  const [validationError, setValidationError] = useState("");
  const [lastUploaded, setLastUploaded] = useState("");
  const [dragging, setDragging] = useState(false);

  function startUpload(file: File) {
    setValidationError("");
    setLastUploaded("");
    upload.reset();

    // Check before uploading, so the person isn't kept waiting for a file that will be refused.
    const mimeType = mimeTypeFor(file.name);
    if (!mimeType) {
      setValidationError("Only PDF, Markdown (.md) and text (.txt) files can be added.");
      return;
    }
    if (file.size > MAX_BYTES) {
      setValidationError(`That file is ${formatBytes(file.size)}. The limit is 20 MB.`);
      return;
    }
    if (file.size === 0) {
      setValidationError("That file is empty.");
      return;
    }

    setProgress(0);
    upload.mutate(
      { file, mimeType, onStep: setStep, onProgress: setProgress },
      {
        onSuccess: () => setLastUploaded(file.name),
        onSettled: () => setStep(""),
      },
    );
  }

  function onFileChosen(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (file) startUpload(file);
    event.target.value = ""; // so choosing the same file again still triggers a change
  }

  function onDrop(event: DragEvent) {
    event.preventDefault();
    setDragging(false);
    const file = event.dataTransfer.files[0];
    if (file && !upload.isPending) startUpload(file);
  }

  return (
    <Panel className="bg-sand p-6">
      <h2 className="font-display text-[22px] font-bold">Add a document</h2>
      <p className="mt-1 text-[15px] text-ink/75">PDF, Markdown or text, up to 20 MB.</p>

      <label
        onDragOver={(e) => {
          e.preventDefault();
          setDragging(true);
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={onDrop}
        className={`mt-4 flex cursor-pointer flex-col items-center gap-1 rounded-md border-2 border-dashed px-4 py-7 text-center transition-colors ${
          dragging ? "border-pine bg-surface" : "border-line bg-surface/60 hover:border-pine"
        } ${upload.isPending ? "pointer-events-none opacity-60" : ""}`}
      >
        <span className="font-semibold">Choose a file</span>
        <span className="text-sm text-muted">or drop it here</span>
        <input
          ref={inputRef}
          type="file"
          accept=".pdf,.md,.markdown,.txt"
          onChange={onFileChosen}
          disabled={upload.isPending}
          className="sr-only"
        />
      </label>

      {upload.isPending && (
        <div className="mt-4" aria-live="polite">
          <div className="flex justify-between text-sm">
            <span>{step}</span>
            {step === "Uploading…" && <span className="tabular-nums">{progress}%</span>}
          </div>
          <div className="mt-1.5 h-2 overflow-hidden rounded bg-surface">
            <div
              className="h-full rounded bg-pine transition-[width] duration-200"
              style={{ width: `${step === "Uploading…" ? progress : step ? 100 : 0}%` }}
            />
          </div>
        </div>
      )}

      {lastUploaded && !upload.isPending && (
        <p className="mt-4 text-sm text-pine" role="status">
          Added {lastUploaded}. It'll be read in the background.
        </p>
      )}

      <div className="mt-4">
        <FormError
          message={validationError || (upload.isError ? uploadErrorMessage(upload.error) : "")}
        />
      </div>
    </Panel>
  );
}
