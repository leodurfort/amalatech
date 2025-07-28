import { 
  type Dossier, type InsertDossier, type DossierWithStats,
  type Societe, type InsertSociete, type SocieteWithContact,
  type Contact, type InsertContact,
  type Interaction, type InsertInteraction,
  type Rappel, type InsertRappel,
  type RoadshowItem, type InsertRoadshowItem,
  type RoadshowItemWithDetails,
  type User, type UpsertUser,
  type DossierMembre, type InsertDossierMembre,
  type TimelineEvent, type InsertTimelineEvent,
  type TodoTask, type InsertTodoTask,
  dossiers, societes, contacts, interactions, rappels, roadshow_items,
  users, dossier_membres, timeline_events, todo_tasks
} from "@shared/schema";
import { db } from "./db";
import { eq, count, desc, max, and, or, sql } from "drizzle-orm";

export interface IStorage {
  // Users
  getUser(id: string): Promise<User | undefined>;
  upsertUser(user: UpsertUser): Promise<User>;
  getAllUsers(): Promise<User[]>;
  
  // Dashboard
  getDashboardStats(userId: string): Promise<any>;
  
  // Dossier Members
  getDossierMembers(dossierId: number): Promise<DossierMembre[]>;
  addDossierMember(member: InsertDossierMembre): Promise<DossierMembre>;
  addDossierMembre(member: InsertDossierMembre): Promise<DossierMembre>; // Alias for French method name
  updateDossierMemberRole(dossierId: number, userId: string, role: string): Promise<DossierMembre | undefined>;
  removeDossierMember(dossierId: number, userId: string): Promise<boolean>;
  
  // Dossiers
  getDossiers(userId?: string): Promise<DossierWithStats[]>;
  getDossier(id: number): Promise<Dossier | undefined>;
  createDossier(dossier: InsertDossier): Promise<Dossier>;
  updateDossier(id: number, dossier: Partial<InsertDossier>): Promise<Dossier | undefined>;
  deleteDossier(id: number): Promise<boolean>;

  // Sociétés
  getSocietes(): Promise<Societe[]>;
  getSocietesByDossier(dossierId: number): Promise<Societe[]>;
  getSociete(id: number): Promise<Societe | undefined>;
  createSociete(societe: InsertSociete): Promise<Societe>;
  updateSociete(id: number, societe: Partial<InsertSociete>): Promise<Societe | undefined>;
  deleteSociete(id: number): Promise<boolean>;

  // Contacts
  getContacts(): Promise<Contact[]>;
  getContact(id: number): Promise<Contact | undefined>;
  getContactsBySociete(societeId: number): Promise<Contact[]>;
  createContact(contact: InsertContact): Promise<Contact>;
  updateContact(id: number, contact: Partial<InsertContact>): Promise<Contact | undefined>;
  deleteContact(id: number): Promise<boolean>;

  // Interactions
  getInteractions(): Promise<Interaction[]>;
  getInteractionsByDossier(dossierId: number): Promise<Interaction[]>;
  getInteractionsBySociete(societeId: number): Promise<Interaction[]>;
  createInteraction(interaction: InsertInteraction): Promise<Interaction>;
  updateInteraction(id: number, interaction: Partial<InsertInteraction>): Promise<Interaction | undefined>;

  // Rappels
  getRappels(): Promise<Rappel[]>;
  getRappelsByDossier(dossierId: number): Promise<Rappel[]>;
  getRappelsEchus(): Promise<Rappel[]>;
  createRappel(rappel: InsertRappel): Promise<Rappel>;
  updateRappel(id: number, rappel: Partial<InsertRappel>): Promise<Rappel | undefined>;
  deleteRappel(id: number): Promise<boolean>;

  // Roadshow Items
  getRoadshowItems(): Promise<RoadshowItem[]>;
  getRoadshowItemsByDossier(dossierId: number): Promise<RoadshowItemWithDetails[]>;
  createRoadshowItem(item: InsertRoadshowItem): Promise<RoadshowItem>;
  updateRoadshowItem(id: number, item: Partial<InsertRoadshowItem>): Promise<RoadshowItem | undefined>;
  deleteRoadshowItem(id: number): Promise<boolean>;

  // Timeline Events
  getTimelineEventsByDossier(dossierId: number): Promise<TimelineEvent[]>;
  createTimelineEvent(event: InsertTimelineEvent): Promise<TimelineEvent>;
  updateTimelineEvent(id: number, event: Partial<InsertTimelineEvent>): Promise<TimelineEvent | undefined>;
  deleteTimelineEvent(id: number): Promise<boolean>;

  // Todo Tasks
  getTodoTasks(dossierId: number): Promise<TodoTask[]>;
  createTodoTask(task: InsertTodoTask): Promise<TodoTask>;
  updateTodoTask(id: number, task: Partial<InsertTodoTask>): Promise<TodoTask | undefined>;
  deleteTodoTask(id: number): Promise<boolean>;
}

