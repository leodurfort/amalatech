import { pgTable, text, serial, integer, boolean, timestamp, varchar, jsonb, index, pgEnum, date } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Session storage table.
// (IMPORTANT) This table is mandatory for Replit Auth, don't drop it.
export const sessions = pgTable(
  "sessions",
  {
    sid: varchar("sid").primaryKey(),
    sess: jsonb("sess").notNull(),
    expire: timestamp("expire").notNull(),
  },
  (table) => [index("IDX_session_expire").on(table.expire)],
);

// User storage table.
// (IMPORTANT) This table is mandatory for Replit Auth, don't drop it.
// Roadshow enums
export const roadshowStatusEnum = pgEnum('roadshow_status', ['Live', 'Waiting', 'No-go']);
export const roadshowEventTypeEnum = pgEnum('roadshow_event_type', [
  'interaction', 'teaser', 'followup', 'nda', 'im', 'bp', 
  'ioi', 'extra_send', 'meeting', 'dataroom', 'binding', 'status_change'
]);

export const users = pgTable("users", {
  id: varchar("id").primaryKey().notNull(),
  email: varchar("email").unique(),
  firstName: varchar("first_name"),
  lastName: varchar("last_name"),
  profileImageUrl: varchar("profile_image_url"),
  poste: varchar("poste").default("Collaborateur"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export type UpsertUser = typeof users.$inferInsert;
export type User = typeof users.$inferSelect;

// Main entity: Dossiers (mandates/deals)
export const dossiers = pgTable("dossiers", {
  id: serial("id").primaryKey(),
  nom: text("nom").notNull(),
  nom_client: text("nom_client"),
  nom_code: text("nom_code"), // Optional code name, falls back to nom_client
  type: text("type").notNull(), // CESSION, ACQUISITION, LEVEE
  statut: text("statut").notNull(), // ACTIF, CLOTURE, PERDU, PAUSE
  etape_kanban: text("etape_kanban").default("PREPARATION"), // PREPARATION, PRE_MARKETING, SCREENING, DEAL_MAKING, ROADSHOW, PHASE_2, EXCLUSIVITE, ROAD_TO_CLOSING
  
  // General info
  mandat_signe: boolean("mandat_signe").default(false),
  date_signature: timestamp("date_signature"),
  type_mandat: text("type_mandat"), // SELL_SIDE, BUY_SIDE
  categories: text("categories").array(), // Array of categories
  sous_type: text("sous_type"), // M&A, LBO, DUAL_TRACK, DEBT (only for sell-side)
  
  // Economic conditions (admin only)
  has_retainer: boolean("has_retainer").default(false),
  retainer_montant: integer("retainer_montant"), // In euros
  has_flat_fee: boolean("has_flat_fee").default(false),
  flat_fee_montant: integer("flat_fee_montant"), // In euros
  success_fee_pourcentage: integer("success_fee_pourcentage"), // Percentage for success fee
  success_fee_base: text("success_fee_base"), // VE, VT
  
  // Success fee mode selection (simple or progressive)
  success_fee_mode: text("success_fee_mode").default("simple"), // simple, progressive
  
  // Progressive tranches (JSON for up to 5 tiers)
  tranches: jsonb("tranches"), // Array of {min, max, percent}
  
  // Pipeline weighting and operation value
  pipeline_ponderation: integer("pipeline_ponderation").default(100), // 0-100 percentage
  date_debut_projet: timestamp("date_debut_projet"), // Project start date
  valeur_operation: integer("valeur_operation"), // Operation value in euros
  
  date_debut: timestamp("date_debut").defaultNow(),
  date_cloture: timestamp("date_cloture"),
  client_id: integer("client_id"), // Future FK to clients table
  description: text("description"),
  equipe_interne: text("equipe_interne").array(), // Array of team member names
  created_by: varchar("created_by").references(() => users.id),
  created_at: timestamp("created_at").defaultNow(),
  updated_at: timestamp("updated_at").defaultNow()
});

// Table de liaison pour les membres des dossiers
export const dossier_membres = pgTable("dossier_membres", {
  id: serial("id").primaryKey(),
  utilisateur_id: varchar("utilisateur_id").references(() => users.id).notNull(),
  dossier_id: integer("dossier_id").references(() => dossiers.id).notNull(),
  role: text("role").notNull().default("collaborateur"), // responsable, collaborateur, lecture
  created_at: timestamp("created_at").defaultNow(),
  updated_at: timestamp("updated_at").defaultNow()
});

export const societes = pgTable("societes", {
  id: serial("id").primaryKey(),
  nom: text("nom").notNull(),
  secteur: text("secteur"),
  site_web: text("site_web"),
  description: text("description"),
  est_acheteur: boolean("est_acheteur").default(false),
  est_client: boolean("est_client").default(false),
  dossier_id: integer("dossier_id").references(() => dossiers.id),
  created_at: timestamp("created_at").defaultNow(),
  updated_at: timestamp("updated_at").defaultNow()
});

export const contacts = pgTable("contacts", {
  id: serial("id").primaryKey(),
  nom_complet: text("nom_complet").notNull(),
  poste: text("poste"),
  email: text("email"),
  telephone: text("telephone"),
  linkedin: text("linkedin"),
  notes: text("notes"),
  societe_id: integer("societe_id").references(() => societes.id),
  created_at: timestamp("created_at").defaultNow(),
  updated_at: timestamp("updated_at").defaultNow()
});

export const interactions = pgTable("interactions", {
  id: serial("id").primaryKey(),
  type: text("type").notNull(), // APPEL, EMAIL, REUNION, NDA_ENVOYE, NDA_SIGNE, IOI, CIM, AUTRE
  date: timestamp("date").defaultNow(),
  notes: text("notes"),
  dossier_id: integer("dossier_id").references(() => dossiers.id),
  societe_id: integer("societe_id").references(() => societes.id),
  contact_id: integer("contact_id").references(() => contacts.id),
  auteur_id: varchar("auteur_id").references(() => users.id),
  auteur: text("auteur"), // Kept for backward compatibility
  created_at: timestamp("created_at").defaultNow(),
  updated_at: timestamp("updated_at").defaultNow()
});

export const rappels = pgTable("rappels", {
  id: serial("id").primaryKey(),
  cible_type: text("cible_type").notNull(), // Contact ou Société
  cible_id: integer("cible_id").notNull(),
  date_echeance: timestamp("date_echeance").notNull(),
  note: text("note"),
  cree_par_id: varchar("cree_par_id").references(() => users.id),
  cree_par: text("cree_par").notNull(), // Kept for backward compatibility
  dossier_id: integer("dossier_id").references(() => dossiers.id),
  created_at: timestamp("created_at").defaultNow(),
  updated_at: timestamp("updated_at").defaultNow()
});

// New Roadshow system - counterparties
export const roadshow_counterparty = pgTable("roadshow_counterparty", {
  id: serial("id").primaryKey(),
  project_id: integer("project_id").references(() => dossiers.id).notNull(),
  name: text("name").notNull(),
  status: roadshowStatusEnum("status").default("Waiting"),
  owner_id: varchar("owner_id").references(() => users.id),
  next_followup_date: date("next_followup_date"),
  created_at: timestamp("created_at").defaultNow(),
  updated_at: timestamp("updated_at").defaultNow()
});

// Roadshow owners (multi-assignment)
export const roadshow_owner = pgTable("roadshow_owner", {
  id: serial("id").primaryKey(),
  counterparty_id: integer("counterparty_id").references(() => roadshow_counterparty.id).notNull(),
  user_id: varchar("user_id").references(() => users.id).notNull(),
  created_at: timestamp("created_at").defaultNow()
});

// Roadshow contacts
export const roadshow_contact = pgTable("roadshow_contact", {
  id: serial("id").primaryKey(),
  counterparty_id: integer("counterparty_id").references(() => roadshow_counterparty.id).notNull(),
  full_name: text("full_name"),
  email: text("email"),
  created_at: timestamp("created_at").defaultNow(),
  updated_at: timestamp("updated_at").defaultNow()
});

// Roadshow events
export const roadshow_event = pgTable("roadshow_event", {
  id: serial("id").primaryKey(),
  counterparty_id: integer("counterparty_id").references(() => roadshow_counterparty.id).notNull(),
  type: roadshowEventTypeEnum("type").notNull(),
  label: text("label"), // ex: "Relance #2"
  content: text("content"), // notes libres
  event_date: date("event_date").notNull(),
  meta: jsonb("meta"), // For storing status change info like { newStatus: "Live", oldStatus: "Waiting" }
  created_by: varchar("created_by").references(() => users.id),
  created_at: timestamp("created_at").defaultNow()
});

// Roadshow Phase 2
export const roadshow_phase2 = pgTable("roadshow_phase2", {
  id: serial("id").primaryKey(),
  counterparty_id: integer("counterparty_id").references(() => roadshow_counterparty.id).notNull(),
  phase2_ok: boolean("phase2_ok").default(false),
  dataroom_sent_at: date("dataroom_sent_at"),
  binding_offer_at: date("binding_offer_at"),
  created_at: timestamp("created_at").defaultNow(),
  updated_at: timestamp("updated_at").defaultNow()
});

// Legacy roadshow tracking (kept for backward compatibility)
export const roadshow_items = pgTable("roadshow_items", {
  id: serial("id").primaryKey(),
  dossier_id: integer("dossier_id").references(() => dossiers.id),
  societe_id: integer("societe_id").references(() => societes.id),
  contact_id: integer("contact_id").references(() => contacts.id),
  statut: text("statut").notNull().default("non_contacte"), // non_contacte, nda_envoye, nda_signe, ioi_recu, abandonne
  dernier_contact: timestamp("dernier_contact"),
  prochaine_relance: timestamp("prochaine_relance"),
  next_chase_date: timestamp("next_chase_date"),
  notes_internes: text("notes_internes"),
  created_at: timestamp("created_at").defaultNow(),
  updated_at: timestamp("updated_at").defaultNow()
});

// Insert schemas
export const insertDossierSchema = createInsertSchema(dossiers).omit({
  id: true,
  created_at: true,
  updated_at: true
});

export const insertDossierMembreSchema = createInsertSchema(dossier_membres).omit({
  id: true,
  created_at: true,
  updated_at: true
});

export const insertSocieteSchema = createInsertSchema(societes).omit({
  id: true,
  created_at: true,
  updated_at: true
});

export const insertContactSchema = createInsertSchema(contacts).omit({
  id: true,
  created_at: true,
  updated_at: true
});

export const insertInteractionSchema = createInsertSchema(interactions).omit({
  id: true,
  created_at: true,
  updated_at: true
});

export const insertRappelSchema = createInsertSchema(rappels).omit({
  id: true,
  created_at: true,
  updated_at: true
});

// New roadshow schemas
export const insertRoadshowCounterpartySchema = createInsertSchema(roadshow_counterparty).omit({
  id: true,
  created_at: true,
  updated_at: true
});

export const insertRoadshowContactSchema = createInsertSchema(roadshow_contact).omit({
  id: true,
  created_at: true,
  updated_at: true
});

export const insertRoadshowItemSchema = createInsertSchema(roadshow_items).omit({
  id: true,
  created_at: true,
  updated_at: true
});

export const insertRoadshowEventSchema = createInsertSchema(roadshow_event).omit({
  id: true,
  created_at: true
});

export const insertRoadshowOwnerSchema = createInsertSchema(roadshow_owner).omit({
  id: true,
  created_at: true
});

export const insertRoadshowPhase2Schema = createInsertSchema(roadshow_phase2).omit({
  id: true,
  created_at: true,
  updated_at: true
});

// Types
export type Dossier = typeof dossiers.$inferSelect;
export type InsertDossier = z.infer<typeof insertDossierSchema>;

export type DossierMembre = typeof dossier_membres.$inferSelect;
export type InsertDossierMembre = z.infer<typeof insertDossierMembreSchema>;

export type Societe = typeof societes.$inferSelect;
export type InsertSociete = z.infer<typeof insertSocieteSchema>;

export type Contact = typeof contacts.$inferSelect;
export type InsertContact = z.infer<typeof insertContactSchema>;

export type Interaction = typeof interactions.$inferSelect;
export type InsertInteraction = z.infer<typeof insertInteractionSchema>;

export type Rappel = typeof rappels.$inferSelect;
export type InsertRappel = z.infer<typeof insertRappelSchema>;

export type RoadshowItem = typeof roadshow_items.$inferSelect;
export type InsertRoadshowItem = z.infer<typeof insertRoadshowItemSchema>;

// New Roadshow types
export type RoadshowCounterparty = typeof roadshow_counterparty.$inferSelect;
export type InsertRoadshowCounterparty = z.infer<typeof insertRoadshowCounterpartySchema>;

export type RoadshowContact = typeof roadshow_contact.$inferSelect;
export type InsertRoadshowContact = z.infer<typeof insertRoadshowContactSchema>;

export type RoadshowEvent = typeof roadshow_event.$inferSelect;
export type InsertRoadshowEvent = z.infer<typeof insertRoadshowEventSchema>;

export type RoadshowOwner = typeof roadshow_owner.$inferSelect;
export type InsertRoadshowOwner = z.infer<typeof insertRoadshowOwnerSchema>;

export type RoadshowPhase2 = typeof roadshow_phase2.$inferSelect;
export type InsertRoadshowPhase2 = z.infer<typeof insertRoadshowPhase2Schema>;

// Extended types for joins
export type DossierWithStats = Dossier & {
  societes_count: number;
  interactions_count: number;
  last_activity?: Date;
  user_role?: string; // Role of current user on this dossier
  is_member?: boolean; // Whether current user is member of this dossier
};

export type SocieteWithContact = Societe & {
  contact_principal?: Contact;
};

export type RoadshowItemWithDetails = RoadshowItem & {
  societe: Societe;
  contact?: Contact;
  dossier: Dossier;
};

// Timeline events table
export const timeline_events = pgTable("timeline_events", {
  id: serial("id").primaryKey(),
  dossier_id: integer("dossier_id").references(() => dossiers.id).notNull(),
  label: text("label").notNull(),
  description: text("description"),
  date: timestamp("date").defaultNow(),
  type: text("type").default("milestone"), // milestone, interaction, deadline
  created_by: varchar("created_by").references(() => users.id),
  created_at: timestamp("created_at").defaultNow(),
  updated_at: timestamp("updated_at").defaultNow()
});

// Todo tasks table with multi-assignment support
export const todo_tasks = pgTable("todo_tasks", {
  id: serial("id").primaryKey(),
  dossier_id: integer("dossier_id").references(() => dossiers.id).notNull(),
  title: text("title").notNull(),
  description: text("description"),
  due_date: timestamp("due_date"),
  priority: text("priority").notNull().default("medium"), // low, medium, high
  done: boolean("done").default(false),
  assigned_to: text("assigned_to").array(), // Array of user names/emails for multi-assignment
  created_by: varchar("created_by").references(() => users.id),
  created_at: timestamp("created_at").defaultNow(),
  updated_at: timestamp("updated_at").defaultNow()
});



// Enums for better type safety
export const DossierType = {
  CESSION: "CESSION",
  ACQUISITION: "ACQUISITION", 
  LEVEE: "LEVEE"
} as const;

export const DossierStatut = {
  ACTIF: "ACTIF",
  CLOTURE: "CLOTURE",
  PERDU: "PERDU",
  PAUSE: "PAUSE"
} as const;

export const TypeMandat = {
  SELL_SIDE: "SELL_SIDE",
  BUY_SIDE: "BUY_SIDE"
} as const;

export const SousType = {
  MA: "M&A",
  LBO: "LBO",
  DUAL_TRACK: "DUAL_TRACK",
  DEBT: "DEBT"
} as const;

export const SuccessFeeBase = {
  VE: "VE",
  VT: "VT"
} as const;

export const InteractionType = {
  APPEL: "APPEL",
  EMAIL: "EMAIL",
  REUNION: "REUNION",
  NDA_ENVOYE: "NDA_ENVOYE",
  NDA_SIGNE: "NDA_SIGNE",
  IOI: "IOI",
  CIM: "CIM",
  AUTRE: "AUTRE"
} as const;

// Aliases for existing tables (to match current usage)
export const timelineEvents = timeline_events;
export const todoTasks = todo_tasks;

// Insert schemas for new tables
export const insertTimelineEventSchema = createInsertSchema(timeline_events).omit({
  id: true,
  created_at: true,
  updated_at: true,
});

export const insertTodoTaskSchema = createInsertSchema(todo_tasks).omit({
  id: true,
  created_at: true,
  updated_at: true,
});

// Types for new tables
export type TimelineEvent = typeof timeline_events.$inferSelect;
export type InsertTimelineEvent = z.infer<typeof insertTimelineEventSchema>;

export type TodoTask = typeof todo_tasks.$inferSelect;
export type InsertTodoTask = z.infer<typeof insertTodoTaskSchema>;


