import { motion, useMotionValue, useTransform, PanInfo } from "framer-motion";
import { Pencil, Trash2 } from "lucide-react";
import { useState } from "react";

interface Transaction {
  id: string;
  description: string;
  amount: number;
  category: string;
  emoji: string;
  transaction_date: string;
  is_income: boolean;
  is_necessary?: boolean;
}

interface SwipeableTransactionProps {
  transaction: Transaction;
  onEdit: () => void;
  onDelete: () => void;
  children: React.ReactNode;
}

const categoryLabels: Record<string, string> = {
  food: "Cibo",
  transport: "Trasporti",
  entertainment: "Svago",
  shopping: "Shopping",
  bills: "Bollette",
  health: "Salute",
  education: "Istruzione",
  savings: "Risparmi",
  income: "Entrate",
  other: "Altro",
};

const SWIPE_THRESHOLD = 80;
const ACTION_WIDTH = 70;

export const SwipeableTransaction = ({
  transaction,
  onEdit,
  onDelete,
  children,
}: SwipeableTransactionProps) => {
  const [isDragging, setIsDragging] = useState(false);
  const x = useMotionValue(0);
  
  // Transform for action buttons opacity/scale
  const editOpacity = useTransform(x, [0, SWIPE_THRESHOLD], [0.3, 1]);
  const editScale = useTransform(x, [0, SWIPE_THRESHOLD], [0.8, 1]);
  const deleteOpacity = useTransform(x, [-SWIPE_THRESHOLD, 0], [1, 0.3]);
  const deleteScale = useTransform(x, [-SWIPE_THRESHOLD, 0], [1, 0.8]);

  const handleDragEnd = (_: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) => {
    setIsDragging(false);
    const offset = info.offset.x;
    
    if (offset > SWIPE_THRESHOLD) {
      // Swipe right → Edit
      onEdit();
    } else if (offset < -SWIPE_THRESHOLD) {
      // Swipe left → Delete
      onDelete();
    }
  };

  return (
    <div className="relative overflow-hidden">
      {/* Edit Action (left side - revealed on right swipe) */}
      <motion.div 
        className="absolute inset-y-0 left-0 flex items-center justify-center bg-primary"
        style={{ 
          width: ACTION_WIDTH,
          opacity: editOpacity,
        }}
      >
        <motion.div style={{ scale: editScale }}>
          <Pencil className="w-5 h-5 text-primary-foreground" />
        </motion.div>
      </motion.div>

      {/* Delete Action (right side - revealed on left swipe) */}
      <motion.div 
        className="absolute inset-y-0 right-0 flex items-center justify-center bg-destructive"
        style={{ 
          width: ACTION_WIDTH,
          opacity: deleteOpacity,
        }}
      >
        <motion.div style={{ scale: deleteScale }}>
          <Trash2 className="w-5 h-5 text-destructive-foreground" />
        </motion.div>
      </motion.div>

      {/* Swipeable Content */}
      <motion.div
        drag="x"
        dragConstraints={{ left: -ACTION_WIDTH, right: ACTION_WIDTH }}
        dragElastic={0.2}
        onDragStart={() => setIsDragging(true)}
        onDragEnd={handleDragEnd}
        style={{ x }}
        className="relative bg-card touch-pan-y"
        whileTap={{ cursor: "grabbing" }}
      >
        <div className={isDragging ? "pointer-events-none" : ""}>
          {children}
        </div>
      </motion.div>
    </div>
  );
};
