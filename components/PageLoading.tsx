import { Spinner } from '@/components/ui/spinner';
import { cn } from '@/lib/utils';

type PageLoadingProps = {
  /** Shown under the spinner */
  message?: string;
  /** Fill the viewport (e.g. root or auth shell) */
  fullScreen?: boolean;
  className?: string;
};

export function PageLoading({
  message = 'Loading…',
  fullScreen = false,
  className,
}: PageLoadingProps) {
  return (
    <div
      className={cn(
        'flex w-full flex-col items-center justify-center gap-4 py-16 text-muted-foreground',
        fullScreen ? 'min-h-screen' : 'min-h-[min(70vh,32rem)]',
        className,
      )}
      role="status"
      aria-live="polite"
      aria-busy="true"
    >
      <Spinner className="size-10 text-primary" />
      <p className="text-sm font-medium text-foreground/80">{message}</p>
    </div>
  );
}
