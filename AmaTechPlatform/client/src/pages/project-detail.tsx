import { useParams, useLocation } from "wouter";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { Loader2, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import ProjectHeader from "@/components/ProjectHeader";
import ProjectSidebar from "@/components/ProjectSidebar";
import Timeline from "@/components/Timeline";
import ToDoList from "@/components/ToDoList";
import { RoadshowTableSimple } from "@/components/RoadshowTableSimple";
import { WeeklySummary } from "@/components/WeeklySummary";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { useEffect } from "react";
import type { Dossier } from "@shared/schema";

export default function ProjectDetail() {
  const { id } = useParams<{ id: string }>();
  const [location, navigate] = useLocation();
  const { user, isLoading: authLoading, isAuthenticated } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState("timeline");

  // Redirect to login if not authenticated after auth loading is done
  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      toast({
        title: "Accès non autorisé",
        description: "Vous devez être connecté pour accéder à cette page.",
        variant: "destructive",
      });
      setTimeout(() => {
        window.location.href = "/api/login";
      }, 500);
      return;
    }
  }, [authLoading, isAuthenticated, toast]);

  // Attendre que l'authentification soit complète avant de charger les données
  if (authLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
          <p className="text-gray-600">Vérification des accès...</p>
        </div>
      </div>
    );
  }
  
  const { data: dossier, isLoading, error } = useQuery<Dossier>({
    queryKey: [`/api/dossiers/${id}`],
    retry: false, // Évite les retries qui peuvent causer le flash 404
    staleTime: 5 * 60 * 1000, // Cache pendant 5 minutes
    enabled: !authLoading && !!user, // Ne charge que si l'auth est complète
  });

  const { data: roadshowItems } = useQuery({
    queryKey: [`/api/projects/${id}/roadshow`],
    enabled: !authLoading && !!user,
  });

  const isAdmin = (user as any)?.role === "Admin";

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  if (error || (!dossier && !isLoading)) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Dossier non trouvé</h1>
          <p className="text-gray-600">Le dossier demandé n'existe pas ou vous n'y avez pas accès.</p>
          <Button 
            variant="outline" 
            className="mt-4"
            onClick={() => window.location.href = "/"}
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Retour au dashboard
          </Button>
        </div>
      </div>
    );
  }

  const handleEdit = () => {
    // TODO: Ouvrir le modal d'édition
    console.log("Edit dossier", dossier.id);
  };

  const renderTabContent = () => {
    switch (activeTab) {
      case "timeline":
        return <Timeline dossierId={dossier.id} />;

      case "todo":
        return <ToDoList dossierId={dossier.id} />;

      case "roadshow":
        const handleRoadshowTabChange = (tab: string) => {
          if (tab === 'summary') {
            // Force refetch des données pour le récapitulatif
            queryClient.invalidateQueries({ 
              queryKey: [`/api/projects/${dossier.id}/roadshow/summary`] 
            });
            queryClient.invalidateQueries({ 
              queryKey: [`/api/projects/${dossier.id}/roadshow-events`] 
            });
          }
        };

        return (
          <Tabs defaultValue="table" onValueChange={handleRoadshowTabChange} className="w-full">
            <div className="flex items-center justify-start mb-6">
              <TabsList className="h-8 p-1 bg-gray-100">
                <TabsTrigger value="table" className="text-xs px-3 py-1 h-6">Vue tableau</TabsTrigger>
                <TabsTrigger value="summary" className="text-xs px-3 py-1 h-6">Récapitulatif</TabsTrigger>
              </TabsList>
            </div>
            <TabsContent value="table">
              <RoadshowTableSimple projectId={dossier.id} />
            </TabsContent>
            <TabsContent value="summary">
              <WeeklySummary projectId={dossier.id} />
            </TabsContent>
          </Tabs>
        );

      case "documents":
        return (
          <div className="space-y-6">
            <h2 className="text-2xl font-bold text-gray-900">Documents & Toolbox</h2>
            <Card>
              <CardContent className="p-6">
                <p className="text-gray-600">
                  Contenu à venir : Bibliothèque de documents, templates, 
                  outils PDF et ressources pour le mandat.
                </p>
              </CardContent>
            </Card>
          </div>
        );

      case "journal":
        return (
          <div className="space-y-6">
            <h2 className="text-2xl font-bold text-gray-900">Journal de bord</h2>
            <Card>
              <CardContent className="p-6">
                <p className="text-gray-600">
                  Contenu à venir : Notes internes, observations stratégiques 
                  et réflexions de l'équipe sur l'évolution du dossier.
                </p>
              </CardContent>
            </Card>
          </div>
        );

      case "qa":
        return (
          <div className="space-y-6">
            <h2 className="text-2xl font-bold text-gray-900">Q&A</h2>
            <Card>
              <CardContent className="p-6">
                <p className="text-gray-600">
                  Contenu à venir : Questions/Réponses avec le client, 
                  clarifications techniques et échanges documentés.
                </p>
              </CardContent>
            </Card>
          </div>
        );

      case "working-group":
        return (
          <div className="space-y-6">
            <h2 className="text-2xl font-bold text-gray-900">Working Group List</h2>
            <Card>
              <CardContent className="p-6">
                <p className="text-gray-600">
                  Contenu à venir : Composition des équipes projet, 
                  coordonnées des intervenants externes et organisation.
                </p>
              </CardContent>
            </Card>
          </div>
        );

      case "economics":
        return (
          <div className="space-y-6">
            <h2 className="text-2xl font-bold text-gray-900">Synthèse économique</h2>
            <Card>
              <CardContent className="p-6">
                <p className="text-gray-600">
                  Contenu à venir : Conditions économiques du mandat, 
                  calcul des fees, retainer et success fee.
                </p>
                {dossier.has_retainer && (
                  <div className="mt-4 p-4 bg-blue-50 rounded-lg">
                    <p className="text-sm text-blue-800">
                      Retainer configuré : {dossier.retainer_montant?.toLocaleString('fr-FR')} €
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header fixe */}
      <ProjectHeader 
        dossier={dossier} 
        isAdmin={isAdmin}
        onEdit={handleEdit}
      />

      {/* Layout principal */}
      <div className="flex">
        {/* Sidebar navigation */}
        <ProjectSidebar 
          activeTab={activeTab}
          onTabChange={setActiveTab}
          isAdmin={isAdmin}
        />

        {/* Contenu principal */}
        <div className="flex-1 p-6">
          {/* Bouton retour */}
          <div className="mb-6">
            <Button 
              variant="ghost" 
              size="sm"
              onClick={() => window.location.href = "/"}
              className="text-gray-600 hover:text-gray-900"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Retour au dashboard
            </Button>
          </div>

          {/* Contenu de l'onglet actif */}
          {renderTabContent()}
        </div>
      </div>
    </div>
  );
}