export class DatabaseStorage implements IStorage {
  // Users
  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user || undefined;
  }

  async upsertUser(userData: UpsertUser): Promise<User> {
    const [user] = await db
      .insert(users)
      .values(userData)
      .onConflictDoUpdate({
        target: users.id,
        set: {
          ...userData,
          updatedAt: new Date(),
        },
      })
      .returning();
    return user;
  }

  // Dashboard
  async getDashboardStats(userId: string): Promise<any> {
    // Get user's assigned dossiers
    const userDossiers = await db
      .select({
        id: dossiers.id,
        nom: dossiers.nom,
        nom_client: dossiers.nom_client,
        nom_code: dossiers.nom_code,
        type: dossiers.type,
        type_mandat: dossiers.type_mandat,
        statut: dossiers.statut,
        etape_kanban: dossiers.etape_kanban,
        sous_type: dossiers.sous_type,
        categories: dossiers.categories,
        date_debut: dossiers.date_debut,
        date_debut_projet: dossiers.date_debut_projet,
        date_signature: dossiers.date_signature,
        mandat_signe: dossiers.mandat_signe,
        description: dossiers.description,
        equipe_interne: dossiers.equipe_interne,
        // Champs économiques essentiels
        has_retainer: dossiers.has_retainer,
        retainer_montant: dossiers.retainer_montant,
        has_flat_fee: dossiers.has_flat_fee,
        flat_fee_montant: dossiers.flat_fee_montant,
        success_fee_mode: dossiers.success_fee_mode,
        success_fee_pourcentage: dossiers.success_fee_pourcentage,
        success_fee_base: dossiers.success_fee_base,
        tranches: dossiers.tranches,
        pipeline_ponderation: dossiers.pipeline_ponderation,
        valeur_operation: dossiers.valeur_operation,
        societes_count: sql<number>`COALESCE(COUNT(DISTINCT ${societes.id}), 0)`,
        interactions_count: sql<number>`COALESCE(COUNT(DISTINCT ${interactions.id}), 0)`
      })
      .from(dossiers)
      .innerJoin(dossier_membres, eq(dossiers.id, dossier_membres.dossier_id))
      .leftJoin(societes, eq(societes.dossier_id, dossiers.id))
      .leftJoin(interactions, eq(interactions.dossier_id, dossiers.id))
      .where(eq(dossier_membres.utilisateur_id, userId))
      .groupBy(dossiers.id)
      .orderBy(desc(dossiers.created_at));

    const nb_dossiers_assignes = userDossiers.length;
    const nb_dossiers_actifs = userDossiers.filter(d => d.statut === 'ACTIF').length;

    // For now, return mock data for relances and echéances
    // These will be implemented when we have more data
    const nb_relances_en_retard = 0;
    const nb_echeances_a_venir = 0;

    return {
      nb_dossiers_assignes,
      nb_dossiers_actifs,
      nb_relances_en_retard,
      nb_echeances_a_venir,
      dossiers_assignes: userDossiers,
    };
  }

  // Dossier Members
  async getDossierMembers(dossierId: number): Promise<DossierMembre[]> {
    return await db
      .select()
      .from(dossier_membres)
      .where(eq(dossier_membres.dossier_id, dossierId));
  }

  async addDossierMember(member: InsertDossierMembre): Promise<DossierMembre> {
    const [newMember] = await db
      .insert(dossier_membres)
      .values(member)
      .returning();
    return newMember;
  }

  // Alias for French method name
  async addDossierMembre(member: InsertDossierMembre): Promise<DossierMembre> {
    return this.addDossierMember(member);
  }

  async getAllUsers(): Promise<User[]> {
    return await db.select().from(users);
  }

  async updateDossierMemberRole(dossierId: number, userId: string, role: string): Promise<DossierMembre | undefined> {
    const [updated] = await db
      .update(dossier_membres)
      .set({ role })
      .where(and(
        eq(dossier_membres.dossier_id, dossierId),
        eq(dossier_membres.utilisateur_id, userId)
      ))
      .returning();
    return updated || undefined;
  }

  async removeDossierMember(dossierId: number, userId: string): Promise<boolean> {
    const result = await db
      .delete(dossier_membres)
      .where(and(
        eq(dossier_membres.dossier_id, dossierId),
        eq(dossier_membres.utilisateur_id, userId)
      ));
    return (result.rowCount || 0) > 0;
  }

  // Dossiers
  async getDossiers(userId?: string): Promise<DossierWithStats[]> {
    // First get basic dossiers data with stats
    const dossiersBase = await db
      .select({
        id: dossiers.id,
        nom: dossiers.nom,
        nom_client: dossiers.nom_client,
        nom_code: dossiers.nom_code,
        type: dossiers.type,
        statut: dossiers.statut,
        etape_kanban: dossiers.etape_kanban,
        sous_type: dossiers.sous_type,
        categories: dossiers.categories,
        date_debut: dossiers.date_debut,
        date_debut_projet: dossiers.date_debut_projet,
        date_cloture: dossiers.date_cloture,
        client_id: dossiers.client_id,
        description: dossiers.description,
        equipe_interne: dossiers.equipe_interne,
        created_by: dossiers.created_by,
        created_at: dossiers.created_at,
        updated_at: dossiers.updated_at,
        societes_count: count(societes.id),
        interactions_count: count(interactions.id),
        last_activity: max(interactions.date)
      })
      .from(dossiers)
      .leftJoin(societes, eq(societes.dossier_id, dossiers.id))
      .leftJoin(interactions, eq(interactions.dossier_id, dossiers.id))
      .groupBy(dossiers.id)
      .orderBy(desc(dossiers.created_at));

    // Then add membership info if userId is provided
    const result: DossierWithStats[] = [];
    for (const dossier of dossiersBase) {
      let userRole: string | undefined;
      let isMember = false;

      if (userId) {
        const membership = await db
          .select()
          .from(dossier_membres)
          .where(and(
            eq(dossier_membres.dossier_id, dossier.id),
            eq(dossier_membres.utilisateur_id, userId)
          ))
          .limit(1);
        
        if (membership.length > 0) {
          userRole = membership[0].role;
          isMember = true;
        }
      }

      result.push({
        ...dossier,
        societes_count: Number(dossier.societes_count),
        interactions_count: Number(dossier.interactions_count),
        last_activity: dossier.last_activity || undefined,
        user_role: userRole,
        is_member: isMember
      });
    }

    return result;
  }

  async getDossier(id: number): Promise<Dossier | undefined> {
    const [dossier] = await db.select().from(dossiers).where(eq(dossiers.id, id));
    return dossier || undefined;
  }

  async createDossier(insertDossier: InsertDossier): Promise<Dossier> {
    const [dossier] = await db
      .insert(dossiers)
      .values({
        // Informations de base
        nom: insertDossier.nom,
        nom_client: insertDossier.nom_client,
        nom_code: insertDossier.nom_code,
        type: insertDossier.type,
        statut: insertDossier.statut,
        etape_kanban: insertDossier.etape_kanban || 'PREPARATION',
        
        // Dates
        date_debut: insertDossier.date_debut || new Date(),
        date_cloture: insertDossier.date_cloture,
        date_debut_projet: insertDossier.date_debut_projet,
        
        // Mandat
        mandat_signe: insertDossier.mandat_signe || false,
        date_signature: insertDossier.date_signature,
        type_mandat: insertDossier.type_mandat,
        
        // Classification
        categories: insertDossier.categories,
        sous_type: insertDossier.sous_type,
        
        // Conditions économiques
        has_retainer: insertDossier.has_retainer || false,
        retainer_montant: insertDossier.retainer_montant,
        has_flat_fee: insertDossier.has_flat_fee || false,
        flat_fee_montant: insertDossier.flat_fee_montant,
        success_fee_pourcentage: insertDossier.success_fee_pourcentage,
        success_fee_base: insertDossier.success_fee_base,
        success_fee_mode: insertDossier.success_fee_mode || 'simple',
        tranches: insertDossier.tranches,
        pipeline_ponderation: insertDossier.pipeline_ponderation || 100,
        valeur_operation: insertDossier.valeur_operation,
        
        // Métadonnées
        client_id: insertDossier.client_id,
        description: insertDossier.description,
        equipe_interne: insertDossier.equipe_interne,
        created_by: insertDossier.created_by
      })
      .returning();
    return dossier;
  }

  async updateDossier(id: number, updates: Partial<InsertDossier>): Promise<Dossier | undefined> {
    const [updated] = await db
      .update(dossiers)
      .set(updates)
      .where(eq(dossiers.id, id))
      .returning();
    return updated || undefined;
  }

  async deleteDossier(id: number): Promise<boolean> {
    // Delete related records first to avoid foreign key constraints
    try {
      // Delete dossier members
      await db.delete(dossier_membres).where(eq(dossier_membres.dossier_id, id));
      
      // Delete roadshow items
      await db.delete(roadshow_items).where(eq(roadshow_items.dossier_id, id));
      
      // Delete interactions and contacts linked to societes of this dossier
      const societeIds = await db
        .select({ id: societes.id })
        .from(societes)
        .where(eq(societes.dossier_id, id));
      
      for (const societe of societeIds) {
        await db.delete(interactions).where(eq(interactions.societe_id, societe.id));
        await db.delete(contacts).where(eq(contacts.societe_id, societe.id));
      }
      
      // Delete societes
      await db.delete(societes).where(eq(societes.dossier_id, id));
      
      // Delete reminders (rappels)
      await db.delete(rappels).where(eq(rappels.dossier_id, id));
      
      // Finally delete the dossier
      const result = await db.delete(dossiers).where(eq(dossiers.id, id));
      return (result.rowCount || 0) > 0;
    } catch (error) {
      console.error("Error in deleteDossier:", error);
      throw error;
    }
  }

  // Sociétés
  async getSocietes(): Promise<Societe[]> {
    return await db.select().from(societes).orderBy(desc(societes.created_at));
  }

  async getSocietesByDossier(dossierId: number): Promise<Societe[]> {
    return await db
      .select()
      .from(societes)
      .where(eq(societes.dossier_id, dossierId))
      .orderBy(desc(societes.created_at));
  }

  async getSociete(id: number): Promise<Societe | undefined> {
    const [societe] = await db.select().from(societes).where(eq(societes.id, id));
    return societe || undefined;
  }

  async createSociete(insertSociete: InsertSociete): Promise<Societe> {
    const [societe] = await db
      .insert(societes)
      .values({
        nom: insertSociete.nom,
        secteur: insertSociete.secteur,
        site_web: insertSociete.site_web,
        description: insertSociete.description,
        est_acheteur: insertSociete.est_acheteur,
        est_client: insertSociete.est_client,
        dossier_id: insertSociete.dossier_id
      })
      .returning();
    return societe;
  }

  async updateSociete(id: number, updates: Partial<InsertSociete>): Promise<Societe | undefined> {
    const [updated] = await db
      .update(societes)
      .set(updates)
      .where(eq(societes.id, id))
      .returning();
    return updated || undefined;
  }

  async deleteSociete(id: number): Promise<boolean> {
    const result = await db.delete(societes).where(eq(societes.id, id));
    return (result.rowCount || 0) > 0;
  }

  // Contacts
  async getContacts(): Promise<Contact[]> {
    return await db.select().from(contacts).orderBy(desc(contacts.created_at));
  }

  async getContact(id: number): Promise<Contact | undefined> {
    const [contact] = await db.select().from(contacts).where(eq(contacts.id, id));
    return contact || undefined;
  }

  async getContactsBySociete(societeId: number): Promise<Contact[]> {
    return await db
      .select()
      .from(contacts)
      .where(eq(contacts.societe_id, societeId))
      .orderBy(desc(contacts.created_at));
  }

  async createContact(insertContact: InsertContact): Promise<Contact> {
    const [contact] = await db
      .insert(contacts)
      .values({
        nom_complet: insertContact.nom_complet,
        poste: insertContact.poste,
        email: insertContact.email,
        telephone: insertContact.telephone,
        linkedin: insertContact.linkedin,
        notes: insertContact.notes,
        societe_id: insertContact.societe_id
      })
      .returning();
    return contact;
  }

  async updateContact(id: number, updates: Partial<InsertContact>): Promise<Contact | undefined> {
    const [updated] = await db
      .update(contacts)
      .set(updates)
      .where(eq(contacts.id, id))
      .returning();
    return updated || undefined;
  }

  async deleteContact(id: number): Promise<boolean> {
    const result = await db.delete(contacts).where(eq(contacts.id, id));
    return (result.rowCount || 0) > 0;
  }

  // Interactions
  async getInteractions(): Promise<Interaction[]> {
    return await db.select().from(interactions).orderBy(desc(interactions.date));
  }

  async getInteractionsByDossier(dossierId: number): Promise<Interaction[]> {
    return await db
      .select()
      .from(interactions)
      .where(eq(interactions.dossier_id, dossierId))
      .orderBy(desc(interactions.date));
  }

  async getInteractionsBySociete(societeId: number): Promise<Interaction[]> {
    return await db
      .select()
      .from(interactions)
      .where(eq(interactions.societe_id, societeId))
      .orderBy(desc(interactions.date));
  }

  async createInteraction(insertInteraction: InsertInteraction): Promise<Interaction> {
    const [interaction] = await db
      .insert(interactions)
      .values({
        type: insertInteraction.type,
        date: insertInteraction.date || new Date(),
        notes: insertInteraction.notes,
        dossier_id: insertInteraction.dossier_id,
        societe_id: insertInteraction.societe_id,
        contact_id: insertInteraction.contact_id,
        auteur_id: insertInteraction.auteur_id,
        auteur: insertInteraction.auteur
      })
      .returning();
    return interaction;
  }

  async updateInteraction(id: number, updates: Partial<InsertInteraction>): Promise<Interaction | undefined> {
    const [updated] = await db
      .update(interactions)
      .set(updates)
      .where(eq(interactions.id, id))
      .returning();
    return updated || undefined;
  }

  // Rappels
  async getRappels(): Promise<Rappel[]> {
    return await db.select().from(rappels).orderBy(desc(rappels.date_echeance));
  }

  async getRappelsByDossier(dossierId: number): Promise<Rappel[]> {
    return await db
      .select()
      .from(rappels)
      .where(eq(rappels.dossier_id, dossierId))
      .orderBy(desc(rappels.date_echeance));
  }

  async getRappelsEchus(): Promise<Rappel[]> {
    const now = new Date();
    return await db
      .select()
      .from(rappels)
      .where(eq(rappels.date_echeance, now))
      .orderBy(desc(rappels.date_echeance));
  }

  async createRappel(insertRappel: InsertRappel): Promise<Rappel> {
    const [rappel] = await db
      .insert(rappels)
      .values({
        cible_type: insertRappel.cible_type,
        cible_id: insertRappel.cible_id,
        date_echeance: insertRappel.date_echeance,
        note: insertRappel.note,
        cree_par_id: insertRappel.cree_par_id,
        cree_par: insertRappel.cree_par,
        dossier_id: insertRappel.dossier_id
      })
      .returning();
    return rappel;
  }

  async updateRappel(id: number, updates: Partial<InsertRappel>): Promise<Rappel | undefined> {
    const [updated] = await db
      .update(rappels)
      .set(updates)
      .where(eq(rappels.id, id))
      .returning();
    return updated || undefined;
  }

  async deleteRappel(id: number): Promise<boolean> {
    const result = await db.delete(rappels).where(eq(rappels.id, id));
    return (result.rowCount || 0) > 0;
  }

  // Roadshow Items
  async getRoadshowItems(): Promise<RoadshowItem[]> {
    return await db.select().from(roadshow_items).orderBy(desc(roadshow_items.created_at));
  }

  async getRoadshowItemsByDossier(dossierId: number): Promise<RoadshowItemWithDetails[]> {
    const items = await db
      .select({
        roadshow_item: roadshow_items,
        societe: societes,
        contact: contacts,
        dossier: dossiers
      })
      .from(roadshow_items)
      .leftJoin(societes, eq(roadshow_items.societe_id, societes.id))
      .leftJoin(contacts, eq(roadshow_items.contact_id, contacts.id))
      .leftJoin(dossiers, eq(roadshow_items.dossier_id, dossiers.id))
      .where(eq(roadshow_items.dossier_id, dossierId))
      .orderBy(desc(roadshow_items.created_at));

    return items.map(item => ({
      ...item.roadshow_item,
      societe: item.societe!,
      contact: item.contact || undefined,
      dossier: item.dossier!
    }));
  }

  async createRoadshowItem(insertItem: InsertRoadshowItem): Promise<RoadshowItem> {
    const [item] = await db
      .insert(roadshow_items)
      .values({
        dossier_id: insertItem.dossier_id,
        societe_id: insertItem.societe_id,
        contact_id: insertItem.contact_id,
        statut: insertItem.statut || "non_contacte",
        dernier_contact: insertItem.dernier_contact,
        prochaine_relance: insertItem.prochaine_relance,
        notes_internes: insertItem.notes_internes
      })
      .returning();
    return item;
  }

  async updateRoadshowItem(id: number, updates: Partial<InsertRoadshowItem>): Promise<RoadshowItem | undefined> {
    const [updated] = await db
      .update(roadshow_items)
      .set(updates)
      .where(eq(roadshow_items.id, id))
      .returning();
    return updated || undefined;
  }

  async deleteRoadshowItem(id: number): Promise<boolean> {
    const result = await db.delete(roadshow_items).where(eq(roadshow_items.id, id));
    return (result.rowCount || 0) > 0;
  }
}

