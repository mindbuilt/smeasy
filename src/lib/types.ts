import type { Database } from "./database.types";

type Row<T extends keyof Database["public"]["Tables"]> = Database["public"]["Tables"][T]["Row"];

export type Business = Row<"businesses">;
export type Staff = Row<"staff">;
export type Roster = Row<"rosters">;
export type Shift = Row<"shifts">;
export type TimeOff = Row<"time_off">;

export interface PayrollSettings {
  platform?: "xero" | "myob" | "csv";
}
