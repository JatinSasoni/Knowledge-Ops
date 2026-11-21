import { http } from "../../lib/api";
import type { WidgetKey } from "../../types";

const base = (workspaceId: string) => `/workspaces/${workspaceId}/widget-keys`;

export async function getWidgetKeys(workspaceId: string): Promise<WidgetKey[]> {
  const response = await http.get<{ widgetKeys: WidgetKey[] }>(base(workspaceId));
  return response.data.widgetKeys;
}

export async function createWidgetKey(
  workspaceId: string,
  input: { name: string; allowedOrigins: string[] },
): Promise<WidgetKey> {
  const response = await http.post<{ widgetKey: WidgetKey }>(base(workspaceId), input);
  return response.data.widgetKey;
}

export async function updateWidgetKey(
  workspaceId: string,
  keyId: string,
  changes: { name?: string; allowedOrigins?: string[] },
): Promise<WidgetKey> {
  const response = await http.patch<{ widgetKey: WidgetKey }>(
    `${base(workspaceId)}/${keyId}`,
    changes,
  );
  return response.data.widgetKey;
}

export async function revokeWidgetKey(workspaceId: string, keyId: string): Promise<void> {
  await http.delete(`${base(workspaceId)}/${keyId}`);
}

// The line a customer pastes into their website. The script lives on this same server,
// so its address is wherever this app is running (localhost in dev, the real domain live).
export function embedSnippet(key: string) {
  return `<script src="${window.location.origin}/widget.js" data-key="${key}" async></script>`;
}
