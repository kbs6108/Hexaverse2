"use client";
import { createContext, useContext, useState } from "react";
import type { DemoUser } from "./types";

export const demoUsers: DemoUser[] = [
  { id: "ravi", name: "Ravi Kumar", role: "citizen" }, { id: "lakshmi", name: "Lakshmi Devi", role: "citizen" },
  { id: "anitha", name: "Anitha", role: "officer", department: "revenue" }, { id: "suresh", name: "Suresh", role: "officer", department: "registration" },
  { id: "farida", name: "Farida", role: "officer", department: "planning" }, { id: "admin", name: "Admin", role: "admin" },
];
const AuthContext = createContext<{ user: DemoUser; setUser: (id: string) => void }>({ user: demoUsers[0], setUser: () => undefined });
export function AuthProvider({ children }: { children: React.ReactNode }) { const [user, setUserState] = useState(demoUsers[0]); return <AuthContext.Provider value={{ user, setUser: (id) => setUserState(demoUsers.find((item) => item.id === id) ?? demoUsers[0]) }}>{children}</AuthContext.Provider>; }
export function useAuth() { return useContext(AuthContext); }
