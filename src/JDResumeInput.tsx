import React, { useState } from 'react';

interface JDResumeInputProps {
  jd: {
    mustHave: string;
    niceToHave: string;
  };
  setJD: (jd: { mustHave: string; niceToHave: string }) => void;
  onSubmit: (e: React.FormEvent) => void;
  readonly: boolean;
  onEdit: () => void;
  onRescan?: () => void;
  showRescan?: boolean;
}

const JDResumeInput: React.FC<JDResumeInputProps> = ({ jd, setJD, onSubmit, readonly, onEdit, onRescan, showRescan }) => (
  <div className="upload-section">
    <div className="jd-resume-section">
      <h2 style={{ fontSize: 22, fontWeight: 700, background: 'linear-gradient(135deg, #0ea5e9, #8b5cf6)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text', margin: 0, marginBottom: 8, display: 'flex', alignItems: 'center', gap: 8 }}>Job Description</h2>
      {readonly ? (
        <div>
          <div style={{ marginBottom: '1rem' }}>
            <label style={{ fontWeight: 600, color: '#666', fontSize: 14, textTransform: 'uppercase', letterSpacing: '0.5px' }}>Must Have Tech Skills:</label>
            <div style={{ background: '#f3f4f6', padding: 8, borderRadius: 4, border: '1px solid #e5e7eb', marginTop: 4 }}>{jd.mustHave}</div>
          </div>
          <div style={{ marginBottom: '2rem' }}>
            <label style={{ fontWeight: 600, color: '#666', fontSize: 14, textTransform: 'uppercase', letterSpacing: '0.5px' }}>Nice to Have Skills:</label>
            <div style={{ background: '#f3f4f6', padding: 8, borderRadius: 4, border: '1px solid #e5e7eb', marginTop: 4 }}>{jd.niceToHave}</div>
          </div>
          <button type="button" className="bulk-upload-button" style={{ marginRight: 16 }} onClick={onEdit}>Edit JD</button>
          {showRescan && onRescan && (
            <button type="button" className="bulk-upload-button" style={{ background: 'linear-gradient(135deg, #22d3ee 0%, #4ade80 100%)', marginLeft: 0 }} onClick={onRescan}>Rescan Candidates</button>
          )}
        </div>
      ) : (
        <form onSubmit={onSubmit}>
          <div style={{ marginBottom: '1rem' }}>
            <label htmlFor="jd-must-have" style={{ fontWeight: 600, color: '#666', fontSize: 14, textTransform: 'uppercase', letterSpacing: '0.5px' }}>Must Have Tech Skills:</label>
            <textarea
              id="jd-must-have"
              value={jd.mustHave || ''}
              onChange={e => setJD({ ...jd, mustHave: e.target.value })}
              rows={2}
              style={{ width: '100%', marginTop: 4, padding: 8, borderRadius: 4, border: '1px solid #ccc' }}
              placeholder="List must-have tech skills..."
              required
            />
          </div>
          <div style={{ marginBottom: '2rem' }}>
            <label htmlFor="jd-nice-to-have" style={{ fontWeight: 600, color: '#666', fontSize: 14, textTransform: 'uppercase', letterSpacing: '0.5px' }}>Nice to Have Skills:</label>
            <textarea
              id="jd-nice-to-have"
              value={jd.niceToHave || ''}
              onChange={e => setJD({ ...jd, niceToHave: e.target.value })}
              rows={2}
              style={{ width: '100%', marginTop: 4, padding: 8, borderRadius: 4, border: '1px solid #ccc' }}
              placeholder="List nice-to-have skills..."
            />
          </div>
          <button type="submit" className="bulk-upload-button" style={{ padding: '16px 32px', background: 'linear-gradient(135deg, #0ea5e9 0%, #8b5cf6 50%, #06b6d4 100%)', color: 'white', border: 'none', borderRadius: 12, fontSize: 16, fontWeight: 700, cursor: 'pointer', transition: 'all 0.3s ease', textAlign: 'center', boxShadow: '0 4px 15px rgba(14, 165, 233, 0.3)', position: 'relative', overflow: 'hidden' }}>Submit JD</button>
        </form>
      )}
    </div>
  </div>
);

export default JDResumeInput;
