import { Pencil, Trash2 } from "lucide-react";
import { Swipeable } from "./Swipeable";

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
  resetKey?: number;
}

export const SwipeableTransaction = ({
  onEdit,
  onDelete,
  children,
  resetKey,
}: SwipeableTransactionProps) => {
  return (
    <Swipeable
      resetKey={resetKey}
      rightAction={{
        icon: <Pencil className="w-5 h-5 text-primary-foreground" />,
        label: "Modifica",
        className: "bg-primary text-primary-foreground",
        onTrigger: onEdit,
      }}
      leftAction={{
        icon: <Trash2 className="w-5 h-5 text-destructive-foreground" />,
        label: "Elimina",
        className: "bg-destructive text-destructive-foreground",
        onTrigger: onDelete,
      }}
    >
      {children}
    </Swipeable>
  );
};
