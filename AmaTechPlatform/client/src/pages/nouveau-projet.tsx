import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { ArrowLeftIcon, SaveIcon, CheckIcon, BuildingIcon, DollarSignIcon, CalendarIcon, UsersIcon } from "lucide-react";
import { insertDossierSchema } from "@shared/schema";
import { z } from "zod";

// Extended form schema for projet creation
const nouveauProjetSchema = insertDossierSchema.extend({
  nom: z.string().min(2, "Le nom doit contenir au moins 2 caractères"),
  nom_client: z.string().min(2, "Le nom du client est requis"),
  type: z.enum(["CESSION", "ACQUISITION", "LEVEE"]),
  ca_annuel: z.number().optional(),
  ebitda: z.number().optional(),
  ratio_ebitda: z.number().optional(),
  equipe_membres: z.array(z.string()).optional(),
  mandat_signe: z.boolean().optional(),
  honoraires_fixes: z.number().optional(),
  taux_succes: z.number().optional(),
});

type NouveauProjetForm = z.infer<typeof nouveauProjetSchema>;

export default function NouveauProjet() {
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isSaving, setIsSaving] = useState(false);

  // Fetch users for team selection
  const { data: users = [] } = useQuery({
    queryKey: ["/api/users"],
  });

  const form = useForm<NouveauProjetForm>({
    resolver: zodResolver(nouveauProjetSchema),
    defaultValues: {
      nom: "",
      nom_client: "",
      nom_code: "",
      type: "CESSION",
      statut: "ACTIF",
      description: "",
      secteur_activite: "",
      ca_annuel: undefined,
      ebitda: undefined,
      ratio_ebitda: undefined,
      localisation: "",
      equipe_interne: [],
      equipe_membres: [],
      mandat_signe: false,
      honoraires_fixes: undefined,
      taux_succes: undefined,
      date_debut: new Date(),
    },
  });

  const createProjetMutation = useMutation({
    mutationFn: async (data: NouveauProjetForm) => {
      // Transform form data to match API expectations
      const apiData = {
        ...data,
        equipe_interne: data.equipe_membres || [],
        date_debut: data.date_debut || new Date(),
      };
      return apiRequest("/api/dossiers", {
        method: "POST",
        body: JSON.stringify(apiData),
        headers: { "Content-Type": "application/json" },
      });
    },
    onSuccess: (newDossier) => {
      toast({
        title: "Projet créé avec succès",
        description: `Le projet "${newDossier.nom}" a été créé.`,
      });
      queryClient.invalidateQueries({ queryKey: ["/api/dossiers"] });
      navigate("/dashboard");
    },
    onError: (error: any) => {
      toast({
        title: "Erreur lors de la création",
        description: error.message || "Une erreur est survenue",
        variant: "destructive",
      });
    },
  });

  const saveDraft = async () => {
    setIsSaving(true);
    // Auto-save logic could be implemented here
    setTimeout(() => {
      setIsSaving(false);
      toast({
        title: "Brouillon sauvegardé",
        description: "Vos modifications ont été sauvegardées automatiquement.",
      });
    }, 1000);
  };

  const onSubmit = (data: NouveauProjetForm) => {
    createProjetMutation.mutate(data);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 p-6">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center space-x-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate("/dashboard")}
              className="text-gray-600 hover:text-gray-900"
            >
              <ArrowLeftIcon className="h-4 w-4 mr-2" />
              Retour au tableau de bord
            </Button>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Nouveau projet</h1>
              <p className="text-gray-600 mt-1">Créer un nouveau mandat M&A</p>
            </div>
          </div>
          <div className="flex items-center space-x-3">
            <Button
              variant="outline"
              onClick={saveDraft}
              disabled={isSaving}
              className="flex items-center"
            >
              <SaveIcon className="h-4 w-4 mr-2" />
              {isSaving ? "Sauvegarde..." : "Sauver brouillon"}
            </Button>
          </div>
        </div>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
            {/* Informations générales */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <BuildingIcon className="h-5 w-5 mr-2 text-[#0e355c]" />
                  Informations générales
                </CardTitle>
                <CardDescription>
                  Informations de base sur le projet et le client
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <FormField
                    control={form.control}
                    name="nom"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Nom du projet *</FormLabel>
                        <FormControl>
                          <Input
                            placeholder="Ex: Cession TechCorp"
                            {...field}
                            className="bg-white"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="nom_client"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Nom du client *</FormLabel>
                        <FormControl>
                          <Input
                            placeholder="Ex: TechCorp SAS"
                            {...field}
                            className="bg-white"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="nom_code"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Nom de code (optionnel)</FormLabel>
                        <FormControl>
                          <Input
                            placeholder="Ex: Projet Alpha"
                            {...field}
                            className="bg-white"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="type"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Type de mandat *</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger className="bg-white">
                              <SelectValue placeholder="Sélectionner un type" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="CESSION">Cession</SelectItem>
                            <SelectItem value="ACQUISITION">Acquisition</SelectItem>
                            <SelectItem value="LEVEE">Levée de fonds</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="secteur_activite"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Secteur d'activité</FormLabel>
                        <FormControl>
                          <Input
                            placeholder="Ex: Technologies, Santé, Industrie"
                            {...field}
                            className="bg-white"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="localisation"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Localisation</FormLabel>
                        <FormControl>
                          <Input
                            placeholder="Ex: Paris, Lyon, International"
                            {...field}
                            className="bg-white"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={form.control}
                  name="description"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Description du projet</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="Description détaillée du mandat, contexte, objectifs..."
                          className="min-h-[100px] bg-white"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </CardContent>
            </Card>

            {/* Données économiques */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <DollarSignIcon className="h-5 w-5 mr-2 text-[#0e355c]" />
                  Données économiques
                </CardTitle>
                <CardDescription>
                  Informations financières sur l'entreprise cliente
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <FormField
                    control={form.control}
                    name="ca_annuel"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>CA annuel (M€)</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            step="0.1"
                            placeholder="Ex: 15.5"
                            {...field}
                            onChange={(e) => field.onChange(e.target.value ? parseFloat(e.target.value) : undefined)}
                            className="bg-white"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="ebitda"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>EBITDA (M€)</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            step="0.1"
                            placeholder="Ex: 2.3"
                            {...field}
                            onChange={(e) => field.onChange(e.target.value ? parseFloat(e.target.value) : undefined)}
                            className="bg-white"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="ratio_ebitda"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Ratio EBITDA (%)</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            step="0.1"
                            placeholder="Ex: 14.8"
                            {...field}
                            onChange={(e) => field.onChange(e.target.value ? parseFloat(e.target.value) : undefined)}
                            className="bg-white"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </CardContent>
            </Card>

            {/* Structure d'honoraires */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <CheckIcon className="h-5 w-5 mr-2 text-[#0e355c]" />
                  Structure d'honoraires
                </CardTitle>
                <CardDescription>
                  Conditions financières du mandat
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <FormField
                  control={form.control}
                  name="mandat_signe"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                      <FormControl>
                        <Checkbox
                          checked={field.value}
                          onCheckedChange={field.onChange}
                        />
                      </FormControl>
                      <div className="space-y-1 leading-none">
                        <FormLabel>Mandat signé</FormLabel>
                        <p className="text-sm text-muted-foreground">
                          Cochez si le mandat est déjà signé avec le client
                        </p>
                      </div>
                    </FormItem>
                  )}
                />

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <FormField
                    control={form.control}
                    name="honoraires_fixes"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Honoraires fixes (€)</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            placeholder="Ex: 50000"
                            {...field}
                            onChange={(e) => field.onChange(e.target.value ? parseFloat(e.target.value) : undefined)}
                            className="bg-white"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="taux_succes"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Taux de succès (%)</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            step="0.1"
                            placeholder="Ex: 2.5"
                            {...field}
                            onChange={(e) => field.onChange(e.target.value ? parseFloat(e.target.value) : undefined)}
                            className="bg-white"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </CardContent>
            </Card>

            {/* Équipe projet */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <UsersIcon className="h-5 w-5 mr-2 text-[#0e355c]" />
                  Équipe projet
                </CardTitle>
                <CardDescription>
                  Sélectionner les membres de l'équipe interne
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <FormField
                  control={form.control}
                  name="equipe_membres"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Membres de l'équipe</FormLabel>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {users.map((user: any) => (
                          <div key={user.id} className="flex items-center space-x-3">
                            <Checkbox
                              checked={field.value?.includes(user.id) || false}
                              onCheckedChange={(checked) => {
                                const currentValue = field.value || [];
                                if (checked) {
                                  field.onChange([...currentValue, user.id]);
                                } else {
                                  field.onChange(currentValue.filter(id => id !== user.id));
                                }
                              }}
                            />
                            <div className="flex items-center space-x-2">
                              {user.profileImageUrl && (
                                <img
                                  src={user.profileImageUrl}
                                  alt={`${user.firstName} ${user.lastName}`}
                                  className="w-6 h-6 rounded-full object-cover"
                                />
                              )}
                              <span className="text-sm">
                                {user.firstName} {user.lastName}
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </CardContent>
            </Card>

            <Separator />

            {/* Actions */}
            <div className="flex items-center justify-between pt-6">
              <Button
                type="button"
                variant="outline"
                onClick={() => navigate("/dashboard")}
              >
                Annuler
              </Button>
              <Button
                type="submit"
                disabled={createProjetMutation.isPending}
                className="bg-[#0e355c] hover:bg-[#0a2a45]"
              >
                {createProjetMutation.isPending ? "Création..." : "Créer le projet"}
              </Button>
            </div>
          </form>
        </Form>
      </div>
    </div>
  );
}