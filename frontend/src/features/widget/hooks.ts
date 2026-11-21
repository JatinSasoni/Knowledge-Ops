import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import * as widgetApi from "./api";

const widgetKeysKey = (workspaceId: string) => ["workspace", workspaceId, "widget-keys"];

export function useWidgetKeys(workspaceId: string, enabled: boolean) {
  return useQuery({
    queryKey: widgetKeysKey(workspaceId),
    queryFn: () => widgetApi.getWidgetKeys(workspaceId),
    enabled, // only for public workspaces; private ones have no widget
  });
}

// Create, edit and revoke all refresh the same list afterwards.
function useWidgetKeyMutation<T>(workspaceId: string, run: (input: T) => Promise<unknown>) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: run,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: widgetKeysKey(workspaceId) }),
  });
}

export const useCreateWidgetKey = (workspaceId: string) =>
  useWidgetKeyMutation(workspaceId, (input: { name: string; allowedOrigins: string[] }) =>
    widgetApi.createWidgetKey(workspaceId, input),
  );

export const useUpdateWidgetKey = (workspaceId: string) =>
  useWidgetKeyMutation(workspaceId, (input: { keyId: string; allowedOrigins: string[] }) =>
    widgetApi.updateWidgetKey(workspaceId, input.keyId, { allowedOrigins: input.allowedOrigins }),
  );

export const useRevokeWidgetKey = (workspaceId: string) =>
  useWidgetKeyMutation(workspaceId, (keyId: string) =>
    widgetApi.revokeWidgetKey(workspaceId, keyId),
  );
