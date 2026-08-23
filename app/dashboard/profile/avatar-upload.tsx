"use client";

import { uploadAvatar } from "@/actions/profile";
import { UserAvatar, resolveAvatarSrc } from "@/components/shared/avatar";
import { Button } from "@/components/ui/button";
import { useActionState, useEffect, useRef, useState } from "react";

interface AvatarUploadProps {
  name: string;
  avatar: string | null;
}

export function AvatarUpload({ name, avatar }: AvatarUploadProps) {
  const [state, formAction, isPending] = useActionState(uploadAvatar, null);
  const formRef = useRef<HTMLFormElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const handledStateRef = useRef<typeof state>(null);

  useEffect(() => {
    return () => {
      if (previewUrl) URL.revokeObjectURL(previewUrl);
    };
  }, [previewUrl]);

  useEffect(() => {
    // React once per completed submission; on success drop the local preview
    // so the freshly stored avatar renders from storage.
    if (!state || handledStateRef.current === state) return;
    handledStateRef.current = state;
    if (state.success) setPreviewUrl(null);
  }, [state]);

  const currentSrc = previewUrl ?? resolveAvatarSrc(avatar);

  function handleFileChange(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;

    const nextPreview = URL.createObjectURL(file);
    setPreviewUrl(nextPreview);
    formRef.current?.requestSubmit();
  }

  return (
    <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
      <form ref={formRef} action={formAction} className="hidden">
        <input
          ref={inputRef}
          type="file"
          name="file"
          accept="image/png,image/jpeg,image/webp"
          onChange={handleFileChange}
        />
      </form>
      <UserAvatar name={name} src={currentSrc} size={80} />
      <div className="flex flex-col gap-2">
        <Button
          type="button"
          variant="secondary"
          className="self-start"
          disabled={isPending}
          onClick={() => inputRef.current?.click()}
        >
          {isPending ? "Uploading..." : avatar ? "Change Avatar" : "Upload Avatar"}
        </Button>
        <p className="text-caption text-muted-soft">PNG, JPG, or WebP up to 2MB.</p>
        {state?.success && (
          <p className="text-body-sm text-success" role="status">
            {state.success}
          </p>
        )}
        {state?.error && (
          <p className="text-body-sm text-error" role="alert">
            {state.error}
          </p>
        )}
      </div>
    </div>
  );
}
