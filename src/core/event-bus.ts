import { v4 as uuid } from "uuid";
import { db } from "@/lib/db";
import { events as eventsTable } from "@/lib/schema";
import { desc, eq, and, gte } from "drizzle-orm";
import type { DomainEvent, EventHandler, EventFilter } from "./types";

class EventBusImpl {
  private subscribers = new Map<string, EventHandler[]>();
  private allSubscribers: EventHandler[] = [];

  subscribe(eventType: string, handler: EventHandler): void {
    const existing = this.subscribers.get(eventType) ?? [];
    existing.push(handler);
    this.subscribers.set(eventType, existing);
  }

  subscribeAll(handler: EventHandler): void {
    this.allSubscribers.push(handler);
  }

  async publish(event: Omit<DomainEvent, "id" | "metadata"> & { metadata?: Partial<DomainEvent["metadata"]> }): Promise<DomainEvent> {
    const fullEvent: DomainEvent = {
      id: uuid(),
      type: event.type,
      module: event.module,
      payload: event.payload,
      metadata: {
        timestamp: new Date(),
        correlationId: event.metadata?.correlationId,
      },
    };

    // Persist to database
    await db.insert(eventsTable).values({
      id: fullEvent.id,
      type: fullEvent.type,
      module: fullEvent.module,
      payload: fullEvent.payload,
      correlationId: fullEvent.metadata.correlationId ?? null,
    });

    // Notify specific subscribers
    const handlers = this.subscribers.get(fullEvent.type) ?? [];
    for (const handler of handlers) {
      try {
        await handler(fullEvent);
      } catch (err) {
        console.error(`Event handler error for ${fullEvent.type}:`, err);
      }
    }

    // Notify subscribeAll listeners
    for (const handler of this.allSubscribers) {
      try {
        await handler(fullEvent);
      } catch (err) {
        console.error(`Global event handler error for ${fullEvent.type}:`, err);
      }
    }

    return fullEvent;
  }

  async getHistory(filter: EventFilter = {}): Promise<DomainEvent[]> {
    const conditions = [];
    if (filter.type) conditions.push(eq(eventsTable.type, filter.type));
    if (filter.module) conditions.push(eq(eventsTable.module, filter.module));
    if (filter.since) conditions.push(gte(eventsTable.createdAt, filter.since));

    const rows = await db
      .select()
      .from(eventsTable)
      .where(conditions.length > 0 ? and(...conditions) : undefined)
      .orderBy(desc(eventsTable.createdAt))
      .limit(filter.limit ?? 100);

    return rows.map((row) => ({
      id: row.id,
      type: row.type,
      module: row.module,
      payload: row.payload,
      metadata: {
        timestamp: row.createdAt,
        correlationId: row.correlationId ?? undefined,
      },
    }));
  }
}

export const eventBus = new EventBusImpl();
