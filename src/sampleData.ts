import { Candidate } from './CustomerSuccessManager';

// Function to generate candidates from JD and resume texts
export function generateCandidatesFromJD(jd: string, resumes: string[]): Candidate[] {
  // Extract must-have and nice-to-have skills from JD string
  const mustHaveMatch = jd.match(/Must Have:\s*(.*)/i);
  const niceToHaveMatch = jd.match(/Nice to Have:\s*(.*)/i);
  const mustHaveSkills = mustHaveMatch ? mustHaveMatch[1].split(',').map(s => s.trim()).filter(Boolean) : [];
  const niceToHaveSkills = niceToHaveMatch ? niceToHaveMatch[1].split(',').map(s => s.trim()).filter(Boolean) : [];
  const allSkills = [...mustHaveSkills, ...niceToHaveSkills];

  // Scoring weights
  const mustHaveWeight = 3;
  const niceToHaveWeight = 1;
  const maxScore = (mustHaveSkills.length * mustHaveWeight) + (niceToHaveSkills.length * niceToHaveWeight);

  return resumes.map((resume, idx) => {
    const lines = resume.split(/\r?\n/).map(l => l.trim()).filter(Boolean);
    let candidateName = 'Unknown';
    // Strictly check first 5 non-empty lines for a name-like pattern
    for (let i = 0; i < Math.min(5, lines.length); i++) {
      const line = lines[i];
      const words = line.split(/\s+/);
      if (
        words.length >= 2 && words.length <= 4 &&
        words.every(w => /^[A-Z][a-zA-Z'.-]+$/.test(w)) &&
        line.length < 40
      ) {
        candidateName = line;
        break;
      }
    }
    // Fallback to previous sub-line logic if not found
    if (candidateName === 'Unknown') {
      for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
        const subLines = line.split(/[.|•\-]/).map(s => s.trim()).filter(Boolean);
        for (const subLine of subLines) {
          if (/email|mobile|linkedin|summary|@|\d{3,}/i.test(subLine)) continue;
          const words = subLine.split(/\s+/);
          if (
            words.length >= 2 && words.length <= 4 &&
            words.every(w => /^[A-Z][a-zA-Z'.-]+$/.test(w))
          ) {
            candidateName = subLine;
            break;
          }
        }
        if (candidateName !== 'Unknown') break;
      }
    }
    if (candidateName === 'Unknown' && lines.length > 0) candidateName = lines[0];

    // Find matched and missing skills
    const matchedMustHave = mustHaveSkills.filter(skill => skill && new RegExp(skill, 'i').test(resume));
    const matchedNiceToHave = niceToHaveSkills.filter(skill => skill && new RegExp(skill, 'i').test(resume));
    const matchedSkills = [...matchedMustHave, ...matchedNiceToHave];
    const missingSkills = allSkills.filter(skill => skill && !new RegExp(skill, 'i').test(resume));

    // Improved experience parsing: look for blocks of [Role] then [Company] | [Period]
    const experiences = [];
    for (let i = 0; i < lines.length - 1; i++) {
      // Role line followed by Company | Period line
      const roleLine = lines[i];
      const companyPeriodLine = lines[i + 1];
      const companyPeriodMatch = companyPeriodLine.match(/([A-Za-z0-9 .,&\-|]+)\s*[|\-]\s*([A-Za-z0-9 ,]+\d{4}(?:\s*-\s*(?:Present|[A-ZaZ]+ \d{4}))?)/);
      if (companyPeriodMatch) {
        experiences.push({
          role: roleLine,
          company: companyPeriodMatch[1].trim(),
          period: companyPeriodMatch[2].trim()
        });
      }
    }

    // Calculate score
    const scoreRaw = (matchedMustHave.length * mustHaveWeight) + (matchedNiceToHave.length * niceToHaveWeight);
    const score = maxScore > 0 ? Math.round((scoreRaw / maxScore) * 10 * 10) / 10 : 0; // 1 decimal, scale 0-10

    return {
      id: String(idx + 1),
      name: candidateName,
      location: 'Unknown',
      currentRole: experiences[0]?.role || 'Unknown',
      currentCompany: experiences[0]?.company || 'Unknown',
      score,
      experiences,
      strengths: matchedSkills.length > 0 ? matchedSkills : ['No skills matched'],
      weaknesses: missingSkills.length > 0 ? missingSkills : ['None'],
      recommendation: 'approve'
    };
  });
}