// Keep MemStorage for reference but use DatabaseStorage
export class MemStorage implements IStorage {
  // Users - dummy implementations
  async getUser(id: string): Promise<User | undefined> { return undefined; }
  async upsertUser(user: UpsertUser): Promise<User> { return {} as User; }
  async getDossierMembers(dossierId: number): Promise<DossierMembre[]> { return []; }
  async addDossierMember(member: InsertDossierMembre): Promise<DossierMembre> { return {} as DossierMembre; }
  async updateDossierMemberRole(dossierId: number, userId: string, role: string): Promise<DossierMembre | undefined> { return undefined; }
  async removeDossierMember(dossierId: number, userId: string): Promise<boolean> { return false; }
  
  private dossiers: Map<number, Dossier>;
  private societes: Map<number, Societe>;
  private contacts: Map<number, Contact>;
  private interactions: Map<number, Interaction>;
  private rappels: Map<number, Rappel>;
  private roadshowItems: Map<number, RoadshowItem>;
  private timelineEvents: Map<number, TimelineEvent>;
  private currentIds: {
    dossier: number;
    societe: number;
    contact: number;
    interaction: number;
    rappel: number;
    roadshowItem: number;
    timelineEvent: number;
  };

  constructor() {
    this.dossiers = new Map();
    this.societes = new Map();
    this.contacts = new Map();
    this.interactions = new Map();
    this.rappels = new Map();
    this.roadshowItems = new Map();
    this.timelineEvents = new Map();
    this.currentIds = {
      dossier: 1,
      societe: 1,
      contact: 1,
      interaction: 1,
      rappel: 1,
      roadshowItem: 1,
      timelineEvent: 1
    };

    // Initialize with sample data
    this.initializeSampleData();
  }

