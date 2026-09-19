import React, { useEffect, useState } from 'react';
import { getIncidents } from '../api/client';
import type { IncidentResponse } from '../api/client';
import { ShieldAlert, Activity, CheckCircle, Clock } from 'lucide-react';

interface ReviewQueueProps {
  onSelectIncident: (id: string) => void;
}

export const ReviewQueue: React.FC<ReviewQueueProps> = ({ onSelectIncident }) => {
  const [incidents, setIncidents] = useState<IncidentResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchIncidents = async () => {
      try {
        const data = await getIncidents();
        setIncidents(data);
      } catch (err: any) {
        setError(err.message || 'Failed to load queue.');
      } finally {
        setLoading(false);
      }
    };
    fetchIncidents();
  }, []);

  const getStatusIcon = (status: string) => {
    switch(status) {
      case 'human_review': return <ShieldAlert size={16} style={{ color: '#ef4444' }} />;
      case 'emerging': return <Activity size={16} style={{ color: '#f59e0b' }} />;
      case 'monitoring': return <Clock size={16} style={{ color: '#3b82f6' }} />;
      case 'self_solved': return <CheckCircle size={16} style={{ color: '#10b981' }} />;
      default: return <Clock size={16} style={{ color: 'var(--text-secondary)' }} />;
    }
  };

  const getStatusLabel = (status: string) => {
    switch(status) {
      case 'human_review': return 'Requires Review';
      case 'emerging': return 'Emerging Pattern';
      case 'monitoring': return 'Monitoring';
      case 'self_solved': return 'Self-Solved';
      default: return 'Analyzed';
    }
  };

  if (loading) {
    return (
      <div className="animate-fade-in" style={{ padding: '4rem 2rem', textAlign: 'center' }}>
        <p style={{ color: 'var(--text-secondary)' }}>Loading queue...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="animate-fade-in" style={{ padding: '4rem 2rem', textAlign: 'center' }}>
        <p style={{ color: '#ef4444' }}>{error}</p>
      </div>
    );
  }

  return (
    <div className="animate-fade-in" style={{ 
      maxWidth: '800px', 
      margin: '0 auto', 
      padding: '2rem',
      paddingTop: '6rem'
    }}>
      <div style={{ marginBottom: '2rem', display: 'flex', alignItems: 'center', gap: '1rem' }}>
        <ShieldAlert size={28} style={{ color: 'var(--accent)' }} />
        <h2 style={{ fontSize: '2rem', fontWeight: 500, color: 'var(--text-primary)' }}>Review Queue</h2>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        {incidents.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-secondary)', border: '1px dashed var(--glass-border)', borderRadius: '16px' }}>
            Queue is empty.
          </div>
        ) : (
          incidents.map((incident) => (
            <div 
              key={incident.id}
              onClick={() => onSelectIncident(incident.id)}
              style={{
                backgroundColor: 'var(--surface)',
                border: '1px solid var(--glass-border)',
                borderRadius: '16px',
                padding: '1.5rem',
                cursor: 'pointer',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                transition: 'all 0.2s ease',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = 'var(--surface-hover)';
                e.currentTarget.style.borderColor = 'var(--accent)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = 'var(--surface)';
                e.currentTarget.style.borderColor = 'var(--glass-border)';
              }}
            >
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                  {getStatusIcon(incident.status)}
                  <span style={{ 
                    color: 'var(--text-primary)', 
                    fontWeight: 500,
                    textTransform: 'uppercase',
                    fontSize: '0.85rem',
                    letterSpacing: '1px'
                  }}>
                    {getStatusLabel(incident.status)}
                  </span>
                  <span style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>• {new Date(incident.createdAt).toLocaleTimeString()}</span>
                </div>
                <div style={{ color: 'var(--text-primary)', fontSize: '1.1rem' }}>
                  {incident.category} / {incident.severity}
                </div>
              </div>
              <div style={{ color: 'var(--accent)' }}>
                →
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};
