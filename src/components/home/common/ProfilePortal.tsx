import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";

const ProfilePortal = ({ children }: { children: React.ReactNode }) => {
  const [mounted, setMounted] = useState(false);
  const elRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    elRef.current = document.createElement('div');
    elRef.current.style.position = 'fixed';
    elRef.current.style.top = '0';
    elRef.current.style.left = '0';
    elRef.current.style.width = '100%';
    elRef.current.style.height = '100%';
    elRef.current.style.pointerEvents = 'none';
    elRef.current.style.zIndex = '9999';
    
    document.body.appendChild(elRef.current);
    setMounted(true);
    
    return () => {
      if (elRef.current && document.body.contains(elRef.current)) {
        document.body.removeChild(elRef.current);
      }
    };
  }, []);

  if (!mounted || !elRef.current) return null;
  
  return createPortal(
    <div className="fixed inset-0 z-[9999] pointer-events-none">
      <div className="absolute right-4 top-16 pointer-events-auto">
        {children}
      </div>
    </div>,
    elRef.current
  );
};

export default ProfilePortal;