  private initializeSampleData() {
    // Create sample dossiers
    const dossier1: Dossier = {
      id: 1,
      nom: "Cession TechCorp",
      type: "CESSION",
      statut: "ACTIF",
      date_debut: new Date("2024-10-15"),
      date_cloture: null,
      client_id: null,
      description: "Mandat de cession d'une société tech spécialisée dans l'IA",
      equipe_interne: ["Jean Dupont", "Marie Martin"],
      created_by: null,
      created_at: new Date("2024-10-15"),
      updated_at: new Date()
    };

    const dossier2: Dossier = {
      id: 2,
      nom: "Acquisition FinanceApp",
      type: "ACQUISITION",
      statut: "ACTIF",
      date_debut: new Date("2024-11-01"),
      date_cloture: null,
      client_id: null,
      description: "Acquisition d'une fintech pour un client industriel",
      equipe_interne: ["Pierre Durand"],
      created_by: null,
      created_at: new Date("2024-11-01"),
      updated_at: new Date()
    };

    this.dossiers.set(1, dossier1);
    this.dossiers.set(2, dossier2);
    this.currentIds.dossier = 3;
  }

  // Modified getDossiers for compatibility
  async getDossiers(userId?: string): Promise<DossierWithStats[]> {
    return Array.from(this.dossiers.values()).map(dossier => {
      const societes = Array.from(this.societes.values()).filter(s => s.dossier_id === dossier.id);
      const interactions = Array.from(this.interactions.values()).filter(i => i.dossier_id === dossier.id);
      const lastActivity = interactions.length > 0 
        ? new Date(Math.max(...interactions.map(i => i.date?.getTime() || 0)))
        : undefined;

      return {
        ...dossier,
        societes_count: societes.length,
        interactions_count: interactions.length,
        last_activity: lastActivity,
        user_role: undefined,
        is_member: false
      };
    });
  }

