'use client';

import { useState, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import ExpandableDutyPhoto from '@/components/clean-duty/ExpandableDutyPhoto';
import { X } from 'lucide-react';

const MAX_PHOTOS = 12;

interface PhotoUploadFormProps {
  dutyId: string;
  onUpload: (dutyId: string, photoUrls: string[]) => void;
  onCancel: () => void;
}

function readFileAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => resolve(reader.result as string);
    reader.onerror = () => reject(new Error('read failed'));
    reader.readAsDataURL(file);
  });
}

export default function PhotoUploadForm({
  dutyId,
  onUpload,
  onCancel,
}: PhotoUploadFormProps) {
  const [previews, setPreviews] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? []).filter((f) =>
      f.type.startsWith('image/')
    );
    if (files.length === 0) return;

    const room = MAX_PHOTOS - previews.length;
    const slice = files.slice(0, Math.max(0, room));
    if (slice.length === 0) return;

    try {
      const dataUrls = await Promise.all(slice.map(readFileAsDataUrl));
      setPreviews((prev) => [...prev, ...dataUrls]);
    } finally {
      e.target.value = '';
    }
  };

  const removeAt = (index: number) => {
    setPreviews((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (previews.length === 0) return;

    setIsLoading(true);
    setTimeout(() => {
      onUpload(dutyId, previews);
      setIsLoading(false);
    }, 600);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/60 px-3 py-8 sm:py-10">
      <Card className="my-auto w-full max-w-5xl shadow-xl">
        <CardHeader>
          <CardTitle>Upload kitchen cleaning photos</CardTitle>
          <p className="text-sm text-gray-600 font-normal">
            Add up to {MAX_PHOTOS} photos. Previews scale to full width (up to a tall max height) so you can verify each shot.
          </p>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700">
                Photos ({previews.length}/{MAX_PHOTOS})
              </label>
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileChange}
                accept="image/*"
                multiple
                className="hidden"
              />
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={previews.length >= MAX_PHOTOS}
                className="w-full rounded-lg border-2 border-dashed border-gray-300 px-4 py-6 transition-colors hover:border-blue-500 disabled:cursor-not-allowed disabled:opacity-50 flex flex-col items-center justify-center"
              >
                <span className="text-3xl mb-2">📷</span>
                <span className="text-sm text-gray-600">
                  {previews.length >= MAX_PHOTOS
                    ? 'Maximum photos reached'
                    : 'Click to add one or more photos'}
                </span>
              </button>
            </div>

            {previews.length > 0 && (
              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700">Preview</label>
                <div className="flex flex-col gap-4">
                  {previews.map((src, index) => (
                    <div
                      key={`${index}-${src.slice(0, 32)}`}
                      className="relative overflow-hidden rounded-lg border border-gray-300 bg-neutral-950 shadow-inner"
                    >
                      <button
                        type="button"
                        onClick={() => removeAt(index)}
                        className="absolute right-2 top-2 z-10 rounded-full bg-black/80 p-1.5 text-white shadow-md hover:bg-black"
                        aria-label="Remove photo"
                      >
                        <X className="h-4 w-4" />
                      </button>
                      <div className="flex justify-center px-2 py-3 sm:px-3 sm:py-4">
                        <ExpandableDutyPhoto
                          src={src}
                          alt={`Preview ${index + 1}`}
                          downloadBaseName={`kitchen-preview-${index + 1}`}
                          imgClassName="h-auto max-h-[min(88vh,920px)] w-auto max-w-full object-contain"
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="rounded-lg border border-blue-200 bg-blue-50 p-3">
              <p className="text-sm text-blue-800">
                Please show the completed kitchen clearly. Multiple angles help approval go faster.
              </p>
            </div>

            <div className="flex gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={onCancel}
                disabled={isLoading}
                className="flex-1"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={previews.length === 0 || isLoading}
                className="flex-1 bg-blue-600 hover:bg-blue-700"
              >
                {isLoading ? 'Submitting…' : `Submit ${previews.length} photo${previews.length === 1 ? '' : 's'}`}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
