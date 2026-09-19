import React, { useEffect, useState } from 'react';
import { getIncidentById, updateIncidentReview } from '../api/client';
import type { IncidentResponse } from '../api/client';
import { ShieldAlert, ArrowLeft, Check, X, Shield, Activity, Clock, CheckCircle } from 'lucide-react';
import { AnalysisResult } from './AnalysisResult';

interface IncidentDetailProps {
  incidentId: string;
  onBack: () => void;
}

export const IncidentDetail: React.FC<IncidentDetailProps> = ({ incidentId, onBack }) => {
  const [incident, setIncident] = useState<IncidentResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [comment, setComment] = useState('');

  useEffect(() => {
    fetchIncident();
  }, [incidentId]);

  const fetchIncident = async () => {
    setLoading(true);
    try {
      const data = await getIncidentById(incidentId);
      setIncident(data);
    } catch (err: any) {
      setError(err.message || 'Failed to load incident.');
    } finally {
      setLoading(false);
    }
  };

  const handleAction = async (status: string) => {
    if (!incident) return;
    setActionLoading(true);
    try {
      const updated = await updateIncidentReview(incident.id, { status, comments: comment });
      setIncident(updated);
      setComment('');
    } catch (err: any) {
      alert(`Failed to update review: ${err.message}`);
    } finally {
      setActionLoading(false);
    }
  };

  const getStatusIcon = (status: string) => {
    switch(status) {
      case 'human_review': return <ShieldAlert size={20} style={{ color: '#ef4444' }} />;
      case 'emerging': return <Activity size={20} style={{ color: '#f59e0b' }} />;
      case 'monitoring': return <Clock size={20} style={{ color: '#3b82f6' }} />;
      case 'self_solved': return <CheckCircle size={20} style={{ color: '#10b981' }} />;
      case 'approved': return <Shield size={20} style={{ color: '#10b981' }} />;
      case 'rejected': return <X size={20} style={{ color: '#ef4444' }} />;
      default: return <Clock size={20} style={{ color: 'var(--text-secondary)' }} />;
    }
  };

  if (loading) {
    return (
      <div className="animate-fade-in" style={{ padding: '4rem 2rem', textAlign: 'center' }}>
        <p style={{ color: 'var(--text-secondary)' }}>Loading incident...</p>
      </div>
    );
  }

  if (error || !incident) {
    return (
      <div className="animate-fade-in" style={{ padding: '4rem 2rem', textAlign: 'center' }}>
        <p style={{ color: '#ef4444' }}>{error || 'Incident not found'}</p>
        <button onClick={onBack} className="pill-button" style={{ marginTop: '1rem', padding: '8px 16px', backgroundColor: 'var(--surface)' }}>Back</button>
      </div>
    );
  }

  return (
    <div className="animate-fade-in" style={{ 
      maxWidth: '800px', 
      margin: '0 auto', 
      padding: '2rem',
      paddingTop: '6rem',
      paddingBottom: '8rem'
    }}>
      <button 
        onClick={onBack}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '0.5rem',
          color: 'var(--text-secondary)',
          background: 'none',
          border: 'none',
          cursor: 'pointer',
          padding: 0,
          marginBottom: '2rem',
          fontSize: '0.9rem'
        }}
      >
        <ArrowLeft size={16} /> Back to Queue
      </button>

      <div style={{
        backgroundColor: 'var(--surface)',
        border: '1px solid var(--glass-border)',
        borderRadius: '24px',
        padding: '2rem',
        marginBottom: '2rem'
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '2rem' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.5rem' }}>
              {getStatusIcon(incident.status)}
              <span style={{ 
                color: 'var(--text-primary)', 
                fontWeight: 600,
                textTransform: 'uppercase',
                letterSpacing: '1px'
              }}>
                {incident.status.replace('_', ' ')}
              </span>
            </div>
            <div style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
              ID: {incident.id} • {new Date(incident.createdAt).toLocaleString()}
            </div>
            {incident.recurrenceCount && incident.recurrenceCount > 1 && (
              <div style={{ color: '#f59e0b', fontSize: '0.9rem', marginTop: '0.5rem', fontWeight: 500 }}>
                Observed {incident.recurrenceCount} times
              </div>
            )}
          </div>
        </div>

        {/* Display Signals */}
        <div style={{ marginBottom: '2rem' }}>
          <h3 style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '1rem' }}>Original Signals</h3>
          {incident.signals?.map((sig) => (
            <div key={sig.id} style={{
              backgroundColor: 'var(--glass-bg)',
              padding: '1rem',
              borderRadius: '12px',
              border: '1px solid var(--glass-border)',
              marginBottom: '0.5rem'
            }}>
              <p style={{ color: 'var(--text-primary)', margin: 0, lineHeight: 1.5 }}>{sig.content}</p>
              {sig.location && (
                <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', margin: '0.5rem 0 0 0' }}>Location: {sig.location.description}</p>
              )}
            </div>
          ))}
        </div>

        {incident.analysis && (
          <div style={{ borderTop: '1px solid var(--border-color)', paddingTop: '2rem', marginTop: '2rem' }}>
            <h3 style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '1rem' }}>AI Interpretation</h3>
            <AnalysisResult result={incident} />
          </div>
        )}

        {incident.responsePacket && (
          <div style={{ borderTop: '1px solid var(--border-color)', paddingTop: '2rem', marginTop: '2rem' }}>
            <h3 style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '1rem' }}>Historical Context</h3>
            
            {incident.responsePacket.historicalContextAvailable ? (
              <div>
                <p style={{ color: 'var(--text-primary)', marginBottom: '1rem', fontSize: '0.95rem' }}>
                  Found {incident.responsePacket.relatedIncidents.length} related past incident(s).
                </p>
                {incident.responsePacket.relatedIncidents.map((related) => (
                  <div key={related.incidentId} style={{
                    backgroundColor: 'var(--glass-bg)',
                    padding: '1rem',
                    borderRadius: '12px',
                    border: '1px solid var(--glass-border)',
                    marginBottom: '0.5rem'
                  }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.5rem' }}>
                      <span style={{ color: 'var(--text-primary)', fontWeight: 500 }}>ID: {related.incidentId}</span>
                      <span style={{ 
                        fontSize: '0.8rem', 
                        padding: '2px 8px', 
                        borderRadius: '12px',
                        backgroundColor: 'var(--surface)',
                        border: '1px solid var(--glass-border)',
                        color: 'var(--text-secondary)'
                      }}>
                        Score: {related.searchMetadata.score.toFixed(2)} ({related.searchMetadata.relationship})
                      </span>
                    </div>
                    <p style={{ color: 'var(--text-primary)', margin: '0 0 0.5rem 0', fontSize: '0.95rem' }}>{related.summary}</p>
                    <div style={{ display: 'flex', gap: '1rem', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                      <span>Status: {related.status}</span>
                      {related.resolution && <span>Resolution: {related.resolution}</span>}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem' }}>No relevant historical incidents found.</p>
            )}
            
            <div style={{ marginTop: '1rem', padding: '1rem', backgroundColor: 'var(--surface)', borderRadius: '12px', border: '1px dashed var(--glass-border)' }}>
              <p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Activity size={14} /> Provenance: {incident.responsePacket.provenance}
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Review Actions */}
      {['human_review', 'emerging', 'new', 'monitoring'].includes(incident.status) && (
        <div style={{
          position: 'fixed',
          bottom: '2rem',
          left: '50%',
          transform: 'translateX(-50%)',
          backgroundColor: 'var(--surface)',
          border: '1px solid var(--glass-border)',
          borderRadius: '24px',
          padding: '1.5rem',
          width: 'calc(100% - 2rem)',
          maxWidth: '600px',
          boxShadow: '0 24px 60px rgba(0,0,0,0.5)',
          display: 'flex',
          flexDirection: 'column',
          gap: '1rem',
          zIndex: 100
        }}>
          <input 
            type="text" 
            placeholder="Add a comment to your decision (optional)..."
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            style={{
              width: '100%',
              backgroundColor: 'var(--glass-bg)',
              border: '1px solid var(--glass-border)',
              borderRadius: '12px',
              padding: '12px 16px',
              color: 'var(--text-primary)',
              fontSize: '0.95rem'
            }}
          />
          <div style={{ display: 'flex', gap: '1rem' }}>
            <button 
              onClick={() => handleAction('approved')}
              disabled={actionLoading}
              style={{
                flex: 1,
                padding: '12px',
                backgroundColor: 'rgba(16, 185, 129, 0.1)',
                border: '1px solid rgba(16, 185, 129, 0.3)',
                color: '#10b981',
                borderRadius: '12px',
                fontWeight: 500,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '0.5rem',
                cursor: actionLoading ? 'not-allowed' : 'pointer'
              }}
            >
              <Check size={18} /> Approve Action
            </button>
            <button 
              onClick={() => handleAction('rejected')}
              disabled={actionLoading}
              style={{
                flex: 1,
                padding: '12px',
                backgroundColor: 'rgba(239, 68, 68, 0.1)',
                border: '1px solid rgba(239, 68, 68, 0.3)',
                color: '#ef4444',
                borderRadius: '12px',
                fontWeight: 500,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '0.5rem',
                cursor: actionLoading ? 'not-allowed' : 'pointer'
              }}
            >
              <X size={18} /> Reject
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
