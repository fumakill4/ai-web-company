import { createCallerClient } from '@/lib/supabase';
import { createOrchestratorHandler } from '@/lib/orchestrator';
export const POST = createOrchestratorHandler(createCallerClient);
