/**
 * AfriChat Connect - Global Production Configuration
 * 
 * Strict Production Flags:
 * - USE_MOCK_DATA is locked to FALSE.
 * - IS_DEMO is locked to FALSE.
 * - All services connect directly to real Supabase & Firebase production clients.
 */

export const USE_MOCK_DATA = false;
export const IS_DEMO = false;
export const IS_PRODUCTION = true;
export const EMPTY_STATE_MESSAGE = 'Aucune donnée réelle disponible';
