import {
  motion,
  useMotionValue,
  useTransform,
  useAnimation,
  PanInfo,
  MotionValue,
} from "framer-motion";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useId,
  useMemo,
  useRef,
  useState,
} from "react";

/**
 * Swipeable primitive
 * --------------------
 * A small, reusable horizontal-swipe row with optional left/right actions.
 *
 * Why this exists:
 *  - We had bespoke swipe logic on transactions and want the same feel
 *    elsewhere (e.g. savings goals, list rows). Centralizing the gesture
 *    keeps thresholds, easing, and visual feedback consistent across the app.
 *  - Pairs with `SwipeableGroup` so opening a row auto-closes the others —
 *    a small but very mobile-native UX detail.
 *  - `touch-pan-y` is preserved so vertical list scrolling never breaks.
 */

type SwipeAction = {
  icon: React.ReactNode;
  label?: string;
  /** Tailwind classes for the revealed action background. */
  className?: string;
  onTrigger: () => void;
};

interface SwipeableProps {
  children: React.ReactNode;
  /** Revealed by swiping right (positive X). Usually edit / mark / save. */
  rightAction?: SwipeAction;
  /** Revealed by swiping left (negative X). Usually delete / destructive. */
  leftAction?: SwipeAction;
  /** Width (px) of each action panel and trigger threshold. */
  actionWidth?: number;
  /** Programmatically force-close. Bumping this resets position to 0. */
  resetKey?: number | string;
  className?: string;
  /** Disable interaction entirely. */
  disabled?: boolean;
}

interface SwipeableGroupContextValue {
  register: (id: string, close: () => void) => () => void;
  notifyOpen: (id: string) => void;
}

const SwipeableGroupContext = createContext<SwipeableGroupContextValue | null>(
  null,
);

/**
 * Wrap a list with this to ensure only one swipeable row is open at a time.
 * Opening a new one will auto-close the previously open one.
 */
export const SwipeableGroup = ({ children }: { children: React.ReactNode }) => {
  const itemsRef = useRef(new Map<string, () => void>());
  const openIdRef = useRef<string | null>(null);

  const value = useMemo<SwipeableGroupContextValue>(
    () => ({
      register: (id, close) => {
        itemsRef.current.set(id, close);
        return () => {
          itemsRef.current.delete(id);
          if (openIdRef.current === id) openIdRef.current = null;
        };
      },
      notifyOpen: (id) => {
        const prev = openIdRef.current;
        if (prev && prev !== id) {
          itemsRef.current.get(prev)?.();
        }
        openIdRef.current = id;
      },
    }),
    [],
  );

  return (
    <SwipeableGroupContext.Provider value={value}>
      {children}
    </SwipeableGroupContext.Provider>
  );
};

const ActionPanel = ({
  side,
  action,
  width,
  x,
}: {
  side: "left" | "right";
  action: SwipeAction;
  width: number;
  x: MotionValue<number>;
}) => {
  // For the right-side panel (revealed by swiping LEFT, x negative):
  //   opacity goes 0 -> 1 as x goes 0 -> -width
  //   icon scale 0.7 -> 1.05 (slight pop) once threshold crossed
  const isRightPanel = side === "right";
  const opacity = useTransform(
    x,
    isRightPanel ? [-width, 0] : [0, width],
    isRightPanel ? [1, 0.2] : [0.2, 1],
  );
  const scale = useTransform(
    x,
    isRightPanel ? [-width * 1.2, -width * 0.5, 0] : [0, width * 0.5, width * 1.2],
    isRightPanel ? [1.1, 0.95, 0.7] : [0.7, 0.95, 1.1],
  );

  return (
    <motion.div
      style={{ width, opacity }}
      className={`absolute inset-y-0 ${
        isRightPanel ? "right-0" : "left-0"
      } flex items-center justify-center ${action.className ?? "bg-muted"}`}
      aria-hidden="true"
    >
      <motion.div style={{ scale }} className="flex flex-col items-center gap-0.5">
        {action.icon}
        {action.label && (
          <span className="text-[10px] font-semibold uppercase tracking-wide opacity-90">
            {action.label}
          </span>
        )}
      </motion.div>
    </motion.div>
  );
};

export const Swipeable = ({
  children,
  rightAction,
  leftAction,
  actionWidth = 80,
  resetKey,
  className = "",
  disabled = false,
}: SwipeableProps) => {
  const id = useId();
  const x = useMotionValue(0);
  const controls = useAnimation();
  const [isDragging, setIsDragging] = useState(false);
  const [armed, setArmed] = useState<"left" | "right" | null>(null);
  const group = useContext(SwipeableGroupContext);

  const triggerThreshold = actionWidth * 0.7; // ~56px for 80 — credible
  const dragLeftBound = leftAction ? -actionWidth : 0;
  const dragRightBound = rightAction ? actionWidth : 0;

  const close = useCallback(() => {
    controls.start({ x: 0, transition: { type: "spring", damping: 28, stiffness: 320 } });
  }, [controls]);

  // Group registration — ensures only-one-open behavior.
  useEffect(() => {
    if (!group) return;
    return group.register(id, close);
  }, [group, id, close]);

  // External reset
  useEffect(() => {
    close();
  }, [resetKey, close]);

  // Live "armed" feedback as the user drags past threshold
  useEffect(() => {
    const unsub = x.on("change", (v) => {
      if (v >= triggerThreshold && rightAction) setArmed("right");
      else if (v <= -triggerThreshold && leftAction) setArmed("left");
      else setArmed(null);
    });
    return () => unsub();
  }, [x, triggerThreshold, leftAction, rightAction]);

  const handleDragStart = () => {
    setIsDragging(true);
    group?.notifyOpen(id);
  };

  const handleDragEnd = async (_: unknown, info: PanInfo) => {
    setIsDragging(false);
    const offset = info.offset.x;
    const velocity = info.velocity.x;

    const triggeredRight =
      rightAction && (offset > triggerThreshold || velocity > 600);
    const triggeredLeft =
      leftAction && (offset < -triggerThreshold || velocity < -600);

    // Always animate back first so the action runs after the row is settled
    await controls.start({
      x: 0,
      transition: { type: "spring", damping: 30, stiffness: 320 },
    });
    setArmed(null);

    if (triggeredRight) rightAction!.onTrigger();
    else if (triggeredLeft) leftAction!.onTrigger();
  };

  return (
    <div className={`relative overflow-hidden ${className}`}>
      {rightAction && (
        <ActionPanel side="left" action={rightAction} width={actionWidth} x={x} />
      )}
      {leftAction && (
        <ActionPanel side="right" action={leftAction} width={actionWidth} x={x} />
      )}

      <motion.div
        drag={disabled ? false : "x"}
        dragDirectionLock
        dragConstraints={{ left: dragLeftBound, right: dragRightBound }}
        dragElastic={{ left: leftAction ? 0.15 : 0, right: rightAction ? 0.15 : 0 }}
        dragMomentum={false}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
        style={{ x }}
        animate={controls}
        whileTap={{ cursor: "grabbing" }}
        className={`relative bg-card touch-pan-y will-change-transform transition-shadow ${
          armed ? "shadow-md" : ""
        }`}
      >
        {/* Block click-throughs while dragging to avoid accidental row taps */}
        <div className={isDragging ? "pointer-events-none select-none" : ""}>
          {children}
        </div>
      </motion.div>
    </div>
  );
};
