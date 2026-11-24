interface Props {
  categoria: string;
  nombre: string;
}

export function IlustracionServicio({ categoria, nombre }: Props) {
  const clave = `${categoria} ${nombre}`.toLowerCase();

  if (clave.includes('limpieza') || clave.includes('prevención')) {
    return (
      <svg viewBox="0 0 180 120" className="w-full h-full" aria-hidden="true">
        <circle cx="52" cy="58" r="38" fill="#59e25d" opacity="0.45" />
        <circle cx="132" cy="70" r="26" fill="#ffe228" opacity="0.7" />
        <path
          d="M72 34c-11 0-20 9-20 21 0 15 9 37 16 37 4 0 7-9 12-9s8 9 12 9c7 0 16-22 16-37 0-12-9-21-20-21-4 0-7 2-8 2s-4-2-8-2Z"
          fill="#ffffff"
          stroke="#130e30"
          strokeWidth="3"
          strokeLinejoin="round"
        />
        <path d="M118 28l3 7 7 3-7 3-3 7-3-7-7-3 7-3 3-7Z" fill="#ffe228" stroke="#130e30" strokeWidth="2" />
        <circle cx="44" cy="34" r="5" fill="#e261e5" />
      </svg>
    );
  }

  if (clave.includes('ortodoncia') || clave.includes('alineación')) {
    return (
      <svg viewBox="0 0 180 120" className="w-full h-full" aria-hidden="true">
        <rect x="24" y="24" width="132" height="72" rx="36" fill="#e261e5" opacity="0.3" />
        <circle cx="136" cy="36" r="18" fill="#59e25d" opacity="0.6" />
        <rect x="44" y="42" width="24" height="32" rx="8" fill="#ffffff" stroke="#130e30" strokeWidth="3" />
        <rect x="78" y="38" width="24" height="36" rx="8" fill="#ffffff" stroke="#130e30" strokeWidth="3" />
        <rect x="112" y="42" width="24" height="32" rx="8" fill="#ffffff" stroke="#130e30" strokeWidth="3" />
        <line x1="36" y1="58" x2="144" y2="58" stroke="#130e30" strokeWidth="3" strokeLinecap="round" />
        <rect x="51" y="53" width="10" height="10" rx="2" fill="#ffe228" stroke="#130e30" strokeWidth="2" />
        <rect x="85" y="53" width="10" height="10" rx="2" fill="#ffe228" stroke="#130e30" strokeWidth="2" />
        <rect x="119" y="53" width="10" height="10" rx="2" fill="#ffe228" stroke="#130e30" strokeWidth="2" />
      </svg>
    );
  }

  if (clave.includes('blanqueamiento') || clave.includes('estética')) {
    return (
      <svg viewBox="0 0 180 120" className="w-full h-full" aria-hidden="true">
        <circle cx="90" cy="60" r="44" fill="#ffe228" opacity="0.55" />
        <circle cx="48" cy="82" r="18" fill="#59e25d" opacity="0.45" />
        <path
          d="M72 34c-11 0-20 9-20 21 0 15 9 37 16 37 4 0 7-9 12-9s8 9 12 9c7 0 16-22 16-37 0-12-9-21-20-21-4 0-7 2-8 2s-4-2-8-2Z"
          fill="#ffffff"
          stroke="#130e30"
          strokeWidth="3"
        />
        <path d="M126 26l4 9 9 4-9 4-4 9-4-9-9-4 9-4 4-9Z" fill="#ffffff" stroke="#130e30" strokeWidth="2" />
        <path d="M44 30l2 5 5 2-5 2-2 5-2-5-5-2 5-2 2-5Z" fill="#ffe228" stroke="#130e30" strokeWidth="2" />
      </svg>
    );
  }

  if (clave.includes('endodoncia') || clave.includes('implante')) {
    return (
      <svg viewBox="0 0 180 120" className="w-full h-full" aria-hidden="true">
        <circle cx="122" cy="62" r="38" fill="#59e25d" opacity="0.4" />
        <circle cx="52" cy="44" r="22" fill="#e261e5" opacity="0.4" />
        <path
          d="M76 26c-10 0-18 8-18 18 0 10 6 16 14 16h16c8 0 14-6 14-16 0-10-8-18-18-18-3 0-4 2-4 2s-1-2-4-2Z"
          fill="#ffffff"
          stroke="#130e30"
          strokeWidth="3"
        />
        <rect x="74" y="60" width="22" height="34" rx="6" fill="#ffe228" stroke="#130e30" strokeWidth="3" />
        <line x1="74" y1="71" x2="96" y2="71" stroke="#130e30" strokeWidth="2.5" />
        <line x1="74" y1="82" x2="96" y2="82" stroke="#130e30" strokeWidth="2.5" />
      </svg>
    );
  }

  if (clave.includes('niños') || clave.includes('odontopediatría')) {
    return (
      <svg viewBox="0 0 180 120" className="w-full h-full" aria-hidden="true">
        <circle cx="64" cy="60" r="36" fill="#e261e5" opacity="0.35" />
        <circle cx="124" cy="54" r="30" fill="#ffe228" opacity="0.6" />
        <circle cx="90" cy="60" r="30" fill="#ffffff" stroke="#130e30" strokeWidth="3" />
        <circle cx="80" cy="54" r="3" fill="#130e30" />
        <circle cx="100" cy="54" r="3" fill="#130e30" />
        <path d="M78 66c3 5 21 5 24 0" fill="none" stroke="#130e30" strokeWidth="3" strokeLinecap="round" />
        <circle cx="46" cy="34" r="7" fill="#59e25d" />
      </svg>
    );
  }

  return (
    <svg viewBox="0 0 180 120" className="w-full h-full" aria-hidden="true">
      <circle cx="60" cy="64" r="36" fill="#59e25d" opacity="0.45" />
      <circle cx="122" cy="48" r="28" fill="#ffe228" opacity="0.6" />
      <path
        d="M72 34c-11 0-20 9-20 21 0 15 9 37 16 37 4 0 7-9 12-9s8 9 12 9c7 0 16-22 16-37 0-12-9-21-20-21-4 0-7 2-8 2s-4-2-8-2Z"
        fill="#ffffff"
        stroke="#130e30"
        strokeWidth="3"
        strokeLinejoin="round"
      />
      <circle cx="134" cy="84" r="10" fill="#e261e5" opacity="0.7" />
    </svg>
  );
}
