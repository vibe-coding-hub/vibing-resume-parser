import React, { useState } from 'react';
import CustomerSuccessManager, { RecommendationType, Candidate } from './CustomerSuccessManager';
import JDResumeInput from './JDResumeInput';
import { generateCandidatesFromJD } from './sampleData';
import './App.css';
import * as pdfjsLib from 'pdfjs-dist/build/pdf';
import 'pdfjs-dist/build/pdf.worker.entry';

interface JDState {
  mustHave: string;
  niceToHave: string;
}

function App() {
  const [jd, setJD] = useState<JDState>({ mustHave: '', niceToHave: '' });
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [jdSubmitted, setJDSubmitted] = useState(false);
  const [resumeFiles, setResumeFiles] = useState<File[]>([]);
  const [showToast, setShowToast] = useState(false);
  const [editingJD, setEditingJD] = useState(false);
  const [jdChangedSinceScan, setJDChangedSinceScan] = useState(false);

  const handleRecommendationChange = (candidateId: string, recommendation: RecommendationType) => {
    setCandidates(prevCandidates =>
      prevCandidates.map(candidate =>
        candidate.id === candidateId
          ? { ...candidate, recommendation }
          : candidate
      )
    );
  };

  // Step 1: Submit JD only
  const handleJDSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setJDSubmitted(true);
    setEditingJD(false);
    setShowToast(true);
    setJDChangedSinceScan(false);
    setTimeout(() => setShowToast(false), 3000);
    // Automatically rescan candidates if resumes are uploaded
    if (resumeFiles.length > 0) {
      const texts = await Promise.all(resumeFiles.map(file => file.text()));
      const jdString = `Must Have: ${jd.mustHave}\nNice to Have: ${jd.niceToHave}`;
      const generated = generateCandidatesFromJD(jdString, texts);
      setCandidates(generated);
    }
  };

  // Allow editing JD
  const handleEditJD = () => {
    setEditingJD(true);
  };

  // Track JD changes after initial submit
  const handleJDChange = (newJD: JDState) => {
    setJD(newJD);
    if (jdSubmitted) {
      setJDChangedSinceScan(true);
    }
  };

  // Helper to extract text from PDF using pdfjs-dist
  async function extractTextFromPDF(file: File): Promise<string> {
    const arrayBuffer = await file.arrayBuffer();
    const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
    let text = '';
    for (let i = 1; i <= pdf.numPages; i++) {
      const page = await pdf.getPage(i);
      const content = await page.getTextContent();
      text += (content.items as { str?: string }[]).map(item => (item.str || '')).join(' ') + '\n';
    }
    return text;
  }

  // Step 2: When resumes are uploaded, generate candidates using stored JD
  const handleResumeUpload = async (files: File[]) => {
    setResumeFiles(files);
    if (jdSubmitted && files.length > 0) {
      const texts = await Promise.all(files.map(async file => {
        if (file.type === 'application/pdf') {
          return await extractTextFromPDF(file);
        } else {
          return await file.text();
        }
      }));
      const jdString = `Must Have: ${jd.mustHave}\nNice to Have: ${jd.niceToHave}`;
      const generated = generateCandidatesFromJD(jdString, texts);
      setCandidates(generated);
      setJDChangedSinceScan(false);
    }
  };

  // Rescan candidates after JD update
  const handleRescanCandidates = async () => {
    if (resumeFiles.length > 0) {
      const texts = await Promise.all(resumeFiles.map(async file => {
        if (file.type === 'application/pdf') {
          return await extractTextFromPDF(file);
        } else {
          return await file.text();
        }
      }));
      const jdString = `Must Have: ${jd.mustHave}\nNice to Have: ${jd.niceToHave}`;
      const generated = generateCandidatesFromJD(jdString, texts);
      setCandidates(generated);
      setJDChangedSinceScan(false);
    }
    setEditingJD(false);
  };

  return (
    <div className="App">
      {showToast && (
        <div className="toast-success">JD submitted successfully!</div>
      )}
      <CustomerSuccessManager
        candidates={candidates}
        onRecommendationChange={handleRecommendationChange}
        onResumeUpload={handleResumeUpload}
        jdResumeSection={
          <JDResumeInput
            jd={jd}
            setJD={handleJDChange}
            onSubmit={handleJDSubmit}
            readonly={jdSubmitted && !editingJD}
            onEdit={handleEditJD}
            showRescan={jdChangedSinceScan && resumeFiles.length > 0}
            onRescan={handleRescanCandidates}
          />
        }
      />
    </div>
  );
}

export default App;