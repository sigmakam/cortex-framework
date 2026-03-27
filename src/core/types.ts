import type { NextRequest } from "next/server";

// --- Domain Events ---

export interface DomainEvent {
  id: string;
  type: string;
  module: string;
  payload: Record<string, unknown>;
  metadata: {
    timestamp: Date;
    correlationId?: string;
  };
}

export type EventHandler = (event: DomainEvent) => Promise<void>;

export interface EventFilter {
  type?: string;
  module?: string;
  since?: Date;
  limit?: number;
}

export interface EventDefinitions {
  publishes: string[];
  subscribers: Record<string, EventHandler>;
}

// --- API ---

export interface ApiContext {
  params: Record<string, string>;
  searchParams: Record<string, string>;
  body?: unknown;
}

export type ApiHandler = (ctx: ApiContext) => Promise<ToolResponse>;

// --- Tool Response (shared by API + MCP) ---

export interface ToolResponse {
  success: boolean;
  data?: unknown;
  error?: {
    code: string;
    message: string;
    aiHint?: string;
  };
  metadata?: {
    total?: number;
    page?: number;
    perPage?: number;
    executionTimeMs?: number;
  };
}

// --- Data Layer ---

export interface DataLayerMapping {
  domainEvent: string;
  dataLayerEvent: string;
  params: string[];
}

export interface DataLayerPush {
  event: string;
  [key: string]: unknown;
}

// --- MCP Tools ---

export interface McpTool {
  name: string;
  description: string;
  inputSchema: Record<string, unknown>;
  handler: (input: Record<string, unknown>) => Promise<ToolResponse>;
}

// --- Module ---

export interface ModuleManifest {
  id: string;
  name: string;
  version: string;
  description: string;
  enabled: boolean;
  dependencies: string[];
  entities: string[];
  events: {
    publishes: string[];
    subscribes: string[];
  };
  dataLayer: Record<string, { event: string; params: string[] }>;
}

export interface CortexModule {
  id: string;
  name: string;
  version: string;
  description: string;
  enabled: boolean;
  dependencies: string[];
  path: string;
  entities: Record<string, unknown>;
  apiHandlers: Record<string, ApiHandler>;
  mcpTools: McpTool[];
  events: EventDefinitions;
  dataLayerMappings: DataLayerMapping[];
  agentsMd: string;
}
