import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
// useLocation retiré - navigation directe utilisée
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { FolderIcon, ActivityIcon, BellIcon, CalendarIcon, PlusIcon, BuildingIcon, TrendingUpIcon, UsersIcon } from "lucide-react";
import OutilsRapides from "@/components/OutilsRapides";
import NouveauProjetModal from "@/components/NouveauProjetModal";
import AdminMenu from "@/components/AdminMenu";
import ProjetModal from "@/components/ProjetModal";

interface DashboardStats {
  nb_dossiers_assignes: number;
  nb_dossiers_actifs: number;
  nb_relances_en_retard: number;
  nb_echeances_a_venir: number;
  dossiers_assignes: any[];
}

export default function Dashboard() {
  const { user, isLoading: authLoading } = useAuth();
  // Navigation directe pour éviter les conflits de routage
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [projetSelectionne, setProjetSelectionne] = useState<any>(null);
  const [modalMode, setModalMode] = useState<"edit" | "create">("create");

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setProjetSelectionne(null);
  };

  const handleEditClick = (projet: any) => {
    setProjetSelectionne(projet);
    setModalMode("edit");
    setIsModalOpen(true);
  };

  const handleCreateClick = () => {
    setProjetSelectionne(null);
    setModalMode("create");
    setIsModalOpen(true);
  };

  const { data: stats, isLoading: statsLoading } = useQuery({
    queryKey: ["/api/dashboard/stats"],
    enabled: !!user,
  });

  if (authLoading || statsLoading) {
    return (
      <div className="min-h-screen bg-[#f8fafc] flex items-center justify-center">
        <div className="text-gray-600">Chargement...</div>
      </div>
    );
  }

  const userDisplayName = (user as any)?.firstName && (user as any)?.lastName 
    ? `${(user as any).firstName} ${(user as any).lastName}`
    : (user as any)?.email?.split('@')[0] || 'Utilisateur';

  const userPoste = (user as any)?.poste || 'Collaborateur';

  return (
    <div className="min-h-screen bg-[#f8fafc]">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center gap-4">
              <img
                src="/assets/logo-amala-bleu.png"
                alt="Logo Amala Partners"
                className="h-8"
              />
              <h1 className="text-2xl font-bold text-[#0e355c]">AmaTech</h1>
            </div>
            <div className="text-right">
              <div className="text-lg font-semibold text-gray-900">{userDisplayName}</div>
              <div className="text-sm text-gray-600">{userPoste}</div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header Section - Dashboard comme source de vérité */}
        <div className="mb-8">
          <h2 className="text-3xl font-bold text-gray-900 mb-2">
            Dashboard M&A
          </h2>
          <p className="text-gray-600">Pilotage des mandats et suivi des opérations</p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Mes Dossiers</CardTitle>
              <FolderIcon className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{(stats as any)?.nb_dossiers_assignes || 0}</div>
              <p className="text-xs text-muted-foreground">
                Dossiers assignés
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Dossiers Actifs</CardTitle>
              <ActivityIcon className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{(stats as any)?.nb_dossiers_actifs || 0}</div>
              <p className="text-xs text-muted-foreground">
                En cours de traitement
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Relances à faire</CardTitle>
              <BellIcon className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-orange-600">{(stats as any)?.nb_relances_en_retard || 0}</div>
              <p className="text-xs text-muted-foreground">
                En retard
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Échéances à venir</CardTitle>
              <CalendarIcon className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-600">{(stats as any)?.nb_echeances_a_venir || 0}</div>
              <p className="text-xs text-muted-foreground">
                Prochains 7 jours
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Main Content Area */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Mes Dossiers */}
          <div className="lg:col-span-2">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span>Mes Dossiers</span>
                  {(stats as any)?.nb_dossiers_actifs > 0 && (
                    <Button size="sm" className="bg-[#0e355c] hover:bg-[#0a2a45]">
                      <PlusIcon className="h-4 w-4 mr-1" />
                      Nouvelle interaction
                    </Button>
                  )}
                </CardTitle>
              </CardHeader>
              <CardContent>
                {!(stats as any)?.dossiers_assignes || (stats as any).dossiers_assignes.length === 0 ? (
                  <div className="text-center py-8">
                    <FolderIcon className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">
                      Aucun dossier assigné pour le moment
                    </h3>
                    <p className="text-gray-600 max-w-md mx-auto">
                      Vous pouvez consulter l'onglet 'Autres Mandats' pour y accéder 
                      ou contacter votre équipe.
                    </p>
                    <Button 
                      variant="outline" 
                      className="mt-4"
                      onClick={() => window.location.href = '/dossiers'}
                    >
                      Voir tous les dossiers
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {(stats as any).dossiers_assignes.slice(0, 5).map((dossier: any) => {
                      const getTypeColor = (type: string) => {
                        switch (type) {
                          case "CESSION": return "bg-purple-100 text-purple-800 border-purple-200";
                          case "ACQUISITION": return "bg-orange-100 text-orange-800 border-orange-200";
                          case "LEVEE": return "bg-indigo-100 text-indigo-800 border-indigo-200";
                          default: return "bg-gray-100 text-gray-800 border-gray-200";
                        }
                      };

                      const getStatusColor = (statut: string) => {
                        switch (statut) {
                          case "ACTIF": return "bg-green-100 text-green-800 border-green-200";
                          case "Actif": return "bg-green-100 text-green-800 border-green-200"; // Handle both cases
                          case "CLOTURE": return "bg-blue-100 text-blue-800 border-blue-200";
                          case "Cloturé": return "bg-blue-100 text-blue-800 border-blue-200";
                          case "PERDU": return "bg-red-100 text-red-800 border-red-200";
                          case "Perdu": return "bg-red-100 text-red-800 border-red-200";
                          case "PAUSE": return "bg-yellow-100 text-yellow-800 border-yellow-200";
                          case "Pause": return "bg-yellow-100 text-yellow-800 border-yellow-200";
                          default: return "bg-gray-100 text-gray-800 border-gray-200";
                        }
                      };

                      const getEtapeColor = (etape: string) => {
                        switch (etape) {
                          case "PREPARATION": return "bg-gray-50 text-gray-700 border-gray-200";
                          case "PRE_MARKETING": return "bg-blue-50 text-blue-700 border-blue-200";
                          case "SCREENING": return "bg-indigo-50 text-indigo-700 border-indigo-200";
                          case "DEAL_MAKING": return "bg-purple-50 text-purple-700 border-purple-200";
                          case "ROADSHOW": return "bg-yellow-50 text-yellow-700 border-yellow-200";
                          case "PHASE_2": return "bg-orange-50 text-orange-700 border-orange-200";
                          case "EXCLUSIVITE": return "bg-red-50 text-red-700 border-red-200";
                          case "ROAD_TO_CLOSING": return "bg-green-50 text-green-700 border-green-200";
                          default: return "bg-gray-50 text-gray-700 border-gray-200";
                        }
                      };

                      const getEtapeLabel = (etape: string) => {
                        switch (etape) {
                          case "PREPARATION": return "Préparation";
                          case "PRE_MARKETING": return "Pre-marketing";
                          case "SCREENING": return "Screening";
                          case "DEAL_MAKING": return "Deal making";
                          case "ROADSHOW": return "Roadshow";
                          case "PHASE_2": return "Phase 2";
                          case "EXCLUSIVITE": return "Exclusivité";
                          case "ROAD_TO_CLOSING": return "Road to closing";
                          default: return etape;
                        }
                      };

                      const getStageProgress = (etape: string) => {
                        const stages = ["PREPARATION", "PRE_MARKETING", "SCREENING", "DEAL_MAKING", "ROADSHOW", "PHASE_2", "EXCLUSIVITE", "ROAD_TO_CLOSING"];
                        return stages.indexOf(etape) + 1;
                      };

                      return (
                        <Card 
                          key={dossier.id} 
                          className="hover:shadow-lg hover:scale-[1.01] transition-all duration-200 cursor-pointer border-l-4 border-l-[#0e355c]"
                          onClick={(e) => {
                            e.preventDefault();
                            window.location.href = `/projects/${dossier.id}`;
                          }}
                        >
                          <CardContent className="p-5">
                            <div className="flex items-start justify-between mb-3">
                              <div className="flex-1">
                                <div className="flex items-center gap-2 mb-2">
                                  {/* Status indicator dot - more visible */}
                                  <div className={`w-3 h-3 rounded-full ${
                                    dossier.statut === 'ACTIF' || dossier.statut === 'Actif' ? 'bg-green-500' :
                                    dossier.statut === 'CLOTURE' || dossier.statut === 'Cloturé' ? 'bg-blue-500' :
                                    dossier.statut === 'PAUSE' || dossier.statut === 'Pause' ? 'bg-yellow-500' :
                                    dossier.statut === 'PERDU' || dossier.statut === 'Perdu' ? 'bg-red-500' : 'bg-green-500'
                                  } ${dossier.statut === 'ACTIF' || dossier.statut === 'Actif' ? 'animate-pulse' : ''}`} />
                                  <h4 className="font-semibold text-gray-900 text-lg">
                                    {dossier.nom_code || dossier.nom_client || dossier.nom}
                                  </h4>
                                </div>
                                
                                <div className="flex items-center gap-2 mb-3">
                                  <Badge className={getTypeColor(dossier.type)}>
                                    {dossier.type}
                                  </Badge>
                                  {dossier.sous_type && (
                                    <Badge variant="outline" className="bg-gray-50 text-gray-700 border-gray-300">
                                      {dossier.sous_type}
                                    </Badge>
                                  )}
                                  <Badge className={getStatusColor(dossier.statut)}>
                                    {dossier.statut}
                                  </Badge>
                                  {dossier.etape_kanban && (
                                    <Badge variant="outline" className={getEtapeColor(dossier.etape_kanban)}>
                                      {getEtapeLabel(dossier.etape_kanban)}
                                    </Badge>
                                  )}
                                </div>
                                
                                {dossier.description && (
                                  <p className="text-sm text-gray-600 line-clamp-2 mb-3">
                                    {dossier.description}
                                  </p>
                                )}
                                
                                <div className="flex items-center gap-4 text-xs text-gray-500">
                                  <span className="flex items-center gap-1">
                                    <CalendarIcon className="h-3 w-3" />
                                    {dossier.date_debut_projet && !isNaN(new Date(dossier.date_debut_projet).getTime()) 
                                      ? new Date(dossier.date_debut_projet).toLocaleDateString('fr-FR')
                                      : (dossier.date_debut && !isNaN(new Date(dossier.date_debut).getTime()) 
                                          ? new Date(dossier.date_debut).toLocaleDateString('fr-FR')
                                          : 'Date manquante')}
                                  </span>
                                  <span className="flex items-center gap-1">
                                    <BuildingIcon className="h-3 w-3" />
                                    {dossier.societes_count || 0} société{(dossier.societes_count || 0) > 1 ? 's' : ''}
                                  </span>
                                  <span className="flex items-center gap-1">
                                    <TrendingUpIcon className="h-3 w-3" />
                                    {dossier.interactions_count || 0} interaction{(dossier.interactions_count || 0) > 1 ? 's' : ''}
                                  </span>
                                </div>
                              </div>
                              
                              <div className="flex items-center gap-2 ml-4">
                                <Button 
                                  variant="outline" 
                                  size="sm"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    window.location.href = `/projects/${dossier.id}`;
                                  }}
                                  className="bg-[#0e355c] text-white hover:bg-[#0a2a45] border-[#0e355c]"
                                >
                                  Ouvrir
                                </Button>

                                {/* Admin dropdown menu */}
                                {(user as any)?.poste === 'Admin' && (
                                  <AdminMenu dossier={dossier} onEdit={() => handleEditClick(dossier)} />
                                )}
                              </div>
                            </div>
                            
                            {/* Progress bar pour les dossiers actifs */}
                            {dossier.statut === 'ACTIF' && dossier.etape_kanban && (
                              <div className="mt-3 pt-3 border-t border-gray-100">
                                <div className="flex items-center justify-between text-xs text-gray-600 mb-1">
                                  <span>Progression M&A</span>
                                  <span>{Math.round((getStageProgress(dossier.etape_kanban) / 8) * 100)}%</span>
                                </div>
                                <div className="w-full bg-gray-200 rounded-full h-1.5">
                                  <div 
                                    className="bg-gradient-to-r from-[#0e355c] to-blue-400 h-1.5 rounded-full transition-all duration-300"
                                    style={{ width: `${(getStageProgress(dossier.etape_kanban) / 8) * 100}%` }}
                                  ></div>
                                </div>
                              </div>
                            )}
                          </CardContent>
                        </Card>
                      );
                    })}
                    {/* Affichage complet - plus de limite */}
                    {(stats as any).dossiers_assignes.length > 3 && (
                      <div className="text-center pt-4">
                        <p className="text-sm text-gray-500">
                          {(stats as any).dossiers_assignes.length} dossier{(stats as any).dossiers_assignes.length > 1 ? 's' : ''} au total
                        </p>
                      </div>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Actions Rapides - Dashboard source de vérité */}
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Actions M&A</CardTitle>
                <CardDescription>
                  Gestion des mandats et opérations
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <Button 
                  className="w-full justify-start bg-[#0e355c] hover:bg-[#0a2a45]"
                  onClick={handleCreateClick}
                >
                  <PlusIcon className="h-4 w-4 mr-2" />
                  Nouveau projet
                </Button>
                {/* Navigation simplifiée - tout depuis le dashboard */}
                <Button 
                  variant="outline" 
                  className="w-full justify-start"
                  onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
                >
                  <FolderIcon className="h-4 w-4 mr-2" />
                  Retour en haut
                </Button>
                <Button 
                  variant="outline" 
                  className="w-full justify-start"
                >
                  <CalendarIcon className="h-4 w-4 mr-2" />
                  Voir les échéances
                </Button>
              </CardContent>
            </Card>

            {/* Boîte à Outils */}
            <OutilsRapides />
          </div>
        </div>
      </div>

      {/* ProjetModal - completely controlled by parent state */}
      {isModalOpen && (
        <ProjetModal
          open={isModalOpen}
          projet={projetSelectionne}
          mode={modalMode}
          onClose={handleCloseModal}
        />
      )}
    </div>
  );
}