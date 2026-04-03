"use client";

import Image from "next/image";
import { useGoogleAuthSession } from "@/src/features/auth/hooks/use-google-auth-session";

export function GoogleAuthCard() {
  const { authState, handleSignInWithGoogle, handleSignOut } =
    useGoogleAuthSession();

  return (
    <section className="rounded-[2rem] border border-white/10 bg-slate-950/40 p-6">
      <p className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-400">
        Compte Google
      </p>

      <div className="mt-4 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-4">
          {authState.userProfile?.photoUrl ? (
            <Image
              src={authState.userProfile.photoUrl}
              alt={`Avatar de ${authState.userProfile.displayName}`}
              width={48}
              height={48}
              className="rounded-full"
              unoptimized
            />
          ) : (
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-white/5 text-sm font-black text-slate-300">
              G
            </div>
          )}

          <div>
            <h2 className="text-lg font-black tracking-[-0.04em] text-white">
              {authState.userProfile?.displayName ?? "Invite"}
            </h2>
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">
              {authState.userProfile?.email ??
                (authState.isAuthReady
                  ? "Non connecte"
                  : "Chargement session")}
            </p>
          </div>
        </div>

        {authState.userProfile ? (
          <button
            type="button"
            disabled={authState.isSubmitting}
            onClick={handleSignOut}
            className="inline-flex items-center justify-center rounded-full border border-white/15 px-6 py-3 text-xs font-bold uppercase tracking-[0.2em] text-white transition-colors hover:border-white/30 hover:bg-white/5 disabled:cursor-not-allowed disabled:opacity-60"
          >
            Se deconnecter
          </button>
        ) : (
          <button
            type="button"
            disabled={!authState.isAuthReady || authState.isSubmitting}
            onClick={handleSignInWithGoogle}
            className="inline-flex items-center justify-center rounded-full bg-white px-6 py-3 text-xs font-bold uppercase tracking-[0.2em] text-slate-950 transition-colors hover:bg-slate-200 disabled:cursor-not-allowed disabled:opacity-60"
          >
            Continuer avec Google
          </button>
        )}
      </div>

      {authState.errorMessage ? (
        <p className="mt-4 text-sm leading-7 text-amber-200">
          {authState.errorMessage}
        </p>
      ) : null}
    </section>
  );
}
