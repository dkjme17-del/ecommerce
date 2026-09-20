export function StarRating({ value = 0, size = 'md' }) {
  const sizes = { sm: 'h-3.5 w-3.5', md: 'h-4 w-4', lg: 'h-5 w-5' };
  const sizeClass = sizes[size] || sizes.md;
  return (
    <div className="flex items-center gap-0.5" aria-label={`Note : ${value} / 5`}>
      {[1, 2, 3, 4, 5].map((i) => {
        const fill = i <= Math.round(value) ? 'text-amber-400' : 'text-ink-faint';
        return (
          <svg key={i} className={`${sizeClass} ${fill}`} fill="currentColor" viewBox="0 0 20 20">
            <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.286 3.958a1 1 0 0 0 .95.69h4.162c.969 0 1.371 1.24.588 1.81l-3.367 2.446a1 1 0 0 0-.364 1.118l1.287 3.957c.3.921-.755 1.688-1.539 1.118l-3.366-2.445a1 1 0 0 0-1.176 0l-3.366 2.445c-.784.57-1.838-.197-1.539-1.118l1.287-3.957a1 1 0 0 0-.364-1.118L2.05 9.385c-.783-.57-.38-1.81.588-1.81h4.162a1 1 0 0 0 .95-.69l1.287-3.958Z" />
          </svg>
        );
      })}
    </div>
  );
}