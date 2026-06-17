// Re-export the data store as the base44 client
// This provides backward compatibility for components that import from @/api/base44Client
export { db, base44, default } from '@/lib/data-store';