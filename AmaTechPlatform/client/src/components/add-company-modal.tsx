import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const companyFormSchema = z.object({
  // Société
  nom: z.string().min(1, "Le nom de la société est requis"),
  secteur: z.string().optional(),
  site_web: z.string().url("URL invalide").optional().or(z.literal("")),
  description: z.string().optional(),
  est_acheteur: z.boolean().default(false),
  est_client: z.boolean().default(false),
  statut: z.string().default("non_contacte"),
  
  // Contact principal
  contact_nom_complet: z.string().min(1, "Le nom du contact est requis"),
  contact_poste: z.string().optional(),
  contact_email: z.string().email("Email invalide"),
  contact_telephone: z.string().optional(),
  contact_linkedin: z.string().url("URL LinkedIn invalide").optional().or(z.literal("")),
});

type CompanyFormData = z.infer<typeof companyFormSchema>;

const SECTEURS = [
  "Software",
  "Fintech",
  "Healthcare",
  "Manufacturing",
  "Retail",
  "Energy",
  "Real Estate",
  "Technology",
  "Telecommunications",
  "Automotive"
];

interface AddCompanyModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCompanyAdded: () => void;
  dossierId?: number | null;
}

export default function AddCompanyModal({ open, onOpenChange, onCompanyAdded, dossierId }: AddCompanyModalProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const form = useForm<CompanyFormData>({
    resolver: zodResolver(companyFormSchema),
    defaultValues: {
      nom: "",
      secteur: "",
      site_web: "",
      description: "",
      est_acheteur: false,
      est_client: false,
      statut: "non_contacte",
      contact_nom_complet: "",
      contact_poste: "",
      contact_email: "",
      contact_telephone: "",
      contact_linkedin: "",
    },
  });

  const createCompanyMutation = useMutation({
    mutationFn: async (data: CompanyFormData) => {
      // First, create the company
      const societeResponse = await apiRequest("POST", "/api/societes", {
        nom: data.nom,
        secteur: data.secteur,
        site_web: data.site_web,
        description: data.description,
        est_acheteur: data.est_acheteur,
        est_client: data.est_client,
        dossier_id: dossierId || 1, // Default to dossier 1 if not specified
      });

      const societe = await societeResponse.json();

      // Then create the contact
      const contactResponse = await apiRequest("POST", "/api/contacts", {
        nom_complet: data.contact_nom_complet,
        poste: data.contact_poste,
        email: data.contact_email,
        telephone: data.contact_telephone,
        linkedin: data.contact_linkedin,
        societe_id: societe.id,
      });

      const contact = await contactResponse.json();

      // Finally, create the roadshow item
      await apiRequest("POST", "/api/roadshow", {
        dossier_id: dossierId || 1, // Using the specified dossier
        societe_id: societe.id,
        contact_id: contact.id,
        statut: data.statut,
        notes_internes: "",
      });

      return { societe, contact };
    },
    onSuccess: () => {
      if (dossierId) {
        queryClient.invalidateQueries({ queryKey: [`/api/roadshow/${dossierId}`] });
      }
      queryClient.invalidateQueries({ queryKey: ["/api/societes"] });
      toast({
        title: "Société créée",
        description: "La société et le contact ont été ajoutés avec succès.",
      });
      form.reset();
      onCompanyAdded();
    },
    onError: (error: any) => {
      toast({
        title: "Erreur",
        description: error.message || "Impossible de créer la société.",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: CompanyFormData) => {
    createCompanyMutation.mutate(data);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Ajouter une Société</DialogTitle>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            {/* Company Information */}
            <div className="space-y-4">
              <h3 className="text-lg font-medium text-slate-800">Informations de la Société</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="nom"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Nom de la société *</FormLabel>
                      <FormControl>
                        <Input placeholder="Ex: InnovaTech SAS" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="secteur"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Secteur</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Sélectionner un secteur" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {SECTEURS.map(secteur => (
                            <SelectItem key={secteur} value={secteur}>
                              {secteur}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="site_web"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Site Web</FormLabel>
                      <FormControl>
                        <Input placeholder="https://example.com" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="statut"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Statut Initial</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="non_contacte">Non Contacté</SelectItem>
                          <SelectItem value="nda_envoye">NDA Envoyé</SelectItem>
                          <SelectItem value="nda_signe">NDA Signé</SelectItem>
                          <SelectItem value="ioi_recu">IOI Reçu</SelectItem>
                          <SelectItem value="abandonne">Abandonné</SelectItem>
                        </SelectContent>
                      </Select>
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
                    <FormLabel>Description</FormLabel>
                    <FormControl>
                      <Textarea 
                        placeholder="Description de l'activité de la société..."
                        rows={3}
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="est_acheteur"
                  render={({ field }) => (
                    <FormItem className="flex items-center space-x-3">
                      <FormControl>
                        <Checkbox
                          checked={field.value}
                          onCheckedChange={field.onChange}
                        />
                      </FormControl>
                      <FormLabel className="text-sm font-normal">
                        Acheteur potentiel
                      </FormLabel>
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="est_client"
                  render={({ field }) => (
                    <FormItem className="flex items-center space-x-3">
                      <FormControl>
                        <Checkbox
                          checked={field.value}
                          onCheckedChange={field.onChange}
                        />
                      </FormControl>
                      <FormLabel className="text-sm font-normal">
                        Client existant
                      </FormLabel>
                    </FormItem>
                  )}
                />
              </div>
            </div>

            {/* Contact Information */}
            <div className="space-y-4 border-t pt-6">
              <h3 className="text-lg font-medium text-slate-800">Contact Principal</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="contact_nom_complet"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Nom complet *</FormLabel>
                      <FormControl>
                        <Input placeholder="Prénom Nom" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="contact_poste"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Poste</FormLabel>
                      <FormControl>
                        <Input placeholder="Ex: CEO, CFO, Directeur M&A" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="contact_email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Email *</FormLabel>
                      <FormControl>
                        <Input placeholder="contact@exemple.fr" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="contact_telephone"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Téléphone</FormLabel>
                      <FormControl>
                        <Input placeholder="+33 1 23 45 67 89" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="contact_linkedin"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>LinkedIn</FormLabel>
                    <FormControl>
                      <Input placeholder="https://linkedin.com/in/profil" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Actions */}
            <div className="flex justify-end space-x-4 pt-6 border-t">
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                disabled={createCompanyMutation.isPending}
              >
                Annuler
              </Button>
              <Button
                type="submit"
                disabled={createCompanyMutation.isPending}
                className="bg-primary-500 hover:bg-primary-600"
              >
                {createCompanyMutation.isPending ? "Création..." : "Créer la Société"}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
