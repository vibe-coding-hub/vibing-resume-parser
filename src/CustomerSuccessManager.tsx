import React, { useState } from 'react';
import './CustomerSuccessManager.css';

interface Experience {
  role: string;
  company: string;
  period: string;
  logo?: string;
}

export type RecommendationType = 'approve' | 'hold' | 'reject';

export interface Candidate {
  id: string;
  name: string;
  location: string;
  currentRole: string;
  currentCompany: string;
  score: number;
  experiences: Experience[];
  strengths: string[];
  weaknesses: string[];
  recommendation: RecommendationType;
  resumeFile?: File;
  resumeFileName?: string;
}

interface CustomerSuccessManagerProps {
  candidates: Candidate[];
  onRecommendationChange: (candidateId: string, recommendation: RecommendationType) => void;
  onResumeUpload: (files: File[]) => Promise<void>;
  jdResumeSection?: React.ReactNode;
}

const CustomerSuccessManager: React.FC<CustomerSuccessManagerProps> = ({
  candidates,
  onRecommendationChange,
  onResumeUpload,
  jdResumeSection
}) => {
  const [isUploading, setIsUploading] = useState(false);
  const getScoreColor = (score: number): string => {
    if (score >= 8.5) return '#4CAF50'; // Green
    if (score >= 7.5) return '#FF9800'; // Orange
    return '#F44336'; // Red
  };

  const getScorePercentage = (score: number): number => {
    return (score / 10) * 100;
  };

  const renderCircularScore = (score: number) => {
    const percentage = getScorePercentage(score);
    const color = getScoreColor(score);
    const strokeDasharray = `${percentage * 2.51}, 251.2`; // 2πr where r=40

    return (
      <div className="score-circle">
        <svg width="80" height="80" viewBox="0 0 80 80">
          <circle
            cx="40"
            cy="40"
            r="35"
            fill="none"
            stroke="#e0e0e0"
            strokeWidth="8"
          />
          <circle
            cx="40"
            cy="40"
            r="35"
            fill="none"
            stroke={color}
            strokeWidth="8"
            strokeLinecap="round"
            strokeDasharray={strokeDasharray}
            strokeDashoffset="0"
            transform="rotate(-90 40 40)"
            className="score-progress"
          />
        </svg>
        <div className="score-text">{score}</div>
      </div>
    );
  };

  const handleBulkFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (files && files.length > 0) {
      setIsUploading(true);
      const allowedTypes = ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'text/plain'];
      const validFiles: File[] = [];
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        if (allowedTypes.includes(file.type)) {
          validFiles.push(file);
        } else {
          alert(`Please upload valid resume files (PDF, DOC, DOCX, or TXT). Skipped: ${file.name}`);
        }
      }
      if (validFiles.length > 0) {
        try {
          await onResumeUpload(validFiles);
        } catch (error) {
          alert(`Error processing resumes: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
      }
      setIsUploading(false);
      event.target.value = '';
    }
  };

  const renderUploadSection = () => (
    <div className="upload-section">
      <div className="upload-header">
        <h2>📄 Resume Upload & Analysis</h2>
        <p>Upload candidate resumes to automatically extract and analyze candidate information</p>
      </div>
      <div className="upload-form">
        <input
          type="file"
          id="bulk-resume-upload"
          accept=".pdf,.doc,.docx,.txt"
          onChange={handleBulkFileUpload}
          style={{ display: 'none' }}
          multiple
          disabled={isUploading}
        />
        <label htmlFor="bulk-resume-upload" className={`bulk-upload-button ${isUploading ? 'uploading' : ''}`}>
          {isUploading ? (
            <>⏳ Processing Resumes...</>
          ) : (
            <>🤖 Upload & Scan Resumes</>
          )}
        </label>
        <div className="upload-info">
          <span>✨ AI-powered parsing • Automatic scoring • Smart recommendations</span>
          <br />
          <small>Supported formats: PDF, DOC, DOCX, TXT</small>
        </div>
      </div>
    </div>
  );

  const renderRecommendationButtons = (candidateId: string, currentRecommendation: string) => (
    <div className="recommendation-buttons">
      <button
        className={`btn-approve ${currentRecommendation === 'approve' ? 'active' : ''}`}
        onClick={() => onRecommendationChange(candidateId, 'approve')}
      >
        Approve
      </button>
      <button
        className={`btn-hold ${currentRecommendation === 'hold' ? 'active' : ''}`}
        onClick={() => onRecommendationChange(candidateId, 'hold')}
      >
        Hold
      </button>
      <button
        className={`btn-reject ${currentRecommendation === 'reject' ? 'active' : ''}`}
        onClick={() => onRecommendationChange(candidateId, 'reject')}
      >
        Reject
      </button>
    </div>
  );

  return (
    <div className="customer-success-manager">
      <header className="header">
        <div className="logo">🎯</div>
        <h1>Customer Success Manager</h1>
      </header>
      {jdResumeSection}
      <div className="content">
        {renderUploadSection()}
        
        <div className="section-headers">
          <div className="section-header">Candidates</div>
          <div className="section-header">Score</div>
          <div className="section-header">Experience</div>
          <div className="section-header">Details</div>
          <div className="section-header">Recommendation</div>
        </div>

        <div className="candidates-list">
          {candidates.map((candidate) => (
            <div key={candidate.id} className="candidate-row">
              {/* Candidate Info */}
              <div className="candidate-info">
                <div className="candidate-basic">
                  <h3 className="candidate-name">{candidate.name}</h3>
                  <div className="candidate-location">📍 {candidate.location}</div>
                  <div className="candidate-role">
                    👤 {candidate.currentRole}
                  </div>
                  <div className="candidate-company">
                    🏢 {candidate.currentCompany}
                  </div>
                </div>
              </div>
              {/* Score Column */}
              <div className="candidate-score">
                {renderCircularScore(candidate.score)}
              </div>
              {/* Experience */}
              <div className="candidate-experience">
                {candidate.experiences.map((exp, index) => (
                  <div key={index} className="experience-item">
                    <div className="experience-icon">
                      {exp.company === 'Zendesk' && '🎫'}
                      {exp.company === 'Freshworks' && '🟡'}
                      {exp.company === 'Monday.com' && '🔵'}
                      {exp.company === 'HubSpot' && '🟠'}
                      {exp.company === 'Drift' && '💬'}
                      {exp.company === 'Slack' && '💬'}
                      {exp.company === 'Salesforce' && '☁️'}
                      {exp.company === 'Lattice' && '🌿'}
                      {exp.company === 'Intercom' && '💬'}
                      {exp.company === 'Gainsight' && '📊'}
                    </div>
                    <div className="experience-details">
                      <div className="experience-role">{exp.role}</div>
                      <div className="experience-company">{exp.company}</div>
                      <div className="experience-period">{exp.period}</div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Details */}
              <div className="candidate-details">
                <div className="strengths">
                  <div className="detail-section-title">🟢 Strengths</div>
                  <ul>
                    {candidate.strengths.map((strength, index) => (
                      <li key={index}>{strength}</li>
                    ))}
                  </ul>
                </div>
                <div className="weaknesses">
                  <div className="detail-section-title">🔴 Weakness</div>
                  <ul>
                    {candidate.weaknesses.map((weakness, index) => (
                      <li key={index}>{weakness}</li>
                    ))}
                  </ul>
                </div>
              </div>

              {/* Recommendation */}
              <div className="candidate-recommendation">
                {renderRecommendationButtons(candidate.id, candidate.recommendation)}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default CustomerSuccessManager;