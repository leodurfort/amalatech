import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { CalendarIcon, XIcon, SaveIcon, PlusIcon, MinusIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { useToast } from "@/hooks/use-toast";
import { z } from "zod";
import TeamCombobox from "./TeamCombobox";
import EconomicConditionsCard from "./EconomicConditionsCard"; 
import { useAuth } from "@/hooks/useAuth";

interface ProjetModalProps {
  open: boolean;
  onClose: () => void;
  projet: any;
  mode: "edit" | "create";
}

const projetSchema = z.object({
  nom_client: z.string().min(1, "Nom du client requis"),
  nom_code: z.string().optional(),
  type: z.enum(["Sell-side", "Buy-side"]),
  description: z.string().optional(),
  mandat_signe: z.boolean(),
  date_signature: z.date().optional(),
  date_debut_projet: z.date({ required_error: "Date de début de projet requise" }),
  categories: z.array(z.string()),
  sous_type: z.string().optional(),
  statut: z.string(),
  equipe_membres: z.array(z.string()),
  // Admin-only fields - Economic conditions
  retainer: z.boolean(),
  retainer_amount: z.number().min(0),
  flat_fee: z.boolean(),
  flat_fee_amount: z.number().min(0),
  success_fee_pourcentage: z.number().min(0).max(100),
  success_fee_base: z.enum(["VE", "VT"]),
  success_fee_mode: z.enum(["simple", "progressive"]).default("simple"),
  tranches: z.array(z.object({
    min: z.number().nullable(),
    max: z.number().nullable(), 
    percent: z.number().min(0).max(100)
  })).max(5),
  pipeline_ponderation: z.number().min(0).max(100),
  valeur_operation: z.number().min(0),

});

type ProjetForm = z.infer<typeof projetSchema>;

export default function ProjetModal({ open, onClose, projet, mode }: ProjetModalProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { user } = useAuth();

  // Categories from the screenshots
  const categories = [
    "Conso & Distribution", "Education", "GP-Led Coinvestment", "GP-Led Fundraising", 
    "GP-Led Secondary", "GP-Stake", "Green Services", "Industrie de spécialité",
    "Santé", "Services B2B", "Services B2C & Loisirs", "Services Tech", "Software"
  ];

  // Sous-types
  const sousTypesSellSide = ["M&A", "LBO", "Dual-track", "Debt"];
  const sousTypesBuySide = ["M&A", "LBO", "Buy & Build", "Carve-out"];

  // This is used only for display, the actual TeamCombobox has its own extended list

  const getDefaultValues = (): ProjetForm => {
    if (mode === "edit" && projet) {
      return {
        nom_client: projet.nom_client || projet.nom || "",
        nom_code: projet.nom_code || "",
        type: projet.type === "CESSION" ? "Sell-side" : "Buy-side",
        description: projet.description || "",
        mandat_signe: projet.mandat_signe || false,
        date_signature: projet.date_signature ? new Date(projet.date_signature) : undefined,
        date_debut_projet: projet.date_debut_projet ? new Date(projet.date_debut_projet) : new Date(),
        categories: projet.categories || [],
        sous_type: projet.sous_type || "",
        statut: projet.statut || "Actif",
        equipe_membres: projet.equipe_interne || [],
        retainer: projet.has_retainer || false,
        retainer_amount: projet.retainer_montant || 0,
        flat_fee: projet.has_flat_fee || false,
        flat_fee_amount: projet.flat_fee_montant || 0,
        success_fee_mode: projet.success_fee_mode || "simple",
        success_fee_pourcentage: projet.success_fee_pourcentage || 0,
        success_fee_base: projet.success_fee_base || "VE",
        tranches: projet.tranches || [],
        pipeline_ponderation: projet.pipeline_ponderation || 100,
        valeur_operation: projet.valeur_operation || 0,
      };
    }
    return {
      nom_client: "",
      nom_code: "",
      type: "Sell-side",
      description: "",
      mandat_signe: false,
      date_signature: undefined,
      date_debut_projet: new Date(),
      categories: [],
      sous_type: "",
      statut: "Actif",
      equipe_membres: [],
      retainer: false,
      retainer_amount: 0,
      flat_fee: false,
      flat_fee_amount: 0,
      success_fee_mode: "simple",
      success_fee_pourcentage: 0,
      success_fee_base: "VE",
      tranches: [],
      pipeline_ponderation: 100,
      valeur_operation: 0,
    };
  };

  const form = useForm<ProjetForm>({
    resolver: zodResolver(projetSchema),
    defaultValues: getDefaultValues(),
  });

  // Reset form when projet changes
  useEffect(() => {
    if (open) {
      form.reset(getDefaultValues());
    }
  }, [open, projet, mode]);

  const updateProjetMutation = useMutation({
    mutationFn: async (data: ProjetForm) => {
      const apiData = {
        nom: data.nom_client,
        nom_client: data.nom_client,
        nom_code: data.nom_code || null,
        type: data.type === "Sell-side" ? "CESSION" : "ACQUISITION",
        statut: data.statut || "ACTIF",
        type_mandat: data.type === "Sell-side" ? "SELL_SIDE" : "BUY_SIDE",
        mandat_signe: data.mandat_signe || false,
        date_signature: data.date_signature ? new Date(data.date_signature) : null,
        categories: data.categories || [],
        sous_type: data.sous_type || null,
        description: data.description || null,
        equipe_interne: data.equipe_membres || [],
        has_retainer: data.retainer || false,
        retainer_montant: data.retainer_amount || null,
        has_flat_fee: data.flat_fee || false,
        flat_fee_montant: data.flat_fee_amount || null,
        success_fee_mode: data.success_fee_mode || "simple",
        success_fee_pourcentage: data.success_fee_pourcentage || null,
        success_fee_base: data.success_fee_base || null,
        tranches: data.tranches || [],
        pipeline_ponderation: data.pipeline_ponderation || 100,
        date_debut_projet: data.date_debut_projet ? new Date(data.date_debut_projet) : null,
        valeur_operation: data.valeur_operation || null,
      };
      
      const url = mode === "edit" ? `/api/dossiers/${projet.id}` : "/api/dossiers";
      const method = mode === "edit" ? "PATCH" : "POST";
      
      const response = await fetch(url, {
        method,
        body: JSON.stringify(apiData),
        headers: { "Content-Type": "application/json" },
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || `Erreur lors de ${mode === 'edit' ? 'la modification' : 'la création'} du projet`);
      }
      
      return response.json();
    },
    onSuccess: (newProjet: any) => {
      toast({
        title: mode === "edit" ? "Projet modifié avec succès" : "Projet créé avec succès",
        description: `Le projet "${newProjet.nom}" a été ${mode === 'edit' ? 'modifié' : 'créé'}.`,
      });
      queryClient.invalidateQueries({ queryKey: ["/api/dossiers"] });
      queryClient.invalidateQueries({ queryKey: ["/api/dashboard/stats"] });
      onClose();
    },
    onError: (error: any) => {
      toast({
        title: `Erreur lors de ${mode === 'edit' ? 'la modification' : 'la création'}`,
        description: error.message || "Une erreur est survenue",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: ProjetForm) => {
    updateProjetMutation.mutate(data);
  };

  const selectedCategories = form.watch("categories") || [];
  const watchedType = form.watch("type");

  // Don't render anything if not open
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50">
      {/* Backdrop */}
      <div className="fixed inset-0 bg-black/40 z-40" onClick={onClose} />
      
      {/* Modal Content */}
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div className="bg-white/95 backdrop-blur-md rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b">
            <div>
              <h2 className="text-2xl font-bold text-gray-900">
                {mode === "edit" ? "Modifier les informations du mandat" : "Nouveau projet"}
              </h2>
              <p className="text-sm text-gray-600 mt-1">
                {mode === "edit" ? "Modifiez les détails du projet M&A" : "Créez un nouveau mandat M&A"}
              </p>
            </div>
            <Button variant="ghost" size="sm" onClick={onClose} className="h-8 w-8 p-0">
              <XIcon className="h-4 w-4" />
            </Button>
          </div>

          {/* Form */}
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="p-6 space-y-6">
              {/* Basic Information */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="nom_client"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Nom du client *</FormLabel>
                      <FormControl>
                        <Input placeholder="Nom de l'entreprise" {...field} />
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
                      <FormLabel>Nom de code</FormLabel>
                      <FormControl>
                        <Input placeholder="Nom de code interne" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              {/* Type and Status */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="type"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Type de mandat *</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Sélectionner le type" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="Sell-side">Sell-side</SelectItem>
                          <SelectItem value="Buy-side">Buy-side</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="sous_type"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Sous-type</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Sélectionner le sous-type" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {(watchedType === "Sell-side" ? sousTypesSellSide : sousTypesBuySide).map((type) => (
                            <SelectItem key={type} value={type}>{type}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              {/* Date de début de projet */}
              <FormField
                control={form.control}
                name="date_debut_projet"
                render={({ field }) => (
                  <FormItem className="flex flex-col">
                    <FormLabel>Date de début de projet *</FormLabel>
                    <Popover>
                      <PopoverTrigger asChild>
                        <FormControl>
                          <Button
                            variant={"outline"}
                            className={cn(
                              "w-full pl-3 text-left font-normal",
                              !field.value && "text-muted-foreground"
                            )}
                          >
                            {field.value ? (
                              format(field.value, "PPP", { locale: fr })
                            ) : (
                              <span>Sélectionner une date</span>
                            )}
                            <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                          </Button>
                        </FormControl>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <Calendar
                          mode="single"
                          selected={field.value}
                          onSelect={field.onChange}
                          disabled={(date) =>
                            date > new Date() || date < new Date("1900-01-01")
                          }
                          initialFocus
                        />
                      </PopoverContent>
                    </Popover>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Description */}
              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Description</FormLabel>
                    <FormControl>
                      <Textarea 
                        placeholder="Description du projet..."
                        className="min-h-[100px]"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Categories */}
              <FormField
                control={form.control}
                name="categories"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Catégories</FormLabel>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-2 mt-2">
                      {categories.map((category) => (
                        <div key={category} className="flex items-center space-x-2">
                          <Checkbox
                            id={category}
                            checked={selectedCategories.includes(category)}
                            onCheckedChange={(checked) => {
                              if (checked) {
                                field.onChange([...selectedCategories, category]);
                              } else {
                                field.onChange(selectedCategories.filter(c => c !== category));
                              }
                            }}
                          />
                          <label htmlFor={category} className="text-sm">
                            {category}
                          </label>
                        </div>
                      ))}
                    </div>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Team Members - Modern Combobox */}
              <FormField
                control={form.control}
                name="equipe_membres"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Équipe interne</FormLabel>
                    <FormControl>
                      <TeamCombobox 
                        value={field.value || []}
                        onChange={field.onChange}
                        currentUserId={(user as any)?.id || ""}
                        placeholder="Sélectionner des membres de l'équipe..."
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Admin-only Economic Conditions Block */}
              {(user as any)?.poste === "Admin" && (
                <EconomicConditionsCard form={form} userRole={(user as any)?.poste} />
              )}

              {/* Footer */}
              <div className="flex justify-end space-x-3 pt-6 border-t">
                <Button type="button" variant="outline" onClick={onClose}>
                  Annuler
                </Button>
                <Button 
                  type="submit" 
                  disabled={updateProjetMutation.isPending}
                  className="bg-[#0e355c] hover:bg-[#0a2a45]"
                >
                  {updateProjetMutation.isPending ? (
                    "Enregistrement..."
                  ) : (
                    <>
                      <SaveIcon className="h-4 w-4 mr-2" />
                      {mode === "edit" ? "Mettre à jour" : "Créer le projet"}
                    </>
                  )}
                </Button>
              </div>
            </form>
          </Form>
        </div>
      </div>
    </div>
  );
}