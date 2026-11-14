import { useState, type FormEvent } from "react";
import { useNavigate } from "react-router";
import { useQueryClient } from "@tanstack/react-query";
import { Button, ConfirmButton, FormError, Panel, RoleBadge } from "../../components/ui";
import { useMe } from "../../features/auth/hooks";
import { keys, useAddMember, useMembers, useRemoveMember } from "../../features/workspaces/hooks";
import { ApiError, fieldError } from "../../lib/api";
import type { Role } from "../../types";
import { useWorkspaceContext } from "./context";

// Turn the backend's status codes into sentences that say what to do next.
function addMemberError(error: unknown) {
  if (!(error instanceof ApiError)) return undefined;
  if (error.status === 404) return "No account uses that email. Ask them to sign up first.";
  if (error.status === 409) return "That person is already a member.";
  return fieldError(error, "email") ?? error.message;
}

export function MembersTab() {
  const { workspace } = useWorkspaceContext();
  const isAdmin = workspace.role === "ADMIN";
  const { data: me } = useMe();
  const members = useMembers(workspace.id);
  const add = useAddMember(workspace.id);
  const remove = useRemoveMember(workspace.id);
  const qc = useQueryClient();
  const navigate = useNavigate();

  const [email, setEmail] = useState("");
  const [role, setRole] = useState<Role>("MEMBER");

  function onAdd(e: FormEvent) {
    e.preventDefault();
    add.mutate({ email: email.trim(), role }, { onSuccess: () => setEmail("") });
  }

  function onRemove(userId: string) {
    remove.mutate(userId, {
      onSuccess: () => {
        const removedMyself = userId === me?.id;
        if (removedMyself) {
          // You left the workspace, so you can't see it any more: go back to your list.
          qc.removeQueries({ queryKey: keys.workspace(workspace.id) });
          qc.invalidateQueries({ queryKey: keys.workspaces });
          navigate("/workspaces", { replace: true });
        }
      },
    });
  }

  const list = members.data ?? [];

  return (
    <div className="grid gap-8 lg:grid-cols-12 lg:gap-x-10">
      <div className="flex flex-col gap-4 lg:col-span-8">
        {members.isPending ? (
          <p className="text-muted">Loading members…</p>
        ) : members.isError ? (
          <FormError message={`Couldn't load members: ${members.error.message}`} />
        ) : (
          <Panel className="overflow-hidden">
            <ul>
              {list.map((m, i) => {
                const isMe = m.user.id === me?.id;
                return (
                  <li
                    key={m.id}
                    className={`flex flex-wrap items-center gap-x-4 gap-y-2 px-5 py-3.5 ${i > 0 ? "border-t border-line" : ""}`}
                  >
                    <span className="grid size-9 shrink-0 place-items-center rounded-full bg-sand font-semibold">
                      {m.user.email.charAt(0).toUpperCase()}
                    </span>
                    <span className="min-w-0 flex-1 truncate font-medium">
                      {m.user.email}
                      {isMe ? <span className="text-muted"> (you)</span> : null}
                    </span>
                    <RoleBadge role={m.role} />
                    {isAdmin ? (
                      <ConfirmButton
                        label={isMe ? "Leave" : "Remove"}
                        confirmLabel={isMe ? "Leave workspace?" : "Remove from workspace?"}
                        onConfirm={() => onRemove(m.user.id)}
                      />
                    ) : null}
                  </li>
                );
              })}
            </ul>
          </Panel>
        )}
        {/* e.g. 409 "Cannot remove the last admin of a workspace" from the backend */}
        <FormError message={remove.isError ? remove.error.message : undefined} />
      </div>

      <aside className="lg:col-span-4">
        {isAdmin ? (
          <Panel className="bg-sand p-6">
            <h2 className="font-display text-[22px] font-bold">Add a person</h2>
            <p className="mt-1 text-[15px] text-ink/75">They need a Knowledge Ops account first.</p>
            <form onSubmit={onAdd} className="mt-4 flex flex-col gap-3" noValidate>
              <label htmlFor="member-email" className="text-sm font-medium">
                Email
              </label>
              <input
                id="member-email"
                type="email"
                autoComplete="off"
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  if (add.isError) add.reset(); // clear the old error once they edit
                }}
                placeholder="teammate@company.com"
                className="rounded-md border border-line bg-surface px-3 py-2.5 outline-none focus:border-pine"
              />
              <label htmlFor="member-role" className="text-sm font-medium">
                Role
              </label>
              <select
                id="member-role"
                value={role}
                onChange={(e) => setRole(e.target.value as Role)}
                className="rounded-md border border-line bg-surface px-3 py-2.5 outline-none focus:border-pine"
              >
                <option value="MEMBER">Member: read, upload and ask</option>
                <option value="ADMIN">Admin: also manages people and settings</option>
              </select>
              <FormError message={addMemberError(add.error)} />
              <Button type="submit" disabled={add.isPending || !email.trim()}>
                {add.isPending ? "Adding…" : "Add to workspace"}
              </Button>
            </form>
          </Panel>
        ) : (
          <Panel className="bg-sand p-6">
            <h2 className="font-display text-[22px] font-bold">Who can add people?</h2>
            <p className="mt-1 text-[15px] text-ink/75">
              Only admins of this workspace can add or remove members. Ask one of the admins listed
              here.
            </p>
          </Panel>
        )}
      </aside>
    </div>
  );
}
