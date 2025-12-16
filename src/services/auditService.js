import { createAuditLog } from './api'; // Imports from the file above

export const logAuditEvent = async (action, details = {}) => {
    try {
        const user = JSON.parse(localStorage.getItem('user'));
        const auditPayload = {
            username: user?.username || 'UNKNOWN',
            action: action,
            details: JSON.stringify(details),
            timestamp: new Date().toISOString()
        };
        await createAuditLog(auditPayload);
    } catch (error) {
        // Silently fail in frontend, but log to console in dev
        console.warn("Failed to send audit log", error);
    }
};