import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
// useLocation retiré - navigation directe utilisée
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { 
  CalendarIcon, 
  UsersIcon, 
  TrendingUpIcon, 
  BuildingIcon,
  ChevronRightIcon,
  ChevronLeftIcon 
} from "lucide-react";

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

interface KanbanBoardProps {
  dossiers: Dossier[];
  onDossierUpdate: () => void;
}

const KANBAN_STAGES = [
  { id: "PREPARATION", label: "Préparation", color: "bg-gray-100 text-gray-800" },
  { id: "PRE_MARKETING", label: "Pre-marketing", color: "bg-blue-100 text-blue-800" },
  { id: "SCREENING", label: "Screening", color: "bg-indigo-100 text-indigo-800" },
  { id: "DEAL_MAKING", label: "Deal making", color: "bg-purple-100 text-purple-800" },
  { id: "ROADSHOW", label: "Roadshow", color: "bg-yellow-100 text-yellow-800" },
  { id: "PHASE_2", label: "Phase 2", color: "bg-orange-100 text-orange-800" },
  { id: "EXCLUSIVITE", label: "Exclusivité", color: "bg-red-100 text-red-800" },
  { id: "ROAD_TO_CLOSING", label: "Road to closing", color: "bg-green-100 text-green-800" },
];

export default function KanbanBoard({ dossiers, onDossierUpdate }: KanbanBoardProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  // Navigation directe pour éviter les conflits de routage
  const [movingDossier, setMovingDossier] = useState<number | null>(null);

  const updateDossierStage = useMutation({
    mutationFn: async ({ dossierId, newStage }: { dossierId: number; newStage: string }) => {
      await apiRequest(`/api/dossiers/${dossierId}`, "PATCH", { etape_kanban: newStage });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/dossiers"] });
      onDossierUpdate();
      toast({
        title: "Étape mise à jour",
        description: "Le dossier a été déplacé avec succès",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Erreur",
        description: "Impossible de mettre à jour l'étape du dossier",
        variant: "destructive",
      });
    },
    onSettled: () => {
      setMovingDossier(null);
    },
  });

  const moveToStage = (dossier: Dossier, direction: 'previous' | 'next') => {
    const currentIndex = KANBAN_STAGES.findIndex(stage => stage.id === dossier.etape_kanban);
    let newIndex;
    
    if (direction === 'next' && currentIndex < KANBAN_STAGES.length - 1) {
      newIndex = currentIndex + 1;
    } else if (direction === 'previous' && currentIndex > 0) {
      newIndex = currentIndex - 1;
    } else {
      return;
    }

    const newStage = KANBAN_STAGES[newIndex].id;
    setMovingDossier(dossier.id);
    updateDossierStage.mutate({ dossierId: dossier.id, newStage });
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case "CESSION": return "bg-purple-100 text-purple-800";
      case "ACQUISITION": return "bg-orange-100 text-orange-800";
      case "LEVEE": return "bg-indigo-100 text-indigo-800";
      default: return "bg-gray-100 text-gray-800";
    }
  };

  const getStatusColor = (statut: string) => {
    switch (statut) {
      case "ACTIF": return "bg-green-100 text-green-800";
      case "CLOTURE": return "bg-blue-100 text-blue-800";
      case "PERDU": return "bg-red-100 text-red-800";
      case "PAUSE": return "bg-yellow-100 text-yellow-800";
      default: return "bg-gray-100 text-gray-800";
    }
  };

  // Filtrer les dossiers actifs pour le Kanban
  const activeDossiers = dossiers.filter(d => d.statut === 'ACTIF');

  return (
    <div className="w-full overflow-x-auto">
      <div className="flex gap-6 min-w-max p-4">
        {KANBAN_STAGES.map((stage) => {
          const stageDossiers = activeDossiers.filter(d => d.etape_kanban === stage.id);
          
          return (
            <div key={stage.id} className="w-80 flex-shrink-0">
              <Card className="h-full">
                <CardHeader className="pb-3">
                  <CardTitle className="flex items-center justify-between">
                    <Badge className={stage.color} variant="secondary">
                      {stage.label}
                    </Badge>
                    <span className="text-sm text-gray-500">
                      {stageDossiers.length}
                    </span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3 max-h-[600px] overflow-y-auto">
                  {stageDossiers.length === 0 ? (
                    <div className="text-center text-gray-400 py-8">
                      <BuildingIcon className="h-8 w-8 mx-auto mb-2 text-gray-300" />
                      <p className="text-sm">Aucun dossier</p>
                    </div>
                  ) : (
                    stageDossiers.map((dossier) => (
                      <Card 
                        key={dossier.id} 
                        className={`hover:shadow-md transition-all duration-200 ${
                          movingDossier === dossier.id ? 'opacity-50' : ''
                        }`}
                      >
                        <CardContent className="p-4">
                          <div className="space-y-3">
                            {/* En-tête du dossier */}
                            <div>
                              <h4 className="font-semibold text-sm text-gray-900 line-clamp-2">
                                {dossier.nom}
                              </h4>
                              <div className="flex items-center gap-2 mt-1">
                                <Badge className={getTypeColor(dossier.type)} variant="outline">
                                  {dossier.type}
                                </Badge>
                                {dossier.is_member && (
                                  <Badge variant="outline" className="bg-purple-50 text-purple-700 border-purple-200">
                                    <UsersIcon className="h-3 w-3 mr-1" />
                                    Membre
                                  </Badge>
                                )}
                              </div>
                            </div>

                            {/* Description */}
                            {dossier.description && (
                              <p className="text-xs text-gray-600 line-clamp-2">
                                {dossier.description}
                              </p>
                            )}

                            {/* Métriques */}
                            <div className="flex items-center gap-4 text-xs text-gray-500">
                              <span className="flex items-center gap-1">
                                <BuildingIcon className="h-3 w-3" />
                                {dossier.societes_count}
                              </span>
                              <span className="flex items-center gap-1">
                                <TrendingUpIcon className="h-3 w-3" />
                                {dossier.interactions_count}
                              </span>
                            </div>

                            {/* Date */}
                            <div className="flex items-center gap-1 text-xs text-gray-500">
                              <CalendarIcon className="h-3 w-3" />
                              {new Date(dossier.date_debut).toLocaleDateString('fr-FR')}
                            </div>

                            {/* Boutons de navigation */}
                            <div className="flex items-center justify-between pt-2 border-t border-gray-100">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => moveToStage(dossier, 'previous')}
                                disabled={
                                  KANBAN_STAGES.findIndex(s => s.id === dossier.etape_kanban) === 0 ||
                                  movingDossier === dossier.id
                                }
                                className="p-1 h-6 w-6"
                              >
                                <ChevronLeftIcon className="h-3 w-3" />
                              </Button>
                              
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  window.location.href = `/projects/${dossier.id}`;
                                }}
                                className="text-xs px-2 py-1 h-6"
                              >
                                Ouvrir
                              </Button>
                              
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => moveToStage(dossier, 'next')}
                                disabled={
                                  KANBAN_STAGES.findIndex(s => s.id === dossier.etape_kanban) === KANBAN_STAGES.length - 1 ||
                                  movingDossier === dossier.id
                                }
                                className="p-1 h-6 w-6"
                              >
                                <ChevronRightIcon className="h-3 w-3" />
                              </Button>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))
                  )}
                </CardContent>
              </Card>
            </div>
          );
        })}
      </div>
    </div>
  );
}