  async getDossier(id: number): Promise<Dossier | undefined> {
    return this.dossiers.get(id);
  }

  async createDossier(insertDossier: InsertDossier): Promise<Dossier> {
    const id = this.currentIds.dossier++;
    const dossier: Dossier = {
      id,
      nom: insertDossier.nom,
      type: insertDossier.type,
      statut: insertDossier.statut,
      date_debut: insertDossier.date_debut || new Date(),
      date_cloture: insertDossier.date_cloture || null,
      client_id: insertDossier.client_id || null,
      description: insertDossier.description || null,
      equipe_interne: insertDossier.equipe_interne || null,
      created_at: new Date(),
      updated_at: new Date()
    };
    this.dossiers.set(id, dossier);
    return dossier;
  }

  async updateDossier(id: number, updates: Partial<InsertDossier>): Promise<Dossier | undefined> {
    const existing = this.dossiers.get(id);
    if (!existing) return undefined;
    
    const updated: Dossier = {
      ...existing,
      ...updates,
      updated_at: new Date()
    };
    this.dossiers.set(id, updated);
    return updated;
  }

  async deleteDossier(id: number): Promise<boolean> {
    return this.dossiers.delete(id);
  }

  // Sociétés
  async getSocietes(): Promise<Societe[]> {
    return Array.from(this.societes.values());
  }

  async getSocietesByDossier(dossierId: number): Promise<Societe[]> {
    return Array.from(this.societes.values()).filter(s => s.dossier_id === dossierId);
  }

  async getSociete(id: number): Promise<Societe | undefined> {
    return this.societes.get(id);
  }

  async createSociete(insertSociete: InsertSociete): Promise<Societe> {
    const id = this.currentIds.societe++;
    const societe: Societe = {
      id,
      nom: insertSociete.nom,
      secteur: insertSociete.secteur || null,
      site_web: insertSociete.site_web || null,
      description: insertSociete.description || null,
      est_acheteur: insertSociete.est_acheteur || null,
      est_client: insertSociete.est_client || null,
      dossier_id: insertSociete.dossier_id || null,
      created_at: new Date(),
      updated_at: new Date()
    };
    this.societes.set(id, societe);
    return societe;
  }

  async updateSociete(id: number, updates: Partial<InsertSociete>): Promise<Societe | undefined> {
    const existing = this.societes.get(id);
    if (!existing) return undefined;
    
    const updated: Societe = {
      ...existing,
      ...updates,
      updated_at: new Date()
    };
    this.societes.set(id, updated);
    return updated;
  }

  async deleteSociete(id: number): Promise<boolean> {
    return this.societes.delete(id);
  }

  // Contacts
  async getContacts(): Promise<Contact[]> {
    return Array.from(this.contacts.values());
  }

  async getContact(id: number): Promise<Contact | undefined> {
    return this.contacts.get(id);
  }

  async getContactsBySociete(societeId: number): Promise<Contact[]> {
    return Array.from(this.contacts.values()).filter(c => c.societe_id === societeId);
  }

  async createContact(insertContact: InsertContact): Promise<Contact> {
    const id = this.currentIds.contact++;
    const contact: Contact = {
      id,
      nom_complet: insertContact.nom_complet,
      poste: insertContact.poste || null,
      email: insertContact.email || null,
      telephone: insertContact.telephone || null,
      linkedin: insertContact.linkedin || null,
      notes: insertContact.notes || null,
      societe_id: insertContact.societe_id || null,
      created_at: new Date(),
      updated_at: new Date()
    };
    this.contacts.set(id, contact);
    return contact;
  }

