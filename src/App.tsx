import React, { useState } from 'react';
import CustomerSuccessManager, { RecommendationType, Candidate } from './CustomerSuccessManager';
import { sampleCandidates } from './sampleData';
import { resumeParser } from './resumeParser';
import './App.css';

function App() {
  const [candidates, setCandidates] = useState(sampleCandidates);

  const handleRecommendationChange = (candidateId: string, recommendation: RecommendationType) => {
    setCandidates(prevCandidates =>
      prevCandidates.map(candidate =>
        candidate.id === candidateId
          ? { ...candidate, recommendation }
          : candidate
      )
    );
    
    console.log(`Candidate ${candidateId} recommendation changed to: ${recommendation}`);
  };

  const handleResumeUpload = async (file: File) => {
    try {
      console.log(`Processing resume: ${file.name}`);
      
      // Parse the resume file
      const resumeText = await resumeParser.parseFile(file);
      console.log('Raw parsed text from file:', resumeText);
      console.log('First 500 characters:', resumeText.substring(0, 500));
      console.log('Lines breakdown:', resumeText.split('\n').slice(0, 10));
      
      // Extract structured data from the resume
      const parsedData = resumeParser.extractResumeData(resumeText);
      console.log('Extracted structured data:', parsedData);
      console.log('Extracted name specifically:', parsedData.name);
      
      // Generate a new candidate from the parsed data
      const newCandidate = resumeParser.generateCandidateFromResume(parsedData);
      console.log('Generated candidate:', newCandidate);
      
      // Add the new candidate to the list
      setCandidates(prevCandidates => [...prevCandidates, newCandidate]);
      
      alert(`Successfully added candidate: ${newCandidate.name}`);
    } catch (error) {
      console.error('Error processing resume:', error);
      alert(`Failed to process resume: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

  return (
    <div className="App">
      <CustomerSuccessManager
        candidates={candidates}
        onRecommendationChange={handleRecommendationChange}
        onResumeUpload={handleResumeUpload}
      />
    </div>
  );
}

export default App;