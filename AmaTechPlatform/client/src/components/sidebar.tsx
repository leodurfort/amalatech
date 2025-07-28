import { useQuery } from "@tanstack/react-query";
import { BarChart3, Building, Users, GitBranch, MessageSquare, Bell } from "lucide-react";
import type { Rappel } from "@shared/schema";

export default function Sidebar() {
  // Get overdue reminders count
  const { data: overdueReminders = [] } = useQuery<Rappel[]>({
    queryKey: ["/api/rappels?echus=true"],
    refetchInterval: 60000, // Check every minute
  });

  const overdueCount = overdueReminders.length;

  const navigationItems = [
    { 
      icon: BarChart3, 
      label: "Tableau de Bord", 
      active: true 
    },
    { 
      icon: Building, 
      label: "Sociétés" 
    },
    { 
      icon: Users, 
      label: "Contacts" 
    },
    { 
      icon: GitBranch, 
      label: "Processus" 
    },
    { 
      icon: MessageSquare, 
      label: "Interactions" 
    },
    { 
      icon: Bell, 
      label: "Rappels", 
      badge: overdueCount > 0 ? overdueCount : undefined 
    },
  ];

  return (
    <aside className="w-64 bg-white shadow-lg border-r border-slate-200">
      {/* Header */}
      <div className="p-6 border-b border-slate-200">
        <div className="flex items-center space-x-3">
          <div className="w-8 h-8 bg-primary-500 rounded-lg flex items-center justify-center">
            <BarChart3 className="text-white w-4 h-4" />
          </div>
          <div>
            <h1 className="font-bold text-slate-800 text-lg">AmaTech</h1>
            <p className="text-xs text-slate-500">Roadshow CRM</p>
          </div>
        </div>
      </div>
      
      {/* Navigation */}
      <nav className="p-4 space-y-2">
        {navigationItems.map((item, index) => {
          const Icon = item.icon;
          return (
            <a
              key={index}
              href="#"
              className={`flex items-center justify-between px-3 py-2 rounded-lg font-medium transition-colors ${
                item.active
                  ? "bg-primary-50 text-primary-700"
                  : "text-slate-600 hover:bg-slate-100"
              }`}
            >
              <div className="flex items-center space-x-3">
                <Icon className="w-4 h-4" />
                <span>{item.label}</span>
              </div>
              {item.badge && (
                <span className="bg-red-500 text-white text-xs px-2 py-1 rounded-full">
                  {item.badge}
                </span>
              )}
            </a>
          );
        })}
      </nav>
      
      {/* User Profile */}
      <div className="absolute bottom-4 left-4 right-4">
        <div className="bg-slate-100 rounded-lg p-3">
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-slate-400 rounded-full flex items-center justify-center">
              <Users className="text-white w-4 h-4" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-slate-800 truncate">Jean Dupont</p>
              <p className="text-xs text-slate-500">Analyste M&A</p>
            </div>
          </div>
        </div>
      </div>
    </aside>
  );
}
