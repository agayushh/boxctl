import { motion } from "framer-motion";

type Props = {
  size: number;
  x: number;
  y: number;
  onGoal: boolean;
  reducedMotion: boolean;
};

export function Box({ size, x, y, onGoal, reducedMotion }: Props) {
  const pad = size * 0.16;
  return (
    <motion.div
      className="pointer-events-none absolute"
      style={{ width: size, height: size }}
      initial={reducedMotion ? false : { opacity: 0.4 }}
      animate={{ left: x * size, top: y * size, opacity: 1 }}
      transition={reducedMotion ? { duration: 0 } : { type: "spring", stiffness: 420, damping: 32 }}
      aria-hidden
    >
      <div
        className={[
          "absolute rounded-[4px] border",
          onGoal ? "bg-gold/90 border-gold" : "bg-[#c4a36a] border-[#a8884d]",
        ].join(" ")}
        style={{ inset: pad }}
      >
        <div className="absolute inset-[18%] border border-black/20 rounded-[2px]" />
      </div>
    </motion.div>
  );
}
