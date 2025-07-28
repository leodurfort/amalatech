import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { simpleStorage } from "./storage-simple";
import { setupAuth, isAuthenticated } from "./replitAuth";
import { 
  insertDossierSchema, insertSocieteSchema, insertContactSchema,
  insertInteractionSchema, insertRappelSchema, insertRoadshowItemSchema,
  insertTimelineEventSchema, insertTodoTaskSchema,
  insertRoadshowCounterpartySchema, insertRoadshowContactSchema,
  insertRoadshowEventSchema, insertRoadshowPhase2Schema
} from "@shared/schema";
import { z } from "zod";
import { db } from "./db";
import { eq, desc } from "drizzle-orm";

export async function registerRoutes(app: Express): Promise<Server> {
  // Auth middleware
  await setupAuth(app);

  // Auth routes
  app.get('/api/auth/user', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      res.json(user);
    } catch (error) {
      console.error("Error fetching user:", error);
      res.status(500).json({ message: "Failed to fetch user" });
    }
  });

  // Users endpoints
  app.get('/api/users', isAuthenticated, async (req, res) => {
    try {
      const users = await simpleStorage.getAllUsers();
      res.json(users);
    } catch (error) {
      console.error("Error fetching users:", error);
      res.status(500).json({ message: "Failed to fetch users" });
    }
  });

  // Dashboard stats route
  app.get("/api/dashboard/stats", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const stats = await storage.getDashboardStats(userId);
      res.json(stats);
    } catch (error) {
      console.error("Error fetching dashboard stats:", error);
      res.status(500).json({ message: "Erreur lors de la récupération des statistiques" });
    }
  });
  
  // Dossiers routes
  app.get("/api/dossiers", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user?.claims?.sub;
      const memberOnly = req.query.membre === 'true';
      
      const dossiers = await storage.getDossiers(memberOnly ? userId : undefined);
      
      // Filter based on memberOnly parameter
      const filteredDossiers = memberOnly 
        ? dossiers.filter(d => d.is_member)
        : dossiers;
      
      res.json(filteredDossiers);
    } catch (error) {
      console.error("Error fetching dossiers:", error);
      res.status(500).json({ message: "Erreur lors de la récupération des dossiers" });
    }
  });

  app.get("/api/dossiers/:id", isAuthenticated, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const dossier = await storage.getDossier(id);
      if (!dossier) {
        return res.status(404).json({ message: "Dossier non trouvé" });
      }
      res.json(dossier);
    } catch (error) {
      res.status(500).json({ message: "Erreur lors de la récupération du dossier" });
    }
  });

  app.post("/api/dossiers", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      console.log("Creating dossier with data:", req.body);
      
      // Convert date strings to Date objects before validation
      // Check admin protection for economic fields
      const user = await storage.getUser(userId);
      const economicFields = [
        'has_retainer', 'retainer_montant', 'has_flat_fee', 'flat_fee_montant',
        'success_fee_pourcentage', 'success_fee_base', 'accelerateurs', 
        'pipeline_ponderation', 'valeur_operation', 'valeur_operation_base'
      ];
      
      const hasEconomicFields = economicFields.some(field => req.body.hasOwnProperty(field));
      
      if (hasEconomicFields && user?.poste !== 'Admin') {
        return res.status(403).json({ 
          message: "Accès réservé aux administrateurs pour les conditions économiques" 
        });
      }
      
      const processedBody = {
        ...req.body,
        created_by: userId,
        etape_kanban: req.body.etape_kanban || "PREPARATION",
        date_debut: req.body.date_debut ? new Date(req.body.date_debut) : new Date(),
        date_signature: req.body.date_signature ? new Date(req.body.date_signature) : null,
        date_debut_projet: req.body.date_debut_projet ? new Date(req.body.date_debut_projet) : null
      };
      
      const validatedData = insertDossierSchema.parse(processedBody);
      
      console.log("Validated data:", validatedData);
      const dossier = await storage.createDossier(validatedData);
      console.log("Created dossier:", dossier);
      
      // Add creator as responsible member
      await storage.addDossierMember({
        utilisateur_id: userId,
        dossier_id: dossier.id,
        role: "responsable"
      });
      
      // Add team members from the form if provided
      if (req.body.equipe_interne && req.body.equipe_interne.length > 0) {
        for (const membreId of req.body.equipe_interne) {
          if (membreId !== userId) { // Don't add creator twice
            try {
              await storage.addDossierMember({
                utilisateur_id: membreId,
                dossier_id: dossier.id,
                role: "collaborateur"
              });
            } catch (memberError) {
              console.warn(`Failed to add member ${membreId}:`, memberError);
            }
          }
        }
      }
      
      // Also add admin user if different from creator (for testing)
      const adminUserId = "45179096";
      if (userId !== adminUserId && !req.body.equipe_interne?.includes(adminUserId)) {
        try {
          await storage.addDossierMember({
            utilisateur_id: adminUserId,
            dossier_id: dossier.id,
            role: "responsable"
          });
        } catch (adminError) {
          console.warn("Failed to add admin member:", adminError);
        }
      }
      
      res.status(201).json(dossier);
    } catch (error) {
      console.error("Error creating dossier:", error);
      if (error instanceof z.ZodError) {
        console.error("Validation errors:", error.errors);
        return res.status(400).json({ 
          message: "Données invalides", 
          errors: error.errors,
          details: error.errors.map(e => `${e.path.join('.')}: ${e.message}`).join(', ')
        });
      }
      res.status(500).json({ message: "Erreur lors de la création du dossier", error: (error as Error).message });
    }
  });

  app.put("/api/dossiers/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const validatedData = insertDossierSchema.partial().parse(req.body);
      const dossier = await storage.updateDossier(id, validatedData);
      if (!dossier) {
        return res.status(404).json({ message: "Dossier non trouvé" });
      }
      res.json(dossier);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Données invalides", errors: error.errors });
      }
      res.status(500).json({ message: "Erreur lors de la mise à jour du dossier" });
    }
  });

  // PATCH dossier (for partial updates like Kanban stage)
  app.patch("/api/dossiers/:id", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      
      // Check admin protection for economic fields
      const economicFields = [
        'has_retainer', 'retainer_montant', 'has_flat_fee', 'flat_fee_montant',
        'success_fee_pourcentage', 'success_fee_base', 'accelerateurs', 
        'pipeline_ponderation', 'valeur_operation', 'valeur_operation_base'
      ];
      
      const hasEconomicFields = economicFields.some(field => req.body.hasOwnProperty(field));
      
      if (hasEconomicFields && user?.poste !== 'Admin') {
        return res.status(403).json({ 
          message: "Accès réservé aux administrateurs pour les conditions économiques" 
        });
      }
      const id = parseInt(req.params.id);
      
      // Handle date fields properly
      const processedPatchBody = {
        ...req.body
      };
      
      if (req.body.date_signature) {
        processedPatchBody.date_signature = new Date(req.body.date_signature);
      }
      if (req.body.date_debut_projet) {
        processedPatchBody.date_debut_projet = new Date(req.body.date_debut_projet);
      }
      
      const validatedData = insertDossierSchema.partial().parse(processedPatchBody);
      const dossier = await storage.updateDossier(id, validatedData);
      if (!dossier) {
        return res.status(404).json({ message: "Dossier non trouvé" });
      }
      res.json(dossier);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Données invalides", errors: error.errors });
      }
      res.status(500).json({ message: "Erreur lors de la mise à jour du dossier" });
    }
  });

  // Update dossier status
  app.patch("/api/dossiers/:id/status", isAuthenticated, async (req: any, res) => {
    try {
      const id = parseInt(req.params.id);
      const { statut } = req.body;
      
      if (!statut) {
        return res.status(400).json({ message: "Statut requis" });
      }
      
      const dossier = await storage.updateDossier(id, { statut });
      if (!dossier) {
        return res.status(404).json({ message: "Dossier non trouvé" });
      }
      res.json(dossier);
    } catch (error) {
      console.error("Error updating dossier status:", error);
      res.status(500).json({ message: "Erreur lors de la mise à jour du statut" });
    }
  });

  app.delete("/api/dossiers/:id", isAuthenticated, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const deleted = await storage.deleteDossier(id);
      if (!deleted) {
        return res.status(404).json({ message: "Dossier non trouvé" });
      }
      res.json({ message: "Dossier supprimé avec succès" });
    } catch (error) {
      console.error("Error deleting dossier:", error);
      res.status(500).json({ message: "Erreur lors de la suppression du dossier" });
    }
  });

  // Sociétés routes
  app.get("/api/societes", async (req, res) => {
    try {
      const societes = await storage.getSocietes();
      res.json(societes);
    } catch (error) {
      res.status(500).json({ message: "Erreur lors de la récupération des sociétés" });
    }
  });

  app.get("/api/societes/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const societe = await storage.getSociete(id);
      if (!societe) {
        return res.status(404).json({ message: "Société non trouvée" });
      }
      res.json(societe);
    } catch (error) {
      res.status(500).json({ message: "Erreur lors de la récupération de la société" });
    }
  });

  app.post("/api/societes", async (req, res) => {
    try {
      const validatedData = insertSocieteSchema.parse(req.body);
      const societe = await storage.createSociete(validatedData);
      res.status(201).json(societe);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Données invalides", errors: error.errors });
      }
      res.status(500).json({ message: "Erreur lors de la création de la société" });
    }
  });

  app.put("/api/societes/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const validatedData = insertSocieteSchema.partial().parse(req.body);
      const societe = await storage.updateSociete(id, validatedData);
      if (!societe) {
        return res.status(404).json({ message: "Société non trouvée" });
      }
      res.json(societe);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Données invalides", errors: error.errors });
      }
      res.status(500).json({ message: "Erreur lors de la mise à jour de la société" });
    }
  });

  app.delete("/api/societes/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const deleted = await storage.deleteSociete(id);
      if (!deleted) {
        return res.status(404).json({ message: "Société non trouvée" });
      }
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ message: "Erreur lors de la suppression de la société" });
    }
  });

  // Contacts routes
  app.get("/api/contacts", async (req, res) => {
    try {
      const societeId = req.query.societe_id ? parseInt(req.query.societe_id as string) : null;
      const contacts = societeId 
        ? await storage.getContactsBySociete(societeId)
        : await storage.getContacts();
      res.json(contacts);
    } catch (error) {
      res.status(500).json({ message: "Erreur lors de la récupération des contacts" });
    }
  });

  app.get("/api/societes/:dossierId", async (req, res) => {
    try {
      const dossierId = parseInt(req.params.dossierId);
      const societes = await storage.getSocietesByDossier(dossierId);
      res.json(societes);
    } catch (error) {
      res.status(500).json({ message: "Erreur lors de la récupération des sociétés du dossier" });
    }
  });

  app.post("/api/contacts", async (req, res) => {
    try {
      const validatedData = insertContactSchema.parse(req.body);
      const contact = await storage.createContact(validatedData);
      res.status(201).json(contact);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Données invalides", errors: error.errors });
      }
      res.status(500).json({ message: "Erreur lors de la création du contact" });
    }
  });

  app.put("/api/contacts/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const validatedData = insertContactSchema.partial().parse(req.body);
      const contact = await storage.updateContact(id, validatedData);
      if (!contact) {
        return res.status(404).json({ message: "Contact non trouvé" });
      }
      res.json(contact);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Données invalides", errors: error.errors });
      }
      res.status(500).json({ message: "Erreur lors de la mise à jour du contact" });
    }
  });



  // Interactions routes
  app.get("/api/interactions", async (req, res) => {
    try {
      const dossierId = req.query.dossier_id ? parseInt(req.query.dossier_id as string) : null;
      const societeId = req.query.societe_id ? parseInt(req.query.societe_id as string) : null;
      
      let interactions;
      if (dossierId) {
        interactions = await storage.getInteractionsByDossier(dossierId);
      } else if (societeId) {
        interactions = await storage.getInteractionsBySociete(societeId);
      } else {
        interactions = await storage.getInteractions();
      }
      
      res.json(interactions);
    } catch (error) {
      res.status(500).json({ message: "Erreur lors de la récupération des interactions" });
    }
  });

  app.post("/api/interactions", async (req, res) => {
    try {
      const validatedData = insertInteractionSchema.parse(req.body);
      const interaction = await storage.createInteraction(validatedData);
      res.status(201).json(interaction);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Données invalides", errors: error.errors });
      }
      res.status(500).json({ message: "Erreur lors de la création de l'interaction" });
    }
  });

  // Rappels routes
  app.get("/api/rappels", async (req, res) => {
    try {
      const echus = req.query.echus === 'true';
      const rappels = echus 
        ? await storage.getRappelsEchus()
        : await storage.getRappels();
      res.json(rappels);
    } catch (error) {
      res.status(500).json({ message: "Erreur lors de la récupération des rappels" });
    }
  });

  app.post("/api/rappels", async (req, res) => {
    try {
      const validatedData = insertRappelSchema.parse(req.body);
      const rappel = await storage.createRappel(validatedData);
      res.status(201).json(rappel);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Données invalides", errors: error.errors });
      }
      res.status(500).json({ message: "Erreur lors de la création du rappel" });
    }
  });

  app.delete("/api/rappels/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const deleted = await storage.deleteRappel(id);
      if (!deleted) {
        return res.status(404).json({ message: "Rappel non trouvé" });
      }
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ message: "Erreur lors de la suppression du rappel" });
    }
  });

  // Roadshow items routes
  app.get("/api/roadshow/:dossierId", async (req, res) => {
    try {
      const dossierId = parseInt(req.params.dossierId);
      const items = await storage.getRoadshowItemsByDossier(dossierId);
      res.json(items);
    } catch (error) {
      res.status(500).json({ message: "Erreur lors de la récupération des éléments roadshow" });
    }
  });

  app.post("/api/roadshow", async (req, res) => {
    try {
      const validatedData = insertRoadshowItemSchema.parse(req.body);
      const item = await storage.createRoadshowItem(validatedData);
      res.status(201).json(item);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Données invalides", errors: error.errors });
      }
      res.status(500).json({ message: "Erreur lors de la création de l'élément roadshow" });
    }
  });

  app.put("/api/roadshow/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const validatedData = insertRoadshowItemSchema.partial().parse(req.body);
      const item = await storage.updateRoadshowItem(id, validatedData);
      if (!item) {
        return res.status(404).json({ message: "Élément roadshow non trouvé" });
      }
      res.json(item);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Données invalides", errors: error.errors });
      }
      res.status(500).json({ message: "Erreur lors de la mise à jour de l'élément roadshow" });
    }
  });

  // New Roadshow counterparty routes
  // Get roadshow contacts for a counterparty
  app.get('/api/roadshow-counterparty/:counterpartyId/contacts', isAuthenticated, async (req: any, res) => {
    try {
      const counterpartyId = parseInt(req.params.counterpartyId);
      console.log(`Fetching contacts for counterparty ${counterpartyId}`);
      const contacts = await simpleStorage.getRoadshowContacts(counterpartyId);
      res.json(contacts);
    } catch (error) {
      console.error("Error fetching roadshow contacts:", error);
      res.status(500).json({ message: "Failed to fetch roadshow contacts" });
    }
  });

  // Create a roadshow contact
  app.post('/api/roadshow-counterparty/:counterpartyId/contacts', isAuthenticated, async (req: any, res) => {
    try {
      const counterpartyId = parseInt(req.params.counterpartyId);
      const contactData = insertRoadshowContactSchema.parse(req.body);
      
      console.log(`Saving for counterpartyId: ${counterpartyId}`, contactData);
      
      const contact = await simpleStorage.createRoadshowContact({
        ...contactData,
        counterparty_id: counterpartyId
      });
      
      res.status(200).json({ 
        success: true, 
        message: "Contact créé",
        contact 
      });
    } catch (error) {
      console.error("Error creating roadshow contact:", error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Données invalides", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to create roadshow contact" });
    }
  });

  // Get roadshow events for a counterparty  
  app.get('/api/roadshow-counterparty/:counterpartyId/events', isAuthenticated, async (req: any, res) => {
    try {
      const counterpartyId = parseInt(req.params.counterpartyId);
      console.log(`Fetching events for counterparty ${counterpartyId}`);
      const events = await simpleStorage.getRoadshowEvents(counterpartyId);
      res.json(events);
    } catch (error) {
      console.error("Error fetching roadshow events:", error);
      res.status(500).json({ message: "Failed to fetch roadshow events" });
    }
  });

  // Create a roadshow event
  app.post('/api/roadshow-counterparty/:counterpartyId/events', isAuthenticated, async (req: any, res) => {
    try {
      const counterpartyId = parseInt(req.params.counterpartyId);
      const eventData = insertRoadshowEventSchema.parse(req.body);
      
      console.log(`Creating event for counterparty ${counterpartyId}:`, eventData);
      
      const event = await simpleStorage.createRoadshowEvent({
        ...eventData,
        counterparty_id: counterpartyId,
        created_by: req.user.claims.sub
      });
      
      res.status(201).json({ 
        success: true, 
        message: "Event saved",
        event 
      });
    } catch (error) {
      console.error("Error creating roadshow event:", error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Données invalides", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to create roadshow event" });
    }
  });

  // Get all roadshow events for a project
  app.get('/api/projects/:projectId/roadshow-events', isAuthenticated, async (req: any, res) => {
    try {
      const projectId = parseInt(req.params.projectId);
      console.log(`Fetching all events for project ${projectId}`);
      const events = await simpleStorage.getRoadshowEventsByProject(projectId);
      res.json(events);
    } catch (error) {
      console.error("Error fetching project roadshow events:", error);
      res.status(500).json({ message: "Failed to fetch project roadshow events" });
    }
  });

  // Delete roadshow event
  app.delete('/api/roadshow/events/:eventId', isAuthenticated, async (req: any, res) => {
    try {
      const eventId = parseInt(req.params.eventId);
      console.log(`Deleting roadshow event ${eventId}`);
      
      const deleted = await simpleStorage.deleteRoadshowEvent(eventId);
      if (!deleted) {
        return res.status(404).json({ message: "Event not found" });
      }
      
      res.json({ success: true, message: "Event deleted successfully" });
    } catch (error) {
      console.error("Error deleting roadshow event:", error);
      res.status(500).json({ message: "Failed to delete roadshow event" });
    }
  });

  // Delete roadshow contact
  app.delete('/api/roadshow/contacts/:contactId', isAuthenticated, async (req: any, res) => {
    try {
      const contactId = parseInt(req.params.contactId);
      console.log(`Deleting roadshow contact ${contactId}`);
      
      const deleted = await simpleStorage.deleteRoadshowContact(contactId);
      if (!deleted) {
        return res.status(404).json({ message: "Contact not found" });
      }
      
      res.json({ success: true, message: "Contact deleted successfully" });
    } catch (error) {
      console.error("Error deleting roadshow contact:", error);
      res.status(500).json({ message: "Failed to delete roadshow contact" });
    }
  });

  // Phase 2 toggle route
  app.post('/api/roadshow-counterparty/:counterpartyId/phase2', isAuthenticated, async (req: any, res) => {
    try {
      const counterpartyId = parseInt(req.params.counterpartyId);
      const { phase2_ok } = req.body;
      
      console.log(`Updating Phase 2 for counterparty ${counterpartyId}:`, { phase2_ok });
      
      const result = await simpleStorage.createOrUpdateRoadshowPhase2(counterpartyId, { phase2_ok });
      res.status(200).json({ success: true, result });
    } catch (error) {
      console.error("Error updating Phase 2:", error);
      res.status(500).json({ message: "Failed to update Phase 2" });
    }
  });

  // Users routes
  app.get('/api/users', isAuthenticated, async (req, res) => {
    try {
      const users = await storage.getAllUsers();
      res.json(users);
    } catch (error) {
      console.error("Error fetching users:", error);
      res.status(500).json({ message: "Failed to fetch users" });
    }
  });

  // Projects routes
  app.post('/api/projets', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user?.claims?.sub;
      const isAdmin = req.user?.claims?.role === 'admin';
      
      const projetData = {
        ...req.body,
        created_by: userId
      };
      
      // Only allow economic fields if user is admin
      if (!isAdmin) {
        delete projetData.has_retainer;
        delete projetData.retainer_montant;
        delete projetData.has_flat_fee;
        delete projetData.flat_fee_montant;
        delete projetData.success_fee_montant;
        delete projetData.success_fee_base;
        delete projetData.accelerateurs;
      }
      
      const newProjet = await storage.createDossier(projetData);
      
      // Add members to the project
      if (req.body.membres && Array.isArray(req.body.membres)) {
        for (const membreId of req.body.membres) {
          await storage.addDossierMembre({
            utilisateur_id: membreId,
            dossier_id: newProjet.id,
            role: membreId === userId ? 'responsable' : 'collaborateur'
          });
        }
      }
      
      res.json(newProjet);
    } catch (error) {
      console.error("Error creating project:", error);
      res.status(500).json({ message: "Failed to create project" });
    }
  });

  // Timeline Events routes
  app.get("/api/timeline/:dossierId", isAuthenticated, async (req, res) => {
    try {
      const dossierId = parseInt(req.params.dossierId);
      if (isNaN(dossierId)) {
        return res.status(400).json({ message: "ID dossier invalide" });
      }
      

      // Récupérer les événements timeline via le simple storage
      const events = await simpleStorage.getTimelineEventsByDossier(dossierId);
      res.json(events);
    } catch (error) {
      console.error("Error fetching timeline events:", error);
      res.status(500).json({ message: "Erreur lors de la récupération des événements de timeline" });
    }
  });

  app.post("/api/timeline", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const validatedData = insertTimelineEventSchema.parse({
        ...req.body,
        created_by: userId,
        date: new Date(req.body.date)
      });
      
      // Créer l'événement timeline via le simple storage
      const event = await simpleStorage.createTimelineEvent(validatedData);
      res.status(201).json(event);
    } catch (error) {
      console.error("Error creating timeline event:", error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Données invalides", errors: error.errors });
      }
      res.status(500).json({ message: "Erreur lors de la création de l'événement" });
    }
  });

  app.patch("/api/timeline/:id", isAuthenticated, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "ID événement invalide" });
      }
      
      const validatedData = insertTimelineEventSchema.partial().parse(req.body);
      // Mettre à jour l'événement timeline via le simple storage
      const event = await simpleStorage.updateTimelineEvent(id, validatedData);
      
      if (!event) {
        return res.status(404).json({ message: "Événement non trouvé" });
      }
      
      res.json(event);
    } catch (error) {
      console.error("Error updating timeline event:", error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Données invalides", errors: error.errors });
      }
      res.status(500).json({ message: "Erreur lors de la mise à jour de l'événement" });
    }
  });

  app.delete("/api/timeline/:id", isAuthenticated, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "ID événement invalide" });
      }
      
      // Supprimer l'événement timeline via le simple storage
      const deleted = await simpleStorage.deleteTimelineEvent(id);
      if (!deleted) {
        return res.status(404).json({ message: "Événement non trouvé" });
      }
      
      res.json({ message: "Événement supprimé avec succès" });
    } catch (error) {
      console.error("Error deleting timeline event:", error);
      res.status(500).json({ message: "Erreur lors de la suppression de l'événement" });
    }
  });

  // Todo Tasks routes
  // Get todo tasks for a dossier
  app.get("/api/todos/:dossierId", isAuthenticated, async (req, res) => {
    try {
      const dossierId = parseInt(req.params.dossierId);
      if (isNaN(dossierId)) {
        return res.status(400).json({ message: "ID dossier invalide" });
      }
      
      const tasks = await simpleStorage.getTodoTasks(dossierId);
      res.json(tasks);
    } catch (error) {
      console.error("Error fetching todo tasks:", error);
      res.status(500).json({ message: "Erreur lors de la récupération des tâches" });
    }
  });

  // Create todo task
  app.post("/api/todos", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const validatedData = insertTodoTaskSchema.parse({
        ...req.body,
        created_by: userId,
        due_date: req.body.due_date ? new Date(req.body.due_date) : null
      });
      
      const task = await simpleStorage.createTodoTask(validatedData);
      res.status(201).json(task);
    } catch (error) {
      console.error("Error creating todo task:", error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Données invalides", errors: error.errors });
      }
      res.status(500).json({ message: "Erreur lors de la création de la tâche" });
    }
  });

  // Update todo task
  app.patch("/api/todos/:id", isAuthenticated, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "ID tâche invalide" });
      }
      
      const validatedData = insertTodoTaskSchema.partial().parse({
        ...req.body,
        due_date: req.body.due_date ? new Date(req.body.due_date) : null
      });
      
      const task = await simpleStorage.updateTodoTask(id, validatedData);
      
      if (!task) {
        return res.status(404).json({ message: "Tâche non trouvée" });
      }
      
      res.json(task);
    } catch (error) {
      console.error("Error updating todo task:", error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Données invalides", errors: error.errors });
      }
      res.status(500).json({ message: "Erreur lors de la mise à jour de la tâche" });
    }
  });

  // Delete todo task
  app.delete("/api/todos/:id", isAuthenticated, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "ID tâche invalide" });
      }
      
      const deleted = await simpleStorage.deleteTodoTask(id);
      if (!deleted) {
        return res.status(404).json({ message: "Tâche non trouvée" });
      }
      
      res.json({ message: "Tâche supprimée avec succès" });
    } catch (error) {
      console.error("Error deleting todo task:", error);
      res.status(500).json({ message: "Erreur lors de la suppression de la tâche" });
    }
  });

  // Roadshow endpoints
  
  // Get roadshow counterparties for a project (with owners)
  app.get("/api/projects/:id/roadshow", isAuthenticated, async (req, res) => {
    try {
      const projectId = parseInt(req.params.id);
      if (isNaN(projectId)) {
        return res.status(400).json({ message: "ID projet invalide" });
      }
      
      const counterparties = await simpleStorage.getRoadshowCounterparties(projectId);
      
      // Get owners for each counterparty
      const counterpartiesWithOwners = await Promise.all(
        counterparties.map(async (counterparty) => {
          const ownerIds = await simpleStorage.getRoadshowOwners(counterparty.id);
          return { ...counterparty, ownerIds };
        })
      );
      
      res.json(counterpartiesWithOwners);
    } catch (error) {
      console.error("Error fetching roadshow counterparties:", error);
      res.status(500).json({ message: "Erreur lors de la récupération des contreparties" });
    }
  });

  // Create roadshow counterparty
  app.post("/api/projects/:id/roadshow", isAuthenticated, async (req: any, res) => {
    try {
      const projectId = parseInt(req.params.id);
      if (isNaN(projectId)) {
        return res.status(400).json({ message: "ID projet invalide" });
      }
      
      const validatedData = insertRoadshowCounterpartySchema.parse({
        ...req.body,
        project_id: projectId
      });
      
      const counterparty = await simpleStorage.createRoadshowCounterparty(validatedData);
      res.status(201).json(counterparty);
    } catch (error) {
      console.error("Error creating roadshow counterparty:", error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Données invalides", errors: error.errors });
      }
      res.status(500).json({ message: "Erreur lors de la création de la contrepartie" });
    }
  });

  // Update roadshow counterparty
  app.patch("/api/roadshow/:counterpartyId", isAuthenticated, async (req, res) => {
    try {
      const counterpartyId = parseInt(req.params.counterpartyId);
      if (isNaN(counterpartyId)) {
        return res.status(400).json({ message: "ID contrepartie invalide" });
      }
      
      const validatedData = insertRoadshowCounterpartySchema.partial().parse(req.body);
      const counterparty = await simpleStorage.updateRoadshowCounterparty(counterpartyId, validatedData);
      
      if (!counterparty) {
        return res.status(404).json({ message: "Contrepartie non trouvée" });
      }
      
      res.json(counterparty);
    } catch (error) {
      console.error("Error updating roadshow counterparty:", error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Données invalides", errors: error.errors });
      }
      res.status(500).json({ message: "Erreur lors de la mise à jour de la contrepartie" });
    }
  });

  // Update roadshow counterparty status with tracking
  app.post("/api/roadshow/:counterpartyId/status", isAuthenticated, async (req: any, res) => {
    try {
      const counterpartyId = parseInt(req.params.counterpartyId);
      const { newStatus } = req.body;
      const userId = req.user.claims.sub;

      // Normalize and validate status
      const validStatuses = {
        'live': 'Live',
        'waiting': 'Waiting',
        'nogo': 'No-go',
        'no-go': 'No-go'
      };

      const normalizedKey = newStatus.toLowerCase().replace(/\s+/g, '').replace('-', '');
      const formattedStatus = validStatuses[normalizedKey];

      if (!formattedStatus) {
        console.log(`Invalid status received: "${newStatus}" (normalized: "${normalizedKey}")`);
        return res.status(400).json({ error: 'Statut invalide' });
      }

      // Get current counterparty directly by ID - get all counterparties to find this one
      const allCounterparties = await simpleStorage.getAllRoadshowCounterparties();
      const currentCounterparty = allCounterparties.find(c => c.id === counterpartyId);
      
      if (!currentCounterparty) {
        console.log(`Counterparty not found: ID ${counterpartyId}. Available IDs: ${allCounterparties.map(c => c.id).join(', ')}`);
        return res.status(404).json({ error: 'Contrepartie non trouvée' });
      }

      const oldStatus = currentCounterparty.status;

      // Only create tracking event if status actually changed
      if (oldStatus !== formattedStatus) {
        // Update status in roadshow_counterparty
        await simpleStorage.updateRoadshowCounterparty(counterpartyId, { status: formattedStatus });

        // Create status change event for tracking
        await simpleStorage.createRoadshowEvent({
          counterparty_id: counterpartyId,
          type: 'status_change',
          label: `Changement de statut`,
          content: `Statut modifié de "${oldStatus}" vers "${formattedStatus}"`,
          event_date: new Date().toISOString().split('T')[0],
          meta: { newStatus: formattedStatus, oldStatus },
          created_by: userId
        });

        console.log(`Status changed for counterparty ${counterpartyId}: ${oldStatus} -> ${formattedStatus}`);
      }

      res.json({ success: true, message: `Statut mis à jour : ${formattedStatus}` });
    } catch (error) {
      console.error("Error updating status:", error);
      res.status(500).json({ message: "Failed to update status" });
    }
  });

  // Update roadshow owners (multi-assignment)
  app.patch("/api/roadshow/:counterpartyId/owners", isAuthenticated, async (req, res) => {
    try {
      const counterpartyId = parseInt(req.params.counterpartyId);
      if (isNaN(counterpartyId)) {
        return res.status(400).json({ message: "ID contrepartie invalide" });
      }
      
      const { ownerIds } = req.body;
      if (!Array.isArray(ownerIds)) {
        return res.status(400).json({ message: "ownerIds must be an array" });
      }

      await simpleStorage.updateRoadshowOwners(counterpartyId, ownerIds);
      
      res.json({ success: true, message: "Responsables mis à jour avec succès" });
    } catch (error) {
      console.error("Error updating roadshow owners:", error);
      res.status(500).json({ message: "Erreur lors de la mise à jour des responsables" });
    }
  });

  // Create roadshow contact
  app.post("/api/roadshow/:counterpartyId/contact", isAuthenticated, async (req, res) => {
    try {
      const counterpartyId = parseInt(req.params.counterpartyId);
      if (isNaN(counterpartyId)) {
        return res.status(400).json({ message: "ID contrepartie invalide" });
      }
      
      const validatedData = insertRoadshowContactSchema.parse({
        ...req.body,
        counterparty_id: counterpartyId
      });
      
      const contact = await simpleStorage.createRoadshowContact(validatedData);
      res.status(201).json(contact);
    } catch (error) {
      console.error("Error creating roadshow contact:", error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Données invalides", errors: error.errors });
      }
      res.status(500).json({ message: "Erreur lors de la création du contact" });
    }
  });

  // Create roadshow event
  app.post("/api/roadshow/:counterpartyId/event", isAuthenticated, async (req: any, res) => {
    try {
      const counterpartyId = parseInt(req.params.counterpartyId);
      if (isNaN(counterpartyId)) {
        return res.status(400).json({ message: "ID contrepartie invalide" });
      }
      
      const userId = req.user.claims.sub;
      const validatedData = insertRoadshowEventSchema.parse({
        ...req.body,
        counterparty_id: counterpartyId,
        created_by: userId,
        event_date: new Date(req.body.event_date)
      });
      
      const event = await simpleStorage.createRoadshowEvent(validatedData);
      res.status(201).json(event);
    } catch (error) {
      console.error("Error creating roadshow event:", error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Données invalides", errors: error.errors });
      }
      res.status(500).json({ message: "Erreur lors de la création de l'événement" });
    }
  });

  // Get roadshow events for a counterparty
  app.get("/api/roadshow/:counterpartyId/events", isAuthenticated, async (req, res) => {
    try {
      const counterpartyId = parseInt(req.params.counterpartyId);
      if (isNaN(counterpartyId)) {
        return res.status(400).json({ message: "ID contrepartie invalide" });
      }
      
      const events = await simpleStorage.getRoadshowEvents(counterpartyId);
      res.json(events);
    } catch (error) {
      console.error("Error fetching roadshow events:", error);
      res.status(500).json({ message: "Erreur lors de la récupération des événements" });
    }
  });

  // Get roadshow contacts for a counterparty
  app.get("/api/roadshow/:counterpartyId/contacts", isAuthenticated, async (req, res) => {
    try {
      const counterpartyId = parseInt(req.params.counterpartyId);
      if (isNaN(counterpartyId)) {
        return res.status(400).json({ message: "ID contrepartie invalide" });
      }
      
      const contacts = await simpleStorage.getRoadshowContacts(counterpartyId);
      res.json(contacts);
    } catch (error) {
      console.error("Error fetching roadshow contacts:", error);
      res.status(500).json({ message: "Erreur lors de la récupération des contacts" });
    }
  });

  // Get or create roadshow phase2 for a counterparty
  app.get("/api/roadshow/:counterpartyId/phase2", isAuthenticated, async (req, res) => {
    try {
      const counterpartyId = parseInt(req.params.counterpartyId);
      if (isNaN(counterpartyId)) {
        return res.status(400).json({ message: "ID contrepartie invalide" });
      }
      
      const phase2 = await simpleStorage.getRoadshowPhase2(counterpartyId);
      res.json(phase2 || { phase2_ok: false, dataroom_sent_at: null, binding_offer_at: null });
    } catch (error) {
      console.error("Error fetching roadshow phase2:", error);
      res.status(500).json({ message: "Erreur lors de la récupération des données Phase 2" });
    }
  });

  // Update roadshow phase2
  app.patch("/api/roadshow/:counterpartyId/phase2", isAuthenticated, async (req, res) => {
    try {
      const counterpartyId = parseInt(req.params.counterpartyId);
      if (isNaN(counterpartyId)) {
        return res.status(400).json({ message: "ID contrepartie invalide" });
      }
      
      const validatedData = insertRoadshowPhase2Schema.partial().parse(req.body);
      const phase2 = await simpleStorage.createOrUpdateRoadshowPhase2(counterpartyId, validatedData);
      res.json(phase2);
    } catch (error) {
      console.error("Error updating roadshow phase2:", error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Données invalides", errors: error.errors });
      }
      res.status(500).json({ message: "Erreur lors de la mise à jour des données Phase 2" });
    }
  });



  // Weekly roadshow summary endpoint
  app.get("/api/projects/:projectId/roadshow/summary", isAuthenticated, async (req, res) => {
    try {
      const projectId = parseInt(req.params.projectId);
      const week = parseInt(req.query.week as string);
      const year = parseInt(req.query.year as string);

      if (!week || !year) {
        return res.status(400).json({ error: 'Semaine et année requises' });
      }

      console.log(`Getting weekly summary for project ${projectId}, week ${week}/${year}`);

      // Calculate start and end dates for the ISO week
      const startOfYear = new Date(year, 0, 1);
      const startOfWeek = new Date(startOfYear.getTime() + (week - 1) * 7 * 24 * 60 * 60 * 1000);
      const endOfWeek = new Date(startOfWeek.getTime() + 6 * 24 * 60 * 60 * 1000);

      // Get all events for the project in the specified week
      const events = await simpleStorage.getRoadshowEventsByProjectAndDateRange(projectId, startOfWeek, endOfWeek);

      res.json({ events });
    } catch (error) {
      console.error("Error fetching roadshow summary:", error);
      res.status(500).json({ message: "Failed to fetch roadshow summary" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
