export interface StaffMember {
  id: number;
  name: string;
  canBeRostered: boolean;
}

export interface Shift {
  id: number;
  staffId: number;
  date: string;
  startTime: string;
  endTime: string;
  role: string;
  staff?: { name: string };
}

export interface TimeOff {
  id: number;
  staffId: number;
  date: string;
  reason: string;
  status: "Pending" | "Approved";
  staff?: { name: string };
}

export interface Roster {
  id: number;
  weekStart: string;
  weekEnd: string;
  status: "draft" | "published";
  publishedAt: string | null;
  shifts: Shift[];
}

export interface ApiRoster {
  id: number;
  weekStart: string;
  weekEnd?: string;
  status: "draft" | "published";
  publishedAt?: string | null;
}

export type ModalMode = "shift" | "timeoff";

export interface CellModalState {
  staffId: number;
  staffName: string;
  date: string;
  dayLabel: string;
  existingShift: Shift | null;
  existingTimeOff: TimeOff | null;
  mode: ModalMode;
  startTime: string;
  endTime: string;
  role: string;
  reason: string;
}
