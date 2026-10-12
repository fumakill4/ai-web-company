// Created by i729
import type { SupabaseClient } from '@supabase/supabase-js';
export function createOrchestratorHandler(clientForToken: (token: string) => SupabaseClient) {
  return async function POST(request: Request) {
    const header = request.headers.get('authorization') || '';
    const token = header.startsWith('Bearer ') ? header.slice(7).trim() : '';
    if (!token) return Response.json({ error: 'Authentication required' }, { status: 401 });
    try {
      const client = clientForToken(token);
      const { data: { user }, error: authError } = await client.auth.getUser(token);
      if (authError || !user) return Response.json({ error: 'Invalid session' }, { status: 401 });
      let body;
      try { body = await request.json(); } catch { return Response.json({ error: 'Invalid JSON' }, { status: 400 }); }
      const instruction = body?.instruction;
      if (typeof instruction !== 'string' || !instruction.trim() || instruction.length > 4000) {
        return Response.json({ error: 'Instruction must contain 1–4000 characters' }, { status: 400 });
      }
      const { data: website, error: websiteError } = await client.from('websites')
        .select('id, name').eq('owner_id', user.id).ilike('name', '%GameHub%').limit(1).maybeSingle();
      if (websiteError) return Response.json({ error: 'Website access unavailable' }, { status: 503 });
      if (!website) return Response.json({ error: 'Website not found' }, { status: 404 });
      const { data: task, error } = await client.from('tasks').insert([{
        website_id: website.id, created_by: user.id, title: 'Delegated Instruction',
        description: instruction.trim(), task_type: 'general', priority: 'high', status: 'queued', risk_level: 'low'
      }]).select('id').single();
      if (error || !task) return Response.json({ error: 'Task creation unavailable' }, { status: 503 });
      return Response.json({ message: 'Instruction received.', task_id: task.id, target_website: website.name, status: 'queued' });
    } catch {
      return Response.json({ error: 'Service unavailable' }, { status: 503 });
    }
  };
}
