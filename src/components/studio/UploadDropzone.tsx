'use client';

import { useRef, useState } from 'react';
import { ImageUp, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { loadImageData, type LoadedImage } from '@/lib/utils/image';
import { ACCEPTED_IMAGE_TYPES, MAX_UPLOAD_BYTES } from '@/types/pattern';
import { cn } from '@/lib/utils/cn';

export const UploadDropzone = ({
  onLoaded,
  busy,
}: {
  onLoaded: (image: LoadedImage) => void;
  busy: boolean;
}) => {
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleFile = async (file: File | undefined) => {
    if (!file) return;
    setError(null);

    try {
      const image = await loadImageData(file);
      onLoaded(image);
    } catch (cause) {
      console.error('[upload] could not read image', cause);
      setError(
        cause instanceof Error ? cause.message : 'We could not read that image. Try another file.',
      );
    }
  };

  return (
    <div>
      <div
        onDragOver={(event) => {
          event.preventDefault();
          setDragging(true);
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={(event) => {
          event.preventDefault();
          setDragging(false);
          void handleFile(event.dataTransfer.files?.[0]);
        }}
        className={cn(
          'flex flex-col items-center justify-center rounded-3xl border-2 border-dashed px-6 py-12 text-center transition',
          dragging
            ? 'border-bead-violet bg-bead-violet/5'
            : 'border-ink/15 bg-cream-soft/60 hover:border-ink/30',
        )}
      >
        {busy ? (
          <Loader2 className="h-8 w-8 animate-spin text-bead-violet" />
        ) : (
          <span className="inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-white shadow-soft">
            <ImageUp className="h-7 w-7 text-bead-violet" />
          </span>
        )}

        <p className="mt-5 text-base font-semibold text-ink">
          Drag an image here, or choose a file
        </p>
        <p className="mt-2 text-sm text-ink-muted">
          PNG, JPG or WEBP up to {Math.round(MAX_UPLOAD_BYTES / (1024 * 1024))}MB. Photos with clear
          subjects convert best.
        </p>

        <input
          ref={inputRef}
          type="file"
          accept={ACCEPTED_IMAGE_TYPES.join(',')}
          className="hidden"
          onChange={(event) => {
            void handleFile(event.target.files?.[0]);
            event.target.value = '';
          }}
        />

        <Button
          type="button"
          className="mt-6"
          variant="primary"
          onClick={() => inputRef.current?.click()}
        >
          Choose an image
        </Button>
      </div>

      {error ? (
        <p className="mt-4 rounded-2xl bg-state-danger/10 px-4 py-3 text-sm text-state-danger">
          {error}
        </p>
      ) : null}
    </div>
  );
};
