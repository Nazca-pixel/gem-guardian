import { motion } from "framer-motion";
import { Filter, ChevronDown } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { format, subMonths } from "date-fns";
import { it } from "date-fns/locale";

const categories = [
  { value: "all", label: "Tutte", emoji: "📋" },
  { value: "food", label: "Cibo", emoji: "🍕" },
  { value: "transport", label: "Trasporti", emoji: "🚗" },
  { value: "entertainment", label: "Svago", emoji: "🎬" },
  { value: "shopping", label: "Shopping", emoji: "🛍️" },
  { value: "bills", label: "Bollette", emoji: "📄" },
  { value: "health", label: "Salute", emoji: "💊" },
  { value: "education", label: "Istruzione", emoji: "📚" },
  { value: "income", label: "Entrate", emoji: "💰" },
  { value: "other", label: "Altro", emoji: "📦" },
];

// Generate last 12 months for filter
const generateMonthOptions = () => {
  const months = [{ value: "all", label: "Tutti i mesi" }];
  for (let i = 0; i < 12; i++) {
    const date = subMonths(new Date(), i);
    months.push({
      value: format(date, "yyyy-MM"),
      label: format(date, "MMMM yyyy", { locale: it }),
    });
  }
  return months;
};

interface TransactionFiltersProps {
  selectedMonth: string;
  selectedCategory: string;
  onMonthChange: (month: string) => void;
  onCategoryChange: (category: string) => void;
}

export const TransactionFilters = ({
  selectedMonth,
  selectedCategory,
  onMonthChange,
  onCategoryChange,
}: TransactionFiltersProps) => {
  const monthOptions = generateMonthOptions();

  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex gap-2"
    >
      {/* Month Filter */}
      <Select value={selectedMonth} onValueChange={onMonthChange}>
        <SelectTrigger className="flex-1 h-10 rounded-xl bg-card border-border">
          <SelectValue placeholder="Mese" />
        </SelectTrigger>
        <SelectContent className="rounded-xl">
          {monthOptions.map((month) => (
            <SelectItem
              key={month.value}
              value={month.value}
              className="rounded-lg capitalize"
            >
              {month.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      {/* Category Filter */}
      <Select value={selectedCategory} onValueChange={onCategoryChange}>
        <SelectTrigger className="flex-1 h-10 rounded-xl bg-card border-border">
          <SelectValue placeholder="Categoria" />
        </SelectTrigger>
        <SelectContent className="rounded-xl">
          {categories.map((cat) => (
            <SelectItem
              key={cat.value}
              value={cat.value}
              className="rounded-lg"
            >
              <span className="flex items-center gap-2">
                <span>{cat.emoji}</span>
                <span>{cat.label}</span>
              </span>
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </motion.div>
  );
};

export { categories };
