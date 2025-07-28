import { 
  type User, type UpsertUser,
  type TimelineEvent, type InsertTimelineEvent,
  type TodoTask, type InsertTodoTask,
  type RoadshowCounterparty, type InsertRoadshowCounterparty,
  type RoadshowContact, type InsertRoadshowContact,
  type RoadshowEvent, type InsertRoadshowEvent,
  type RoadshowPhase2, type InsertRoadshowPhase2,
  users, timeline_events, todo_tasks,
  roadshow_counterparty, roadshow_contact, roadshow_event, roadshow_phase2, roadshow_owner
} from "@shared/schema";
import { db } from "./db";
import { eq, desc, sql, and, gte } from "drizzle-orm";

export class SimpleStorage {
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

  // Todo Tasks
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

  // Roadshow Counterparties
  async getRoadshowCounterparties(projectId: number): Promise<RoadshowCounterparty[]> {
    return await db.select()
      .from(roadshow_counterparty)
      .where(eq(roadshow_counterparty.project_id, projectId))
      .orderBy(
        // Custom ordering: Live > Waiting > No-go
        desc(roadshow_counterparty.status)
      );
  }

  async createRoadshowCounterparty(counterparty: InsertRoadshowCounterparty): Promise<RoadshowCounterparty> {
    const [created] = await db.insert(roadshow_counterparty).values(counterparty).returning();
    return created;
  }

  async updateRoadshowCounterparty(id: number, counterparty: Partial<InsertRoadshowCounterparty>): Promise<RoadshowCounterparty | undefined> {
    const [updated] = await db
      .update(roadshow_counterparty)
      .set({ ...counterparty, updated_at: new Date() })
      .where(eq(roadshow_counterparty.id, id))
      .returning();
    return updated;
  }

  async getAllRoadshowCounterparties(): Promise<RoadshowCounterparty[]> {
    return await db.select()
      .from(roadshow_counterparty)
      .orderBy(roadshow_counterparty.name);
  }

  async deleteRoadshowCounterparty(id: number): Promise<boolean> {
    const result = await db.delete(roadshow_counterparty).where(eq(roadshow_counterparty.id, id));
    return result.rowCount ? result.rowCount > 0 : false;
  }

  // Roadshow Contacts
  async getRoadshowContacts(counterpartyId: number): Promise<RoadshowContact[]> {
    return await db.select()
      .from(roadshow_contact)
      .where(eq(roadshow_contact.counterparty_id, counterpartyId));
  }

  async createRoadshowContact(contact: InsertRoadshowContact): Promise<RoadshowContact> {
    const [created] = await db.insert(roadshow_contact).values(contact).returning();
    return created;
  }

  async updateRoadshowContact(id: number, contact: Partial<InsertRoadshowContact>): Promise<RoadshowContact | undefined> {
    const [updated] = await db
      .update(roadshow_contact)
      .set({ ...contact, updated_at: new Date() })
      .where(eq(roadshow_contact.id, id))
      .returning();
    return updated;
  }

  // Roadshow Events
  async getRoadshowEvents(counterpartyId: number): Promise<RoadshowEvent[]> {
    return await db.select()
      .from(roadshow_event)
      .where(eq(roadshow_event.counterparty_id, counterpartyId))
      .orderBy(desc(roadshow_event.event_date));
  }

  async createRoadshowEvent(event: InsertRoadshowEvent): Promise<RoadshowEvent> {
    const [created] = await db.insert(roadshow_event).values(event).returning();
    
    // If it's a followup event, recalculate next_followup_date
    if (event.type === 'followup') {
      await this.updateNextFollowupDate(event.counterparty_id);
    }
    
    return created;
  }

