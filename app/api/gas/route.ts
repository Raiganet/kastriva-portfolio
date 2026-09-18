/** Compatibility endpoint for older cached PWA clients. The backend is Firebase/Firestore. */

export { POST } from '@/app/api/backend/route';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';