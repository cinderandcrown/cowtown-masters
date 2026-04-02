import React, { createContext, useState, useContext, useCallback } from 'react';
import { getSession, saveSession, clearSession } from '@/lib/participantAuth';

const ParticipantContext = createContext();

export function ParticipantProvider({ poolId, children }) {
  const [participant, setParticipant] = useState(() => getSession(poolId));

  const login = useCallback((participantData) => {
    const session = saveSession(poolId, participantData);
    setParticipant(session);
  }, [poolId]);

  const logout = useCallback(() => {
    clearSession(poolId);
    setParticipant(null);
  }, [poolId]);

  const isLoggedIn = !!participant;

  return (
    <ParticipantContext.Provider value={{ participant, isLoggedIn, login, logout }}>
      {children}
    </ParticipantContext.Provider>
  );
}

const FALLBACK = { participant: null, isLoggedIn: false, login: () => {}, logout: () => {} };

export function useParticipant() {
  const context = useContext(ParticipantContext);
  return context || FALLBACK;
}