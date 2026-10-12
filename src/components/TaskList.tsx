'use client';
import { useEffect, useState } from 'react';
import { supabaseClient } from '@/lib/supabase-client';
import { CheckCircle2, Clock, AlertTriangle, PlayCircle } from 'lucide-react';

type Task = {
  id: string;
  title: string;
  description: string;
  status: string;
  risk_level: string;
  created_at: string;
  websites?: { name: string };
};

export default function TaskList({ refreshTrigger }: { refreshTrigger: number }) {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchTasks = async () => {
    setLoading(true);
    if (!supabaseClient) { setTasks([]); setLoading(false); return; }
    const { data: { session } } = await supabaseClient.auth.getSession();
    if (!session) { setTasks([]); setLoading(false); return; }
    const { data } = await supabaseClient
      .from('tasks')
      .select('*, websites(name)')
      .eq('created_by', session.user.id)
      .order('created_at', { ascending: false })
      .limit(5);
      
    setTasks(data || []);
    setLoading(false);
  };

  useEffect(() => {
    fetchTasks();
  }, [refreshTrigger]);

  const getStatusIcon = (status: string) => {
    switch(status) {
      case 'completed': return <CheckCircle2 className="text-success" size={18} />;
      case 'running': return <PlayCircle className="text-accent" size={18} />;
      case 'queued': return <Clock className="text-muted" size={18} />;
      default: return <AlertTriangle className="text-warning" size={18} />;
    }
  };

  return (
    <section className="glass-panel" style={{ padding: '24px' }}>
      <h2 style={{ marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '8px' }}>
        Execution Log
      </h2>
      
      {loading ? (
        <div className="flex-center" style={{ height: '100px' }}>
          <span className="text-muted">Scanning databanks...</span>
        </div>
      ) : tasks.length === 0 ? (
        <div className="empty-state">
          No tasks found. Give the Master Orchestrator a command above.
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {tasks.map(task => (
            <div key={task.id} className="task-row">
              <div className="task-icon-wrapper">
                {getStatusIcon(task.status)}
              </div>
              <div className="task-content">
                <strong className="task-title">{task.title}</strong>
                <span className="task-meta">
                  {task.websites?.name || 'Global'} • {new Date(task.created_at).toLocaleTimeString()}
                </span>
                {task.risk_level === 'high' && (
                  <span className="badge-warning" style={{ marginTop: '4px', display: 'inline-block' }}>Needs Approval</span>
                )}
              </div>
              <div className="task-status-label">
                {task.status.toUpperCase()}
              </div>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
