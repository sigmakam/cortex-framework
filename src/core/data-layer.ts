import { eventBus } from "./event-bus";
import { moduleRegistry } from "./module-registry";
import type { DomainEvent, DataLayerPush } from "./types";

class DataLayerService {
  private pendingPushes: DataLayerPush[] = [];

  init(): void {
    eventBus.subscribeAll(async (event: DomainEvent) => {
      const push = this.mapEventToDataLayer(event);
      if (push) {
        this.pendingPushes.push(push);
      }
    });
  }

  private mapEventToDataLayer(event: DomainEvent): DataLayerPush | null {
    const mappings = moduleRegistry.getAllDataLayerMappings();
    const mapping = mappings.find((m) => m.domainEvent === event.type);

    if (!mapping) return null;

    const push: DataLayerPush = { event: mapping.dataLayerEvent };
    for (const param of mapping.params) {
      if (event.payload[param] !== undefined) {
        push[param] = event.payload[param];
      }
    }
    push.cortex_module = event.module;
    push.cortex_event_id = event.id;
    push.cortex_timestamp = event.metadata.timestamp.toISOString();

    return push;
  }

  flush(): DataLayerPush[] {
    const pushes = [...this.pendingPushes];
    this.pendingPushes = [];
    return pushes;
  }
}

export const dataLayerService = new DataLayerService();