  async getRoadshowEventsByProject(projectId: number): Promise<RoadshowEvent[]> {
    return await db.select({
      id: roadshow_event.id,
      counterparty_id: roadshow_event.counterparty_id,
      type: roadshow_event.type,
      label: roadshow_event.label,
      content: roadshow_event.content,
      event_date: roadshow_event.event_date,
      meta: roadshow_event.meta,
      created_by: roadshow_event.created_by,
      created_at: roadshow_event.created_at
    })
      .from(roadshow_event)
      .innerJoin(roadshow_counterparty, eq(roadshow_event.counterparty_id, roadshow_counterparty.id))
      .where(eq(roadshow_counterparty.project_id, projectId))
      .orderBy(desc(roadshow_event.event_date));
  }

  async getRoadshowEventsByProjectAndDateRange(projectId: number, startDate: Date, endDate: Date): Promise<any[]> {
    console.log(`Fetching events for project ${projectId} between ${startDate.toISOString().split('T')[0]} and ${endDate.toISOString().split('T')[0]}`);
    
    const events = await db.select({
      counterpartyId: roadshow_event.counterparty_id,
      counterpartyName: roadshow_counterparty.name,
      type: roadshow_event.type,
      label: roadshow_event.label,
      content: roadshow_event.content,
      event_date: roadshow_event.event_date,
      meta: roadshow_event.meta,
      created_by: roadshow_event.created_by
    })
      .from(roadshow_event)
      .innerJoin(roadshow_counterparty, eq(roadshow_event.counterparty_id, roadshow_counterparty.id))
      .where(and(
        eq(roadshow_counterparty.project_id, projectId),
        gte(roadshow_event.event_date, startDate.toISOString().split('T')[0]),
        sql`${roadshow_event.event_date} <= ${endDate.toISOString().split('T')[0]}`
      ))
      .orderBy(roadshow_event.event_date);
    
    console.log(`Found ${events.length} events with counterparty data:`, events.map(e => ({ 
      type: e.type, 
      counterpartyName: e.counterpartyName,
      date: e.event_date 
    })));
    
    return events;
  }

  async getLatestRoadshowEvent(counterpartyId: number, type: string): Promise<RoadshowEvent | undefined> {
    const [event] = await db.select()
      .from(roadshow_event)
      .where(eq(roadshow_event.counterparty_id, counterpartyId))
      .orderBy(desc(roadshow_event.event_date))
      .limit(1);
    return event;
  }

  // Roadshow Phase 2
  async getRoadshowPhase2(counterpartyId: number): Promise<RoadshowPhase2 | undefined> {
    const [phase2] = await db.select()
      .from(roadshow_phase2)
      .where(eq(roadshow_phase2.counterparty_id, counterpartyId));
    return phase2;
  }

  async createOrUpdateRoadshowPhase2(counterpartyId: number, phase2Data: Partial<InsertRoadshowPhase2>): Promise<RoadshowPhase2> {
    const existing = await this.getRoadshowPhase2(counterpartyId);
    
    if (existing) {
      const [updated] = await db
        .update(roadshow_phase2)
        .set({ ...phase2Data, updated_at: new Date() })
        .where(eq(roadshow_phase2.counterparty_id, counterpartyId))
        .returning();
      return updated;
    } else {
      const [created] = await db
        .insert(roadshow_phase2)
        .values({ counterparty_id: counterpartyId, ...phase2Data })
        .returning();
      return created;
    }
  }

  // Roadshow Weekly Summary
  async getRoadshowWeeklySummary(projectId: number, weekNumber: number, year: number = new Date().getFullYear()): Promise<any> {
    // Calculate start and end dates for the week
    const startDate = new Date(year, 0, 1 + (weekNumber - 1) * 7);
    const endDate = new Date(year, 0, 1 + weekNumber * 7);

    // Get all events for the project in that week
    const events = await db.select({
      type: roadshow_event.type,
      label: roadshow_event.label,
      counterparty_name: roadshow_counterparty.name,
      event_date: roadshow_event.event_date
    })
    .from(roadshow_event)
    .innerJoin(roadshow_counterparty, eq(roadshow_event.counterparty_id, roadshow_counterparty.id))
    .where(eq(roadshow_counterparty.project_id, projectId));

    return { events, weekNumber, year };
  }

