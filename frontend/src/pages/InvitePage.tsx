import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState, type ReactNode } from "react";
import { Link, useNavigate, useSearchParams } from "react-router";
import { Button, FormError } from "../components/ui";
import { RegisterAside } from "../features/auth/AuthAside";
import { useLogout, useMe } from "../features/auth/hooks";
import * as invitationsApi from "../features/invitations/api";
import { pendingInvite } from "../features/invitations/api";
import { keys } from "../features/workspaces/hooks";
import { AuthLayout } from "./AuthLayout";

const linkButton =
  "inline-flex items-center justify-center rounded-md px-4 py-2.5 text-sm font-semibold transition-colors";

/*
 * Opened from the invitation email: /invite?token=…
 * 1. Keep the token (sessionStorage) and remove it from the address bar.
 * 2. Show who invited you to which workspace (public preview).
 * 3. Signed out → create an account (email prefilled) or sign in, then come back here.
 *    Signed in with the invited email → "Join". Signed in as someone else → explain.
 */
export function InvitePage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [token] = useState(() => {
    const fromUrl = searchParams.get("token");
    if (fromUrl) pendingInvite.set(fromUrl);
    return fromUrl ?? pendingInvite.get() ?? "";
  });

  useEffect(() => {
    if (searchParams.has("token")) setSearchParams({}, { replace: true });
  }, [searchParams, setSearchParams]);

  const me = useMe();
  const logout = useLogout();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const preview = useQuery({
    queryKey: ["invitation", token],
    queryFn: () => invitationsApi.previewInvitation(token),
    enabled: Boolean(token),
    retry: false, // 404 = invalid or expired; retrying won't change that
  });

  const accept = useMutation({
    mutationFn: () => invitationsApi.acceptInvitation(token),
    onSuccess: (workspaceId) => {
      pendingInvite.clear();
      queryClient.invalidateQueries({ queryKey: keys.workspaces });
      navigate(`/workspaces/${workspaceId}`, { replace: true });
    },
  });

  const invitation = preview.data;
  const user = me.data;
  const roleText = invitation?.role === "ADMIN" ? "an admin" : "a member";

  let content: ReactNode;
  if (!token || preview.isError) {
    content = (
      <Notice title="This invitation doesn't work">
        It may have expired (invitations last 7 days), been used already, or been cancelled. Ask the
        person who invited you to send a new one.
      </Notice>
    );
  } else if (preview.isPending || me.isPending) {
    content = <p className="text-muted">Loading the invitation…</p>;
  } else if (!user) {
    // Signed out: both pages send them back here afterwards.
    content = (
      <div className="flex flex-col gap-4">
        <InviteCard invitation={invitation!} roleText={roleText} />
        <Link
          to="/register"
          state={{ from: "/invite", email: invitation!.email }}
          className={`${linkButton} bg-pine text-paper hover:bg-pine-dark`}
        >
          Create an account to join
        </Link>
        <Link
          to="/login"
          state={{ from: "/invite" }}
          className={`${linkButton} border border-line text-ink hover:border-pine/50`}
        >
          I already have an account
        </Link>
      </div>
    );
  } else if (user.email.toLowerCase() !== invitation!.email) {
    content = (
      <div className="flex flex-col gap-4">
        <InviteCard invitation={invitation!} roleText={roleText} />
        <Notice title="Different account">
          This invitation is for <strong>{invitation!.email}</strong>, but you're signed in as{" "}
          <strong>{user.email}</strong>. Sign out, then sign in or create an account with the
          invited email.
        </Notice>
        {/* Signing out lands on /login; the invite token stays saved for this tab. */}
        <Button type="button" variant="quiet" onClick={() => void logout()}>
          Sign out
        </Button>
      </div>
    );
  } else {
    content = (
      <div className="flex flex-col gap-4">
        <InviteCard invitation={invitation!} roleText={roleText} />
        <FormError message={accept.isError ? accept.error.message : undefined} />
        <Button type="button" onClick={() => accept.mutate()} disabled={accept.isPending}>
          {accept.isPending ? "Joining…" : `Join ${invitation!.workspaceName}`}
        </Button>
      </div>
    );
  }

  return (
    <AuthLayout
      title="You're invited"
      intro="Join your team's workspace to ask questions about its documents, with sources."
      aside={<RegisterAside />}
      redirectIfSignedIn={false}
    >
      {content}
    </AuthLayout>
  );
}

function InviteCard({
  invitation,
  roleText,
}: {
  invitation: { workspaceName: string; invitedBy: string; email: string };
  roleText: string;
}) {
  return (
    <div className="flex items-center gap-4 rounded-lg border border-line bg-surface p-5">
      <span className="flex size-12 shrink-0 items-center justify-center rounded-xl bg-pine font-display text-[22px] font-extrabold text-paper">
        {invitation.workspaceName.trim().charAt(0).toUpperCase()}
      </span>
      <div className="min-w-0">
        <p className="truncate font-display text-[20px] font-bold">{invitation.workspaceName}</p>
        <p className="text-[14px] text-ink/75">
          {invitation.invitedBy} invited <strong>{invitation.email}</strong> as {roleText}.
        </p>
      </div>
    </div>
  );
}

function Notice({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div className="flex flex-col gap-2 rounded-lg border border-line bg-surface p-5">
      <p className="font-display text-[20px] font-bold">{title}</p>
      <p className="text-[15px] leading-relaxed text-ink/80">{children}</p>
    </div>
  );
}