  async updateContact(id: number, updates: Partial<InsertContact>): Promise<Contact | undefined> {
    const existing = this.contacts.get(id);
    if (!existing) return undefined;
    
    const updated: Contact = {
      ...existing,
      ...updates,
      updated_at: new Date()
    };
    this.contacts.set(id, updated);
    return updated;
  }

  async deleteContact(id: number): Promise<boolean> {
    return this.contacts.delete(id);
  }



  // Interactions
  async getInteractions(): Promise<Interaction[]> {
    return Array.from(this.interactions.values());
  }

  async getInteractionsByDossier(dossierId: number): Promise<Interaction[]> {
    return Array.from(this.interactions.values()).filter(i => i.dossier_id === dossierId);
  }

  async getInteractionsBySociete(societeId: number): Promise<Interaction[]> {
    return Array.from(this.interactions.values()).filter(i => i.societe_id === societeId);
  }

  async createInteraction(insertInteraction: InsertInteraction): Promise<Interaction> {
    const id = this.currentIds.interaction++;
    const interaction: Interaction = {
      id,
      type: insertInteraction.type,
      date: insertInteraction.date || new Date(),
      notes: insertInteraction.notes || null,
      dossier_id: insertInteraction.dossier_id || null,
      societe_id: insertInteraction.societe_id || null,
      contact_id: insertInteraction.contact_id || null,
      auteur: insertInteraction.auteur || null,
      created_at: new Date(),
      updated_at: new Date()
    };
    this.interactions.set(id, interaction);
    return interaction;
  }

  async updateInteraction(id: number, updates: Partial<InsertInteraction>): Promise<Interaction | undefined> {
    const existing = this.interactions.get(id);
    if (!existing) return undefined;
    
    const updated: Interaction = {
      ...existing,
      ...updates,
      updated_at: new Date()
    };
    this.interactions.set(id, updated);
    return updated;
  }

  // Rappels
  async getRappels(): Promise<Rappel[]> {
    return Array.from(this.rappels.values());
  }

  async getRappelsByDossier(dossierId: number): Promise<Rappel[]> {
    return Array.from(this.rappels.values()).filter(r => r.dossier_id === dossierId);
  }

  async getRappelsEchus(): Promise<Rappel[]> {
    const now = new Date();
    return Array.from(this.rappels.values()).filter(r => r.date_echeance <= now);
  }

  async createRappel(insertRappel: InsertRappel): Promise<Rappel> {
    const id = this.currentIds.rappel++;
    const rappel: Rappel = {
      id,
      cible_type: insertRappel.cible_type,
      cible_id: insertRappel.cible_id,
      date_echeance: insertRappel.date_echeance,
      note: insertRappel.note || null,
      cree_par: insertRappel.cree_par,
      dossier_id: insertRappel.dossier_id || null,
      created_at: new Date(),
      updated_at: new Date()
    };
    this.rappels.set(id, rappel);
    return rappel;
  }

  async updateRappel(id: number, updates: Partial<InsertRappel>): Promise<Rappel | undefined> {
    const existing = this.rappels.get(id);
    if (!existing) return undefined;
    
    const updated: Rappel = {
      ...existing,
      ...updates,
      updated_at: new Date()
    };
    this.rappels.set(id, updated);
    return updated;
  }

  async deleteRappel(id: number): Promise<boolean> {
    return this.rappels.delete(id);
  }

  // Roadshow Items
  async getRoadshowItems(): Promise<RoadshowItem[]> {
    return Array.from(this.roadshowItems.values());
  }

  async getRoadshowItemsByDossier(dossierId: number): Promise<RoadshowItemWithDetails[]> {
    const items = Array.from(this.roadshowItems.values()).filter(item => item.dossier_id === dossierId);
    
    return items.map(item => {
      const societe = this.societes.get(item.societe_id!);
      const contact = item.contact_id ? this.contacts.get(item.contact_id) : undefined;
      const dossier = this.dossiers.get(item.dossier_id!);
      
      return {
        ...item,
        societe: societe!,
        contact,
        dossier: dossier!
      };
    });
  }

  async createRoadshowItem(insertItem: InsertRoadshowItem): Promise<RoadshowItem> {
    const id = this.currentIds.roadshowItem++;
    const item: RoadshowItem = {
      id,
      dossier_id: insertItem.dossier_id || null,
      societe_id: insertItem.societe_id || null,
      contact_id: insertItem.contact_id || null,
      statut: insertItem.statut || "non_contacte",
      dernier_contact: insertItem.dernier_contact || null,
      prochaine_relance: insertItem.prochaine_relance || null,
      notes_internes: insertItem.notes_internes || null,
      created_at: new Date(),
      updated_at: new Date()
    };
    this.roadshowItems.set(id, item);
    return item;
  }

  async updateRoadshowItem(id: number, updates: Partial<InsertRoadshowItem>): Promise<RoadshowItem | undefined> {
    const existing = this.roadshowItems.get(id);
    if (!existing) return undefined;
    
    const updated: RoadshowItem = {
      ...existing,
      ...updates,
      updated_at: new Date()
    };
    this.roadshowItems.set(id, updated);
    return updated;
  }

  async deleteRoadshowItem(id: number): Promise<boolean> {
    return this.roadshowItems.delete(id);
  }

  // Additional methods for new features
  async getAllUsers(): Promise<User[]> {
    return await db.select().from(users);
  }

