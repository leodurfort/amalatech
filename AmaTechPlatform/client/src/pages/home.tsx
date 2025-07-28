import { useAuth } from "@/hooks/useAuth";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Building2, Calendar, TrendingUp, Users, LogOut } from "lucide-react";
import { Link } from "wouter";
import type { DossierWithStats } from "@shared/schema";

export default function Home() {
  const { user } = useAuth();
  
  const { data: mesDossiers = [], isLoading: loadingMesDossiers } = useQuery({
    queryKey: ["/api/dossiers", { membre: "true" }],
    enabled: !!user,
  });

  const { data: autresDossiers = [], isLoading: loadingAutresDossiers } = useQuery({
    queryKey: ["/api/dossiers", { membre: "false" }],
    enabled: !!user,
  });

  const userName = user ? `${user.firstName || ''} ${user.lastName || ''}`.trim() || user.email : '';

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <div className="bg-white dark:bg-gray-800 shadow-sm border-b">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">AmaTech</h1>
            <p className="text-gray-600 dark:text-gray-300">Bienvenue {userName}</p>
          </div>
          <Button 
            variant="outline" 
            onClick={() => window.location.href = '/api/logout'}
            className="flex items-center gap-2"
          >
            <LogOut className="w-4 h-4" />
            Se déconnecter
          </Button>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        {/* Stats Cards */}
        <div className="grid md:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Mes Dossiers</CardTitle>
              <Building2 className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{mesDossiers.length}</div>
              <p className="text-xs text-muted-foreground">
                Dossiers assignés
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Dossiers Actifs</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {mesDossiers.filter((d: DossierWithStats) => d.statut === 'ACTIF').length}
              </div>
              <p className="text-xs text-muted-foreground">
                En cours de traitement
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Sociétés</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {mesDossiers.reduce((acc: number, d: DossierWithStats) => acc + d.societes_count, 0)}
              </div>
              <p className="text-xs text-muted-foreground">
                Dans mes dossiers
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Interactions</CardTitle>
              <Calendar className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {mesDossiers.reduce((acc: number, d: DossierWithStats) => acc + d.interactions_count, 0)}
              </div>
              <p className="text-xs text-muted-foreground">
                Total cette semaine
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Dossiers Tabs */}
        <Tabs defaultValue="mes-dossiers" className="space-y-6">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="mes-dossiers">📂 Mes Dossiers</TabsTrigger>
            <TabsTrigger value="autres-mandats">📁 Autres Mandats</TabsTrigger>
          </TabsList>

          <TabsContent value="mes-dossiers" className="space-y-4">
            <div className="flex justify-between items-center">
              <h2 className="text-xl font-semibold">Mes Dossiers</h2>
              <p className="text-sm text-muted-foreground">{mesDossiers.length} dossiers</p>
            </div>
            
            {loadingMesDossiers ? (
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                {[...Array(3)].map((_, i) => (
                  <Card key={i} className="animate-pulse">
                    <CardHeader>
                      <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                      <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                    </CardHeader>
                    <CardContent>
                      <div className="h-3 bg-gray-200 rounded w-full mb-2"></div>
                      <div className="h-3 bg-gray-200 rounded w-2/3"></div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                {mesDossiers.map((dossier: DossierWithStats) => (
                  <Link key={dossier.id} href={`/dossiers/${dossier.id}`}>
                    <Card className="hover:shadow-md transition-shadow cursor-pointer">
                      <CardHeader>
                        <div className="flex justify-between items-start">
                          <CardTitle className="text-lg">{dossier.nom}</CardTitle>
                          <Badge variant={dossier.user_role === 'responsable' ? 'default' : 'secondary'}>
                            {dossier.user_role}
                          </Badge>
                        </div>
                        <CardDescription>{dossier.type}</CardDescription>
                      </CardHeader>
                      <CardContent>
                        <div className="flex justify-between text-sm text-muted-foreground mb-2">
                          <span>Statut: {dossier.statut}</span>
                          <Badge variant={dossier.statut === 'ACTIF' ? 'default' : 'secondary'}>
                            {dossier.statut}
                          </Badge>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span>{dossier.societes_count} sociétés</span>
                          <span>{dossier.interactions_count} interactions</span>
                        </div>
                      </CardContent>
                    </Card>
                  </Link>
                ))}
              </div>
            )}

            {!loadingMesDossiers && mesDossiers.length === 0 && (
              <Card>
                <CardContent className="py-8 text-center">
                  <Building2 className="w-12 h-12 mx-auto text-gray-400 mb-4" />
                  <p className="text-lg font-medium text-gray-600 mb-2">Aucun dossier assigné</p>
                  <p className="text-gray-500">Vous n'êtes assigné à aucun dossier pour le moment.</p>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="autres-mandats" className="space-y-4">
            <div className="flex justify-between items-center">
              <h2 className="text-xl font-semibold">Autres Mandats</h2>
              <p className="text-sm text-muted-foreground">{autresDossiers.length} dossiers</p>
            </div>
            
            {loadingAutresDossiers ? (
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                {[...Array(3)].map((_, i) => (
                  <Card key={i} className="animate-pulse">
                    <CardHeader>
                      <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                      <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                    </CardHeader>
                    <CardContent>
                      <div className="h-3 bg-gray-200 rounded w-full mb-2"></div>
                      <div className="h-3 bg-gray-200 rounded w-2/3"></div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                {autresDossiers.map((dossier: DossierWithStats) => (
                  <Link key={dossier.id} href={`/dossiers/${dossier.id}`}>
                    <Card className="hover:shadow-md transition-shadow cursor-pointer opacity-75">
                      <CardHeader>
                        <div className="flex justify-between items-start">
                          <CardTitle className="text-lg">{dossier.nom}</CardTitle>
                          <Badge variant="outline">Lecture</Badge>
                        </div>
                        <CardDescription>{dossier.type}</CardDescription>
                      </CardHeader>
                      <CardContent>
                        <div className="flex justify-between text-sm text-muted-foreground mb-2">
                          <span>Statut: {dossier.statut}</span>
                          <Badge variant={dossier.statut === 'ACTIF' ? 'default' : 'secondary'}>
                            {dossier.statut}
                          </Badge>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span>{dossier.societes_count} sociétés</span>
                          <span>{dossier.interactions_count} interactions</span>
                        </div>
                      </CardContent>
                    </Card>
                  </Link>
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}