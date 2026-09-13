/*
 * Backend integration seam. Replace these stubs with the documented endpoints:
 * GET /landstack/parcel/{ulpin}, POST /landstack/reports/{ulpin},
 * POST /landstack/verify-ownership, GET /landstack/applications?mine=1,
 * GET /landstack/applications/{id}, POST /landstack/applications,
 * GET /landstack/stats, GET /landstack/queue?department=,
 * POST /landstack/applications/{id}/transition, GET /landstack/alerts,
 * POST /alerts/{id}/assign, POST /alerts/{id}/resolve,
 * GET /landstack/connectors, GET /landstack/adapters, GET /landstack/consistency,
 * POST /landstack/admin/simulate/deed, POST /landstack/consents/grant,
 * POST /landstack/admin/demo-reset, POST /landstack/consents/request,
 * GET /verify/{reportId}.
 */
import type { Application, Connector, Parcel } from "./types";

const parcel: Parcel = {
  identifiers: { ulpin: "ULPIN-1403-PB-889", surveyNumber: "123/4", village: "Kharar", district: "SAS Nagar" },
  owners: [{ name: "Ravi Kumar", share: "1/1" }],
  rights: [{ title: "Record of Rights", holder: "Ravi Kumar", type: "Freehold" }],
  restrictions: ["No active restriction found"], planning: { zone: "Residential", landUse: "Agricultural", permission: "Eligible" },
  fiscal: { taxStatus: "Clear", guidelineValue: "₹42,00,000" }, utilities: ["Electricity connected", "Water line nearby"], buildings: ["No building record"],
  alerts: ["Mutation history available"], provenance: [{ source: "State RoR", state: "ok" }, { source: "Registration", state: "ok" }],
  status: ["registered", "change alert"],
};

export async function getParcel(_ulpin: string): Promise<Parcel> { // TODO(backend): GET /landstack/parcel/{ulpin}
  return parcel;
}
export async function downloadReport(_ulpin: string): Promise<void> { // TODO(backend): POST /landstack/reports/{ulpin}
  return Promise.resolve();
}
export async function verifyOwnership(_ulpin: string, _claimedName: string): Promise<{ match: boolean }> { // TODO(backend): POST /landstack/verify-ownership
  return { match: true };
}
export async function getApplications(): Promise<Application[]> { // TODO(backend): GET /landstack/applications?mine=1
  return [{ id: "APP-2048", type: "mutation", status: "document_check", ulpin: parcel.identifiers.ulpin, updatedAt: "Today" }];
}
export async function getApplication(_id: string): Promise<Application> { // TODO(backend): GET /landstack/applications/{id}
  return (await getApplications())[0];
}
export async function createApplication(_input: Record<string, string>): Promise<Application> { // TODO(backend): POST /landstack/applications
  return { id: "APP-DEMO", type: _input.type ?? "mutation", status: "submitted", ulpin: _input.ulpin ?? parcel.identifiers.ulpin, updatedAt: "Just now" };
}
export async function getStats(): Promise<Record<string, number>> { // TODO(backend): GET /landstack/stats
  return { queue: 18, alerts: 7, resolved: 42 };
}
export async function getQueue(_department?: string): Promise<Application[]> { // TODO(backend): GET /landstack/queue?department=
  return getApplications();
}
export async function transitionApplication(_id: string, _action: string, _remark: string): Promise<void> { // TODO(backend): POST /landstack/applications/{id}/transition
  return Promise.resolve();
}
export async function getConnectors(): Promise<Connector[]> { // TODO(backend): GET /landstack/connectors
  return [{ department: "revenue", status: "ok", latencyMs: 184 }, { department: "registration", status: "ok", latencyMs: 241 }, { department: "planning", status: "timeout", latencyMs: 3000 }];
}
export async function simulateDeed(_ulpin: string, _claimant: string): Promise<void> { // TODO(backend): POST /landstack/admin/simulate/deed
  return Promise.resolve();
}
export async function grantConsent(_ulpin: string, _user: string, _hours: string): Promise<void> { // TODO(backend): POST /landstack/consents/grant
  return Promise.resolve();
}
export async function resetDemo(): Promise<void> { // TODO(backend): POST /landstack/admin/demo-reset
  return Promise.resolve();
}
export async function verifyReport(_reportId: string): Promise<{ valid: boolean }> { // TODO(backend): GET /verify/{reportId}
  return { valid: true };
}