  async getDashboardStats(userId: string): Promise<any> {
    const userDossiers = await db
      .select({
        id: dossiers.id,
        nom: dossiers.nom,
        nom_client: dossiers.nom_client,
        nom_code: dossiers.nom_code,
        type: dossiers.type,
        statut: dossiers.statut,
        etape_kanban: dossiers.etape_kanban,
        date_debut: dossiers.date_debut,
        date_cloture: dossiers.date_cloture,
        description: dossiers.description,
        equipe_interne: dossiers.equipe_interne,
        // Economic fields
        has_retainer: dossiers.has_retainer,
        retainer_montant: dossiers.retainer_montant,
        has_flat_fee: dossiers.has_flat_fee,
        flat_fee_montant: dossiers.flat_fee_montant,
        success_fee_pourcentage: dossiers.success_fee_pourcentage,
        success_fee_base: dossiers.success_fee_base,
        pipeline_ponderation: dossiers.pipeline_ponderation,
        valeur_operation: dossiers.valeur_operation,
        societes_count: sql<number>`CAST(COUNT(DISTINCT ${societes.id}) AS INTEGER)`,
        interactions_count: sql<number>`CAST(COUNT(DISTINCT ${interactions.id}) AS INTEGER)`,
        last_activity: max(interactions.date)
      })
      .from(dossiers)
      .leftJoin(dossier_membres, eq(dossiers.id, dossier_membres.dossier_id))
      .leftJoin(societes, eq(dossiers.id, societes.dossier_id))
      .leftJoin(interactions, eq(dossiers.id, interactions.dossier_id))
      .where(
        or(
          eq(dossiers.created_by, userId),
          eq(dossier_membres.utilisateur_id, userId)
        )
      )
      .groupBy(
        dossiers.id,
        dossiers.nom,
        dossiers.nom_client, 
        dossiers.nom_code,
        dossiers.type,
        dossiers.statut,
        dossiers.etape_kanban,
        dossiers.date_debut,
        dossiers.date_cloture,
        dossiers.description,
        dossiers.equipe_interne,
        dossiers.has_retainer,
        dossiers.retainer_montant,
        dossiers.has_flat_fee,
        dossiers.flat_fee_montant,
        dossiers.success_fee_pourcentage,
        dossiers.success_fee_base,
        dossiers.pipeline_ponderation,
        dossiers.valeur_operation
      );

    const nbDossiersAssignes = userDossiers.length;
    const nbDossiersActifs = userDossiers.filter(d => d.statut === 'ACTIF').length;
    
    // Get reminders count
    const [rappelsStats] = await db
      .select({
        nb_relances_en_retard: sql<number>`CAST(COUNT(CASE WHEN ${rappels.date_echeance} < NOW() THEN 1 END) AS INTEGER)`,
        nb_echeances_a_venir: sql<number>`CAST(COUNT(CASE WHEN ${rappels.date_echeance} >= NOW() AND ${rappels.date_echeance} <= NOW() + INTERVAL '7 days' THEN 1 END) AS INTEGER)`
      })
      .from(rappels)
      .leftJoin(dossiers, eq(rappels.dossier_id, dossiers.id))
      .leftJoin(dossier_membres, eq(dossiers.id, dossier_membres.dossier_id))
      .where(
        or(
          eq(dossiers.created_by, userId),
          eq(dossier_membres.utilisateur_id, userId),
          eq(rappels.cree_par_id, userId)
        )
      );

    return {
      nb_dossiers_assignes: nbDossiersAssignes,
      nb_dossiers_actifs: nbDossiersActifs,
      nb_relances_en_retard: rappelsStats?.nb_relances_en_retard || 0,
      nb_echeances_a_venir: rappelsStats?.nb_echeances_a_venir || 0,
      dossiers_assignes: userDossiers.map(d => ({
        ...d,
        is_member: true,
        role: 'Responsable'
      }))
    };
  }

  async addDossierMembre(member: InsertDossierMembre): Promise<DossierMembre> {
    return this.addDossierMember(member);
  }

  async getAllUsers(): Promise<User[]> {
    return await db.select().from(users);
  }

  // Timeline Events
  async getTimelineEventsByDossier(dossierId: number): Promise<TimelineEvent[]> {
    return await db.select()
      .from(timeline_events)
      .where(eq(timeline_events.dossier_id, dossierId))
      .orderBy(desc(timeline_events.date));
  }

  async createTimelineEvent(event: InsertTimelineEvent): Promise<TimelineEvent> {
    const [created] = await db
      .insert(timeline_events)
      .values(event)
      .returning();
    return created;
  }

  async updateTimelineEvent(id: number, event: Partial<InsertTimelineEvent>): Promise<TimelineEvent | undefined> {
    const [updated] = await db
      .update(timeline_events)
      .set({ ...event, updated_at: new Date() })
      .where(eq(timeline_events.id, id))
      .returning();
    return updated || undefined;
  }

  async deleteTimelineEvent(id: number): Promise<boolean> {
    const result = await db
      .delete(timeline_events)
      .where(eq(timeline_events.id, id));
    return result.rowCount ? result.rowCount > 0 : false;
  }

  // Todo Tasks implementation
  async getTodoTasks(dossierId: number): Promise<TodoTask[]> {
    return await db.select().from(todo_tasks).where(eq(todo_tasks.dossier_id, dossierId));
  }

  async createTodoTask(task: InsertTodoTask): Promise<TodoTask> {
    const [created] = await db.insert(todo_tasks).values(task).returning();
    return created;
  }

  async updateTodoTask(id: number, task: Partial<InsertTodoTask>): Promise<TodoTask | undefined> {
    const [updated] = await db.update(todo_tasks)
      .set({ ...task, updated_at: new Date() })
      .where(eq(todo_tasks.id, id))
      .returning();
    return updated;
  }

  async deleteTodoTask(id: number): Promise<boolean> {
    const result = await db.delete(todo_tasks).where(eq(todo_tasks.id, id));
    return result.rowCount ? result.rowCount > 0 : false;
  }

  // Missing methods for complete interface implementation
  async getDossiers(userId?: string): Promise<any[]> {
    // Implementation for getDossiers - this is a complex method that's already implemented above
    // This is just a stub to satisfy the interface
    return [];
  }

  async getDossier(id: number): Promise<any> {
    const [dossier] = await db.select().from(dossiers).where(eq(dossiers.id, id));
    return dossier;
  }

  async createDossier(dossier: any): Promise<any> {
    const [created] = await db.insert(dossiers).values(dossier).returning();
    return created;
  }

