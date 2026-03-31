// Participant auth utilities — lightweight email+password auth for pool participants
// Uses Web Crypto API for password hashing (SHA-256 + salt)

const SESSION_KEY = (poolId) => `cowtown_participant_${poolId}`;

/**
 * Generate a random salt for password hashing
 */
export function generateSalt() {
  const array = new Uint8Array(16);
  crypto.getRandomValues(array);
  return Array.from(array).map(b => b.toString(16).padStart(2, '0')).join('');
}

/**
 * Hash a password with a salt using SHA-256
 */
export async function hashPassword(password, salt) {
  const data = new TextEncoder().encode(salt + password);
  const hash = await crypto.subtle.digest('SHA-256', data);
  return Array.from(new Uint8Array(hash)).map(b => b.toString(16).padStart(2, '0')).join('');
}

/**
 * Verify a password against a stored hash
 */
export async function verifyPassword(password, salt, storedHash) {
  const hash = await hashPassword(password, salt);
  return hash === storedHash;
}

/**
 * Save participant session to localStorage
 */
export function saveSession(poolId, participant) {
  const session = {
    participant_name: participant.participant_name,
    email: participant.email,
    entry_id: participant.entry_id,
    pool_id: poolId,
    logged_in_at: new Date().toISOString(),
  };
  localStorage.setItem(SESSION_KEY(poolId), JSON.stringify(session));
  return session;
}

/**
 * Get saved session from localStorage
 */
export function getSession(poolId) {
  try {
    const raw = localStorage.getItem(SESSION_KEY(poolId));
    if (!raw) return null;
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

/**
 * Clear participant session
 */
export function clearSession(poolId) {
  localStorage.removeItem(SESSION_KEY(poolId));
}

/**
 * Find a pool entry that matches the given email
 * Checks the user_id field (which stores comma-separated emails)
 */
export function findEntryByEmail(entries, email) {
  const normalizedEmail = email.trim().toLowerCase();
  return entries.find(entry => {
    if (!entry.user_id || entry.user_id === 'manual') return false;
    const emails = entry.user_id.split(',').map(e => e.trim().toLowerCase());
    return emails.includes(normalizedEmail);
  });
}
