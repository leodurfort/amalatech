import KanbanColumn from "./kanban-column";
import type { RoadshowItemWithDetails } from "@shared/schema";

interface KanbanBoardProps {
  items: RoadshowItemWithDetails[];
  onAddInteraction: (companyId: number) => void;
  onRefresh: () => void;
}

const COLUMN_CONFIG = [
  {
    id: "non_contacte",
    title: "Non Contacté",
    bgColor: "bg-slate-100",
    borderColor: "border-slate-200",
    badgeColor: "bg-slate-600"
  },
  {
    id: "nda_envoye",
    title: "NDA Envoyé",
    bgColor: "bg-blue-50",
    borderColor: "border-blue-200",
    badgeColor: "bg-blue-600"
  },
  {
    id: "nda_signe",
    title: "NDA Signé",
    bgColor: "bg-green-50",
    borderColor: "border-green-200",
    badgeColor: "bg-green-600"
  },
  {
    id: "ioi_recu",
    title: "IOI Reçu",
    bgColor: "bg-amber-50",
    borderColor: "border-amber-200",
    badgeColor: "bg-amber-600"
  },
  {
    id: "abandonne",
    title: "Abandonné",
    bgColor: "bg-red-50",
    borderColor: "border-red-200",
    badgeColor: "bg-red-600"
  }
];

export default function KanbanBoard({ items, onAddInteraction, onRefresh }: KanbanBoardProps) {
  // Group items by status
  const itemsByStatus = items.reduce((acc, item) => {
    const status = item.statut || "non_contacte";
    if (!acc[status]) {
      acc[status] = [];
    }
    acc[status].push(item);
    return acc;
  }, {} as Record<string, RoadshowItemWithDetails[]>);

  return (
    <div className="flex space-x-6 h-full">
      {COLUMN_CONFIG.map(column => (
        <KanbanColumn
          key={column.id}
          title={column.title}
          items={itemsByStatus[column.id] || []}
          bgColor={column.bgColor}
          borderColor={column.borderColor}
          badgeColor={column.badgeColor}
          onAddInteraction={onAddInteraction}
          onRefresh={onRefresh}
        />
      ))}
    </div>
  );
}
