import React, { createContext, useContext, useState, useCallback } from 'react';

// Roles: PUBLIC, ADMIN, CAPTAIN, PLAYER
export const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [role, setRole] = useState('PUBLIC');
  const [authenticatedId, setAuthenticatedId] = useState(null);

  const login = useCallback((newRole, id = null) => {
    setRole(newRole);
    setAuthenticatedId(id);
  }, []);

  const logout = useCallback(() => {
    setRole('PUBLIC');
    setAuthenticatedId(null);
  }, []);

  const value = { role, authenticatedId, login, logout };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
