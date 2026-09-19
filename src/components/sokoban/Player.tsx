import { motion } from "framer-motion";

type Props = {
  size: number;
  x: number;
  y: number;
  reducedMotion: boolean;
};

export function Player({ size, x, y, reducedMotion }: Props) {
  const dim = size * 0.34;
  return (
    <motion.div
      className="pointer-events-none absolute grid place-items-center"
      style={{ width: size, height: size }}
      initial={false}
      animate={{ left: x * size, top: y * size }}
      transition={reducedMotion ? { duration: 0 } : { type: "spring", stiffness: 480, damping: 34 }}
      aria-label="Player"
    >
      <span
        className="block rounded-full bg-[#f3f1ea] shadow-[0_0_0_1px_rgba(0,0,0,0.35)]"
        style={{ width: dim, height: dim }}
      />
    </motion.div>
  );
}
