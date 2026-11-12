import { useMe } from "../features/auth/hooks";

export function WorkspacesPage() {
  const { data: user } = useMe();

  return (
    <div className="flex flex-col gap-2">
      <h1 className="font-display text-3xl font-semibold">Workspaces</h1>
      <p className="text-muted">Signed in as {user?.email}.</p>
    </div>
  );
}
