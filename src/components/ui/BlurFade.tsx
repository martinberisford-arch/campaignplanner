import { useEffect, useRef, useState, type ReactNode } from 'react';

interface BlurFadeProps {
  children: ReactNode;
  delay?: number;
  duration?: number;
  blur?: string;
  yOffset?: number;
  className?: string;
  inView?: boolean;
}

export default function BlurFade({
  children,
  delay = 0,
  duration = 0.4,
  blur = '6px',
  yOffset = 8,
  className = '',
  inView = true,
}: BlurFadeProps) {
  const ref = useRef<HTMLDivElement>(null);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    if (!inView) return;
    const timer = setTimeout(() => setIsVisible(true), delay * 1000);
    return () => clearTimeout(timer);
  }, [delay, inView]);

  return (
    <div
      ref={ref}
      className={className}
      style={{
        opacity: isVisible ? 1 : 0,
        filter: isVisible ? 'blur(0px)' : `blur(${blur})`,
        transform: isVisible ? 'translateY(0px)' : `translateY(${yOffset}px)`,
        transition: `opacity ${duration}s ease, filter ${duration}s ease, transform ${duration}s ease`,
        transitionDelay: `${delay}s`,
      }}
    >
      {children}
    </div>
  );
}
