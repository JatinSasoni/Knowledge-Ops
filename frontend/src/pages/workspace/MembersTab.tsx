import { useState, type FormEvent } from "react";
import { useNavigate } from "react-router";
import { useQueryClient } from "@tanstack/react-query";
import { Select, type SelectOption } from "../../components/Select";
import { Button, ConfirmButton, FormError, Panel, RoleBadge } from "../../components/ui";
import { useMe } from "../../features/auth/hooks";
import {
  keys,
  useAddMember,
  useCancelInvitation,
  useInvitations,
  useMembers,
  useRemoveMember,
} from "../../features/workspaces/hooks";
import { ApiError, fieldError } from "../../lib/api";
import { formatDate } from "../../lib/format";
import { useToast } from "../../lib/toast";
import type { Role } from "../../types";
import { useWorkspaceContext } from "./context";

const ROLE_OPTIONS: SelectOption<Role>[] = [
  { value: "MEMBER", label: "Member", description: "Can read, upload and ask" },
  { value: "ADMIN", label: "Admin", description: "Also manages people and settings" },
];

// Turn the backend's status codes into sentences that say what to do next.
function addMemberError(error: unknown) {
  if (!(error instanceof ApiError)) return undefined;
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
  const toast = useToast();
  const invitations = useInvitations(workspace.id, isAdmin);
  const cancelInvite = useCancelInvitation(workspace.id);

  function onAdd(e: FormEvent) {
    e.preventDefault();
    const address = email.trim();
    add.mutate(
      { email: address, role },
      {
        onSuccess: (result) => {
          setEmail("");
          toast(
            result.kind === "invited"
              ? `Invitation sent to ${address}. They'll join once they accept it.`
              : `${address} was added and got an email about it.`,
          );
        },
      },
    );
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

        {isAdmin && (invitations.data?.length ?? 0) > 0 && (
          <section className="mt-4">
            <h2 className="mb-2 text-[13px] font-bold tracking-[0.1em] text-muted uppercase">
              Pending invitations
            </h2>
            <Panel className="overflow-hidden">
              <ul>
                {invitations.data!.map((invite, i) => (
                  <li
                    key={invite.id}
                    className={`flex flex-wrap items-center gap-x-4 gap-y-2 px-5 py-3.5 ${i > 0 ? "border-t border-line" : ""}`}
                  >
                    <span className="grid size-9 shrink-0 place-items-center rounded-full border border-dashed border-line text-muted">
                      @
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block truncate font-medium">{invite.email}</span>
                      <span className="block text-xs text-muted">
                        Invited {formatDate(invite.createdAt)} · expires{" "}
                        {formatDate(invite.expiresAt)}
                      </span>
                    </span>
                    <RoleBadge role={invite.role} />
                    <ConfirmButton
                      label="Cancel"
                      confirmLabel="Cancel invitation?"
                      onConfirm={() => cancelInvite.mutate(invite.id)}
                      disabled={cancelInvite.isPending}
                    />
                  </li>
                ))}
              </ul>
            </Panel>
            <p className="mt-2 text-xs text-muted">
              To resend, add the same email again: a new link replaces the old one.
            </p>
          </section>
        )}
      </div>

      <aside className="lg:col-span-4">
        {isAdmin ? (
          <Panel className="bg-sand p-6">
            <h2 className="font-display text-[22px] font-bold">Add a person</h2>
            <p className="mt-1 text-[15px] text-ink/75">
              If they don't have a Citely account yet, we'll email them an invitation.
            </p>
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
              <Select label="Role" value={role} options={ROLE_OPTIONS} onChange={setRole} />
              <FormError message={addMemberError(add.error)} />
              <Button type="submit" disabled={add.isPending || !email.trim()}>
                {add.isPending ? "Adding…" : "Add or invite"}
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
