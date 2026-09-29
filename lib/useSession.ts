import React, { createContext, useContext, useState } from 'react';
import { SessionUser } from './auth';

export interface SessionContext {
  user: SessionUser | null;
  setUser: (u: SessionUser | null) => void;
}

export const SessionCtx = createContext<SessionContext>({
  user: null,
  setUser: () => {},
});

export function useSession() {
  return useContext(SessionCtx);
}
