interface BlobDecorativoProps {
  className?: string;
}

export function BlobDecorativo({ className = '' }: BlobDecorativoProps) {
  return (
    <div
      className={`pointer-events-none select-none absolute inset-0 overflow-hidden ${className}`}
      aria-hidden="true"
    >
      {/* Blob 1 — moss green */}
      <svg
        className="blob-1 absolute -top-20 -right-20 w-80 h-80 opacity-60"
        viewBox="0 0 400 400"
        xmlns="http://www.w3.org/2000/svg"
      >
        <path
          fill="#59e25d"
          d="M312,238Q274,276,232,312Q190,348,142,318Q94,288,66,238Q38,188,70,138Q102,88,154,66Q206,44,254,78Q302,112,328,156Q354,200,312,238Z"
        />
      </svg>
      {/* Blob 2 — fuchsia */}
      <svg
        className="blob-2 absolute -bottom-16 -left-16 w-72 h-72 opacity-50"
        viewBox="0 0 400 400"
        xmlns="http://www.w3.org/2000/svg"
      >
        <path
          fill="#e261e5"
          d="M290,260Q240,320,180,310Q120,300,86,246Q52,192,80,136Q108,80,166,64Q224,48,272,88Q320,128,320,194Q320,260,290,260Z"
        />
      </svg>
      {/* Blob 3 — hi-yellow */}
      <svg
        className="blob-3 absolute top-1/2 left-1/3 w-56 h-56 opacity-30"
        viewBox="0 0 400 400"
        xmlns="http://www.w3.org/2000/svg"
      >
        <path
          fill="#ffe228"
          d="M276,222Q228,284,172,276Q116,268,88,214Q60,160,100,116Q140,72,196,76Q252,80,284,130Q316,180,276,222Z"
        />
      </svg>
    </div>
  );
}
