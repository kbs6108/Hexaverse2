export type Role = "citizen" | "officer" | "admin";
export type Department = "revenue" | "registration" | "planning";
export type ProvenanceState = "ok" | "failed" | "timeout";

export interface DemoUser {
  id: string;
  name: string;
  role: Role;
  department?: Department;
}

export interface Provenance {
  source: string;
  state: ProvenanceState;
}

export interface Parcel {
  identifiers: { ulpin: string; surveyNumber: string; village: string; district: string };
  owners: { name: string; share: string }[];
  rights: { title: string; holder: string; type: string }[];
  restrictions: string[];
  planning: { zone: string; landUse: string; permission: string };
  fiscal: { taxStatus: string; guidelineValue: string };
  utilities: string[];
  buildings: string[];
  alerts: string[];
  provenance: Provenance[];
  status: string[];
}

export interface Application { id: string; type: string; status: string; ulpin: string; updatedAt: string }
export interface Connector { department: Department; status: ProvenanceState; latencyMs: number }
