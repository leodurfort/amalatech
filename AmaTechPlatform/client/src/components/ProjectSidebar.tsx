import { cn } from "@/lib/utils";
import { 
  Clock, 
  CheckSquare, 
  Users, 
  FileText, 
  BookOpen, 
  MessageCircle, 
  UserCheck, 
  Calculator,
  Activity
} from "lucide-react";

interface ProjectSidebarProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
  isAdmin?: boolean;
}

const navigation = [
  {
    id: "timeline",
    label: "Timeline / Journal",
    icon: Clock,
    description: "Historique des interactions"
  },
  {
    id: "todo",
    label: "To-do List",
    icon: CheckSquare,
    description: "Tâches et rappels"
  },
  {
    id: "roadshow",
    label: "Roadshow",
    icon: Users,
    description: "Suivi des contacts"
  },
  {
    id: "documents",
    label: "Documents & Toolbox",
    icon: FileText,
    description: "Fichiers et outils"
  },
  {
    id: "journal",
    label: "Journal de bord",
    icon: BookOpen,
    description: "Notes internes"
  },
  {
    id: "qa",
    label: "Q&A",
    icon: MessageCircle,
    description: "Questions/Réponses"
  },
  {
    id: "working-group",
    label: "Working Group List",
    icon: UserCheck,
    description: "Équipes projet"
  }
];

const adminNavigation = [
  {
    id: "economics",
    label: "Synthèse économique",
    icon: Calculator,
    description: "Conditions financières",
    adminOnly: true
  }
];

export default function ProjectSidebar({ activeTab, onTabChange, isAdmin = false }: ProjectSidebarProps) {
  const allNavigation = [...navigation, ...(isAdmin ? adminNavigation : [])];

  return (
    <div className="w-64 bg-white border-r border-gray-200 flex-shrink-0">
      <div className="p-4">
        <h3 className="text-sm font-semibold text-gray-900 mb-4 flex items-center gap-2">
          <Activity className="w-4 h-4" />
          Navigation
        </h3>
        
        <nav className="space-y-1">
          {allNavigation.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            
            return (
              <button
                key={item.id}
                onClick={() => onTabChange(item.id)}
                className={cn(
                  "w-full text-left px-3 py-2 rounded-lg text-sm transition-colors group",
                  isActive
                    ? "bg-blue-50 text-blue-700 border border-blue-200"
                    : "text-gray-700 hover:bg-gray-50 hover:text-gray-900"
                )}
              >
                <div className="flex items-start gap-3">
                  <Icon className={cn(
                    "w-4 h-4 mt-0.5 flex-shrink-0",
                    isActive ? "text-blue-600" : "text-gray-400 group-hover:text-gray-600"
                  )} />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-medium">{item.label}</span>
                      {(item as any).adminOnly && (
                        <span className="text-xs bg-orange-100 text-orange-600 px-1.5 py-0.5 rounded">
                          Admin
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-gray-500 mt-0.5">
                      {item.description}
                    </p>
                  </div>
                </div>
              </button>
            );
          })}
        </nav>
      </div>
    </div>
  );
}