  async updateDossier(id: number, dossier: any): Promise<any> {
    const [updated] = await db.update(dossiers)
      .set({ ...dossier, updated_at: new Date() })
      .where(eq(dossiers.id, id))
      .returning();
    return updated;
  }

  async deleteDossier(id: number): Promise<boolean> {
    const result = await db.delete(dossiers).where(eq(dossiers.id, id));
    return result.rowCount ? result.rowCount > 0 : false;
  }

  async getSocietes(): Promise<any[]> {
    return await db.select().from(societes);
  }

  async getSocietesByDossier(dossierId: number): Promise<any[]> {
    return await db.select().from(societes).where(eq(societes.dossier_id, dossierId));
  }

  async getSociete(id: number): Promise<any> {
    const [societe] = await db.select().from(societes).where(eq(societes.id, id));
    return societe;
  }

  async createSociete(societe: any): Promise<any> {
    const [created] = await db.insert(societes).values(societe).returning();
    return created;
  }

  async updateSociete(id: number, societe: any): Promise<any> {
    const [updated] = await db.update(societes)
      .set({ ...societe, updated_at: new Date() })
      .where(eq(societes.id, id))
      .returning();
    return updated;
  }

  async deleteSociete(id: number): Promise<boolean> {
    const result = await db.delete(societes).where(eq(societes.id, id));
    return result.rowCount ? result.rowCount > 0 : false;
  }

  async getContacts(): Promise<any[]> {
    return await db.select().from(contacts);
  }

  async getContact(id: number): Promise<any> {
    const [contact] = await db.select().from(contacts).where(eq(contacts.id, id));
    return contact;
  }

  async getContactsBySociete(societeId: number): Promise<any[]> {
    return await db.select().from(contacts).where(eq(contacts.societe_id, societeId));
  }

  async createContact(contact: any): Promise<any> {
    const [created] = await db.insert(contacts).values(contact).returning();
    return created;
  }

  async updateContact(id: number, contact: any): Promise<any> {
    const [updated] = await db.update(contacts)
      .set({ ...contact, updated_at: new Date() })
      .where(eq(contacts.id, id))
      .returning();
    return updated;
  }

  async deleteContact(id: number): Promise<boolean> {
    const result = await db.delete(contacts).where(eq(contacts.id, id));
    return result.rowCount ? result.rowCount > 0 : false;
  }

  async getInteractions(): Promise<any[]> {
    return await db.select().from(interactions);
  }

  async getInteractionsByDossier(dossierId: number): Promise<any[]> {
    return await db.select().from(interactions).where(eq(interactions.dossier_id, dossierId));
  }

  async getInteractionsBySociete(societeId: number): Promise<any[]> {
    return await db.select().from(interactions).where(eq(interactions.societe_id, societeId));
  }

  async createInteraction(interaction: any): Promise<any> {
    const [created] = await db.insert(interactions).values(interaction).returning();
    return created;
  }

  async updateInteraction(id: number, interaction: any): Promise<any> {
    const [updated] = await db.update(interactions)
      .set({ ...interaction, updated_at: new Date() })
      .where(eq(interactions.id, id))
      .returning();
    return updated;
  }

  async getRappels(): Promise<any[]> {
    return await db.select().from(rappels);
  }

  async getRappelsByDossier(dossierId: number): Promise<any[]> {
    return await db.select().from(rappels).where(eq(rappels.dossier_id, dossierId));
  }

  async getRappelsEchus(): Promise<any[]> {
    return await db.select().from(rappels).where(sql`${rappels.date_echeance} < NOW()`);
  }

  async createRappel(rappel: any): Promise<any> {
    const [created] = await db.insert(rappels).values(rappel).returning();
    return created;
  }

  async updateRappel(id: number, rappel: any): Promise<any> {
    const [updated] = await db.update(rappels)
      .set({ ...rappel, updated_at: new Date() })
      .where(eq(rappels.id, id))
      .returning();
    return updated;
  }

  async deleteRappel(id: number): Promise<boolean> {
    const result = await db.delete(rappels).where(eq(rappels.id, id));
    return result.rowCount ? result.rowCount > 0 : false;
  }

  async getRoadshowItems(): Promise<any[]> {
    return await db.select().from(roadshow_items);
  }

  async getRoadshowItemsByDossier(dossierId: number): Promise<any[]> {
    return await db.select().from(roadshow_items).where(eq(roadshow_items.dossier_id, dossierId));
  }

  async createRoadshowItem(item: any): Promise<any> {
    const [created] = await db.insert(roadshow_items).values(item).returning();
    return created;
  }

  async updateRoadshowItem(id: number, item: any): Promise<any> {
    const [updated] = await db.update(roadshow_items)
      .set({ ...item, updated_at: new Date() })
      .where(eq(roadshow_items.id, id))
      .returning();
    return updated;
  }

  async deleteRoadshowItem(id: number): Promise<boolean> {
    const result = await db.delete(roadshow_items).where(eq(roadshow_items.id, id));
    return result.rowCount ? result.rowCount > 0 : false;
  }

  async getDossierMembers(dossierId: number): Promise<any[]> {
    return await db.select().from(dossier_membres).where(eq(dossier_membres.dossier_id, dossierId));
  }

  async addDossierMember(member: any): Promise<any> {
    const [created] = await db.insert(dossier_membres).values(member).returning();
    return created;
  }

  async updateDossierMemberRole(dossierId: number, userId: string, role: string): Promise<any> {
    const [updated] = await db.update(dossier_membres)
      .set({ role })
      .where(and(eq(dossier_membres.dossier_id, dossierId), eq(dossier_membres.utilisateur_id, userId)))
      .returning();
    return updated;
  }

  async removeDossierMember(dossierId: number, userId: string): Promise<boolean> {
    const result = await db.delete(dossier_membres)
      .where(and(eq(dossier_membres.dossier_id, dossierId), eq(dossier_membres.utilisateur_id, userId)));
    return result.rowCount ? result.rowCount > 0 : false;
  }
}

export const storage = new DatabaseStorage();
