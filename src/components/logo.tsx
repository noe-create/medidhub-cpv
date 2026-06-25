'use client';

import * as React from 'react';
import Image from 'next/image';

export function Logo({ className }: { className?: string }) {
  return (
    <Image
      src="/logo-de-sistema/recipe/logomedihub.svg"
      alt="Logo"
      width={250}
      height={250}
      className={className}
      priority
    />
  );
}
