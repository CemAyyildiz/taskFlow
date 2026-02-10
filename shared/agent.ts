import { EventEmitter } from "node:events";

// ─── Skill Definition ───────────────────────────────────────────────
export type SkillFn = (...args: any[]) => any | Promise<any>;

export interface SkillEntry {
  name: string;
  description: string;
  fn: SkillFn;
}

// ─── Agent Events ───────────────────────────────────────────────────
export type AgentEvent =
  | "task:created"
  | "task:accepted"
  | "task:completed"
  | "task:confirmed"
  | "payment:sent"
  | "payment:received";

// ─── Base Agent ─────────────────────────────────────────────────────
export class Agent extends EventEmitter {
  public readonly name: string;
  public readonly walletAddress: string;
  private skills: Map<string, SkillEntry> = new Map();

  constructor(name: string, walletAddress: string) {
    super();
    this.name = name;
    this.walletAddress = walletAddress;
  }

  /** Register a named skill the agent can execute */
  registerSkill(name: string, description: string, fn: SkillFn): void {
    this.skills.set(name, { name, description, fn });
    this.log(`Skill registered → ${name}`);
  }

  /** Execute a skill by name */
  async executeSkill(name: string, ...args: any[]): Promise<any> {
    const skill = this.skills.get(name);
    if (!skill) {
      throw new Error(`[${this.name}] Skill not found: ${name}`);
    }
    this.log(`Executing skill → ${name}`);
    const result = await skill.fn(...args);
    return result;
  }

  /** List all registered skills */
  listSkills(): SkillEntry[] {
    return [...this.skills.values()];
  }

  /** Convenience: emit a typed agent event with payload */
  emitEvent(event: AgentEvent, payload: Record<string, any>): void {
    this.log(`Event emitted → ${event}`);
    this.emit(event, { agent: this.name, ...payload });
  }

  /** Subscribe to another agent's events */
  subscribe(other: Agent, event: AgentEvent, handler: (...args: any[]) => void): void {
    other.on(event, handler);
    this.log(`Subscribed to ${other.name} → ${event}`);
  }

  /** Timestamped console log scoped to this agent */
  log(message: string): void {
    const ts = new Date().toISOString().slice(11, 19);
    console.log(`[${ts}] [${this.name}] ${message}`);
  }
}
