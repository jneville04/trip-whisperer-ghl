import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";

export type FilterType = "all" | "proposals" | "group_trips" | "drafts" | "published";
export type SortType = "newest" | "oldest" | "az" | "za";

interface ProposalFiltersProps {
  filter: FilterType;
  sort: SortType;
  onFilterChange: (f: FilterType) => void;
  onSortChange: (s: SortType) => void;
}

const filters: { value: FilterType; label: string }[] = [
  { value: "all", label: "All" },
  { value: "proposals", label: "Proposals" },
  { value: "group_trips", label: "Group Trips" },
  { value: "drafts", label: "Drafts" },
  { value: "published", label: "Published" },
];

export default function ProposalFilters({ filter, sort, onFilterChange, onSortChange }: ProposalFiltersProps) {
  return (
    <div className="flex items-center justify-between gap-4 flex-wrap">
      <div className="flex items-center gap-1.5 flex-wrap">
        {filters.map((f) => (
          <Button
            key={f.value}
            variant={filter === f.value ? "travel" : "travel-ghost"}
            size="sm"
            className={cn("h-8 text-xs", filter === f.value && "shadow-sm")}
            onClick={() => onFilterChange(f.value)}
          >
            {f.label}
          </Button>
        ))}
      </div>
      <Select value={sort} onValueChange={(v) => onSortChange(v as SortType)}>
        <SelectTrigger className="w-[130px] h-8 text-xs">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="newest">Newest</SelectItem>
          <SelectItem value="oldest">Oldest</SelectItem>
          <SelectItem value="az">A–Z</SelectItem>
          <SelectItem value="za">Z–A</SelectItem>
        </SelectContent>
      </Select>
    </div>
  );
}
