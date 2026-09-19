import { motion } from "framer-motion";

type Props = {
  size: number;
  x: number;
  y: number;
  reducedMotion: boolean;
};

export function Goal({ size, x, y, reducedMotion }: Props) {
  return (
    <motion.div
      className="pointer-events-none absolute grid place-items-center"
      style={{ width: size, height: size, left: x * size, top: y * size }}
      initial={reducedMotion ? false : { opacity: 0 }}
      animate={{ opacity: 1 }}
      aria-hidden
    >
      <span className="block h-[36%] w-[36%] rotate-45 border border-gold/60" />
    </motion.div>
  );
}