  // Get latest event by type for a counterparty
  async getLatestEventByType(counterpartyId: number, eventType: string): Promise<RoadshowEvent | undefined> {
    const [event] = await db.select()
      .from(roadshow_event)
      .where(eq(roadshow_event.counterparty_id, counterpartyId))
      .orderBy(desc(roadshow_event.event_date))
      .limit(1);
    return event;
  }

  // Get count of events by type for a counterparty
  async getEventCountByType(counterpartyId: number, eventType: string): Promise<number> {
    const result = await db.select({ count: sql`count(*)` })
      .from(roadshow_event)
      .where(eq(roadshow_event.counterparty_id, counterpartyId));
    return Number(result[0]?.count || 0);
  }

  // Calculate next followup date (last followup + 5 days)
  async calculateNextFollowupDate(counterpartyId: number): Promise<string | null> {
    const latestFollowup = await this.getLatestEventByType(counterpartyId, 'followup');
    if (!latestFollowup) return null;
    
    const followupDate = new Date(latestFollowup.event_date);
    followupDate.setDate(followupDate.getDate() + 5);
    return followupDate.toISOString().split('T')[0];
  }



  // Roadshow owners multi-assignment
  async getRoadshowOwners(counterpartyId: number): Promise<string[]> {
    const owners = await db.select({ user_id: roadshow_owner.user_id })
      .from(roadshow_owner)
      .where(eq(roadshow_owner.counterparty_id, counterpartyId));
    
    return owners.map(o => o.user_id);
  }

  async updateRoadshowOwners(counterpartyId: number, ownerIds: string[]): Promise<void> {
    await db.transaction(async (tx) => {
      // Delete existing owners
      await tx.delete(roadshow_owner)
        .where(eq(roadshow_owner.counterparty_id, counterpartyId));
      
      // Insert new owners
      if (ownerIds.length > 0) {
        await tx.insert(roadshow_owner)
          .values(ownerIds.map(userId => ({ 
            counterparty_id: counterpartyId, 
            user_id: userId 
          })));
      }
    });
  }

  // Helper function to update next_followup_date
  async updateNextFollowupDate(counterpartyId: number): Promise<void> {
    const today = new Date().toISOString().split('T')[0];
    
    // Find the next followup date (closest future followup)
    const [nextFollowup] = await db.select({ event_date: roadshow_event.event_date })
      .from(roadshow_event)
      .where(and(
        eq(roadshow_event.counterparty_id, counterpartyId),
        eq(roadshow_event.type, 'followup'),
        gte(roadshow_event.event_date, today)
      ))
      .orderBy(roadshow_event.event_date)
      .limit(1);
    
    // Update the counterparty with the next followup date (or null if none)
    await db.update(roadshow_counterparty)
      .set({ 
        next_followup_date: nextFollowup?.event_date || null,
        updated_at: new Date()
      })
      .where(eq(roadshow_counterparty.id, counterpartyId));
  }

  // Roadshow deletion methods
  async deleteRoadshowEvent(id: number): Promise<boolean> {
    // Get the event before deleting to check if it's a followup
    const [eventToDelete] = await db.select()
      .from(roadshow_event)
      .where(eq(roadshow_event.id, id))
      .limit(1);
    
    const [deleted] = await db.delete(roadshow_event).where(eq(roadshow_event.id, id)).returning();
    
    // If it was a followup event, recalculate next_followup_date
    if (eventToDelete && eventToDelete.type === 'followup') {
      await this.updateNextFollowupDate(eventToDelete.counterparty_id);
    }
    
    return !!deleted;
  }

  async deleteRoadshowContact(id: number): Promise<boolean> {
    const [deleted] = await db.delete(roadshow_contact).where(eq(roadshow_contact.id, id)).returning();
    return !!deleted;
  }

}

export const simpleStorage = new SimpleStorage();