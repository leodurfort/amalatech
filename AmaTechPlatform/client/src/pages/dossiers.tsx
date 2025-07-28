import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
// useLocation retiré - navigation directe utilisée
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ArrowLeftIcon, FilterIcon } from "lucide-react";
import KanbanBoard from "@/components/KanbanBoard";

interface Dossier {
  id: number;
  nom: string;
  type: string;
  statut: string;
  etape_kanban: string;
  date_debut: string;
  date_cloture: string | null;
  description: string;
  societes_count: number;
  interactions_count: number;
  last_activity: string | null;
  is_member: boolean;
  role?: string;
}

export default function Dossiers() {
  const { user } = useAuth();
  // Navigation directe pour éviter les conflits de routage
  const [statusFilter, setStatusFilter] = useState("TOUS");

  const { data: dossiers = [], isLoading, refetch } = useQuery({
    queryKey: ["/api/dossiers"],
    queryFn: async () => {
      const response = await fetch("/api/dossiers");
      if (!response.ok) throw new Error('Failed to fetch dossiers');
      return response.json();
    },
  });

  const filteredDossiers = dossiers.filter((dossier: Dossier) => {
    const matchesStatus = statusFilter === "TOUS" || dossier.statut === statusFilter;
    return matchesStatus;
  });

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#f8fafc] flex items-center justify-center">
        <div className="text-gray-600">Chargement des dossiers...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f8fafc]">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center gap-4">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => window.location.href = '/'}
                className="p-1"
              >
                <ArrowLeftIcon className="h-4 w-4" />
              </Button>
              <img
                src="/assets/logo-amala-bleu.png"
                alt="Logo Amala Partners"
                className="h-8"
              />
              <div>
                <h1 className="text-2xl font-bold text-[#0e355c]">
                  Vue Kanban - Tous les Dossiers
                </h1>
                <p className="text-sm text-gray-600">
                  Progression des mandats M&A par étapes
                </p>
              </div>
            </div>
            <div className="text-right">
              <div className="text-lg font-semibold text-gray-900">
                {(user as any)?.firstName && (user as any)?.lastName 
                  ? `${(user as any).firstName} ${(user as any).lastName}`
                  : (user as any)?.email?.split('@')[0] || 'Utilisateur'}
              </div>
              <div className="text-sm text-gray-600">{(user as any)?.poste || 'Collaborateur'}</div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => window.location.href = '/api/logout'}
                className="mt-1 text-xs"
              >
                Se déconnecter
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Filter by Status */}
        <div className="mb-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FilterIcon className="h-5 w-5" />
                Filtrer par Statut
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-64">
                  <SelectValue placeholder="Statut" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="TOUS">Tous les statuts</SelectItem>
                  <SelectItem value="ACTIF">Actif</SelectItem>
                  <SelectItem value="CLOTURE">Clôturé</SelectItem>
                  <SelectItem value="PERDU">Perdu</SelectItem>
                  <SelectItem value="PAUSE">En pause</SelectItem>
                </SelectContent>
              </Select>
            </CardContent>
          </Card>
        </div>

        {/* Kanban Board */}
        <KanbanBoard dossiers={filteredDossiers} onDossierUpdate={refetch} />
      </div>
    </div>
  );
}