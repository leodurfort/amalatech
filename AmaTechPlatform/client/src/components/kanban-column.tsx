import CompanyCard from "./company-card";
import type { RoadshowItemWithDetails } from "@shared/schema";

interface KanbanColumnProps {
  title: string;
  items: RoadshowItemWithDetails[];
  bgColor: string;
  borderColor: string;
  badgeColor: string;
  onAddInteraction: (companyId: number) => void;
  onRefresh: () => void;
}

export default function KanbanColumn({ 
  title, 
  items, 
  bgColor, 
  borderColor, 
  badgeColor,
  onAddInteraction,
  onRefresh 
}: KanbanColumnProps) {
  return (
    <div className="flex-shrink-0 w-80">
      <div className={`${bgColor} rounded-lg h-full flex flex-col`}>
        {/* Column Header */}
        <div className={`p-4 border-b ${borderColor}`}>
          <div className="flex items-center justify-between">
            <h3 className="font-semibold text-slate-800">{title}</h3>
            <span className={`${badgeColor} text-white text-xs px-2 py-1 rounded-full`}>
              {items.length}
            </span>
          </div>
        </div>
        
        {/* Column Content */}
        <div className="flex-1 p-4 space-y-3 overflow-y-auto">
          {items.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-slate-500 text-sm">Aucune société dans cette colonne</p>
            </div>
          ) : (
            items.map(item => (
              <CompanyCard
                key={item.id}
                item={item}
                borderColor={borderColor}
                onAddInteraction={onAddInteraction}
                onRefresh={onRefresh}
              />
            ))
          )}
        </div>
      </div>
    </div>
  );
}
