'use client';

import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';

type Props = {
  children: React.ReactNode;
};

export default function Portal({ children }: Props) {
  const [mounted, setMounted] = useState(false);
  const [portalRoot, setPortalRoot] = useState<HTMLElement | null>(null);

  useEffect(() => {
    // Use the existing portal-root element instead of creating a new one
    const root = document.getElementById('portal-root');
    if (root) {
      setPortalRoot(root);
      setMounted(true);
    }
  }, []);

  if (!mounted || !portalRoot) return null;
  return createPortal(children, portalRoot);
}