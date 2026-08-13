"use client";

import { useFormStatus } from "react-dom";

import { capturePrivydockNow } from "../sources/privydock/capture-action";

/**
 * Capture is a multi-second round trip across Cloudflare and Supabase, so the
 * button has to say so. `useFormStatus` gives the pending state without any
 * local state to keep in sync, and disabling on submit prevents a double run.
 */
function SubmitButton() {
  const { pending } = useFormStatus();

  return (
    <button aria-live="polite" className="button" disabled={pending} type="submit">
      {pending ? (
        <>
          <span aria-hidden className="spinner" />
          Capturing…
        </>
      ) : (
        "Capture now"
      )}
    </button>
  );
}

export function CaptureButton() {
  return (
    <form action={capturePrivydockNow}>
      <SubmitButton />
    </form>
  );
}
