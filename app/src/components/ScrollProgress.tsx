import { useEffect, useState } from 'react';
import { motion, useScroll, useSpring } from 'framer-motion';

function ScrollProgressInner() {
  const { scrollYProgress } = useScroll();
  const scaleX = useSpring(scrollYProgress, { stiffness: 100, damping: 30, restDelta: 0.001 });

  return (
    <motion.div
      className="fixed top-0 left-0 right-0 z-[60] h-[2px] origin-left"
      style={{
        scaleX,
        backgroundColor: 'var(--accent-ocean)',
      }}
    />
  );
}

export default function ScrollProgress() {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  if (!mounted) return null;
  return <ScrollProgressInner />;
}
