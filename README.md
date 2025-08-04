# Smart Resume Parser

A React application for parsing, analyzing, and scoring resumes against a submitted Job Description (JD). Supports PDF, DOCX, and TXT resume formats, robust candidate name and experience extraction, and a modern UI for candidate evaluation.

## Features

- **JD Submission Workflow**: Submit a Job Description with Must Have and Nice to Have skills
- **Resume Upload**: Upload multiple resumes (PDF/DOCX/TXT) and analyze candidates
- **Candidate Profiles**: Extract and display candidate names, experience, strengths, weaknesses, and scores
- **PDF-to-Text Support**: Parse PDF resumes in-browser and in Node.js
- **Weighted Scoring**: Must Have and Nice to Have skills with configurable weights
- **Experience Extraction**: Robust parsing of varied resume formats
- **Modern UI**: Responsive, grid-based layout with interactive controls
- **TypeScript Support**: Full type safety and IntelliSense

## Installation

```bash
npm install
```

## Usage

### Basic Implementation

```tsx
import React, { useState } from 'react';
import CustomerSuccessManager from './CustomerSuccessManager';
import { sampleCandidates } from './sampleData';

function App() {
  const [candidates, setCandidates] = useState(sampleCandidates);

  const handleRecommendationChange = (candidateId: string, recommendation: 'approve' | 'hold' | 'reject') => {
    setCandidates(prevCandidates =>
      prevCandidates.map(candidate =>
        candidate.id === candidateId
          ? { ...candidate, recommendation }
          : candidate
      )
    );
  };

  return (
    <CustomerSuccessManager
      candidates={candidates}
      onRecommendationChange={handleRecommendationChange}
    />
  );
}
```

### Data Structure

```tsx
interface Candidate {
  id: string;
  name: string;
  location: string;
  currentRole: string;
  currentCompany: string;
  score: number; // 0-10 scale
  experiences: Experience[];
  strengths: string[];
  weaknesses: string[];
  recommendation: 'approve' | 'hold' | 'reject';
}

interface Experience {
  role: string;
  company: string;
  period: string;
  logo?: string;
}
```

## Component Props

| Prop | Type | Description |
|------|------|-------------|
| `candidates` | `Candidate[]` | Array of candidate objects to display |
| `onRecommendationChange` | `(candidateId: string, recommendation: 'approve' \| 'hold' \| 'reject') => void` | Callback function when recommendation changes |

## Styling

The component uses CSS modules for styling. Key style features include:

- **Color-coded scores**: Green (8.5+), Orange (7.5-8.4), Red (<7.5)
- **Responsive grid layout**: Adapts to different screen sizes
- **Interactive buttons**: Hover states and active indicators
- **Clean typography**: Professional appearance with proper spacing

## Testing

Run the test suite:

```bash
npm test
```

Run tests with coverage:

```bash
npm run test:coverage
```

### Test Coverage

The application includes comprehensive tests covering:

- Resume parsing and candidate extraction
- User interactions (button clicks, recommendation changes)
- Score calculation and color coding
- Accessibility compliance
- Error handling and edge cases
- Performance with large datasets

## Development

### Available Scripts

- `npm start` - Runs the app in development mode
- `npm build` - Builds the app for production
- `npm test` - Launches the test runner
- `npm run test:coverage` - Runs tests with coverage report

### File Structure

```
├── CustomerSuccessManager.tsx    # Main component
├── CustomerSuccessManager.css    # Component styles
├── CustomerSuccessManager.test.tsx # Unit tests
├── sampleData.ts                # Resume parsing and scoring logic
├── App.tsx                      # Demo application
├── App.css                      # Application styles
├── sample-resumes/              # Sample resumes (PDF, TXT)
└── package.json                 # Dependencies and scripts
```

## Customization

### Score Colors

Modify the `getScoreColor` function to customize score color thresholds:

```tsx
const getScoreColor = (score: number): string => {
  if (score >= 9.0) return '#4CAF50'; // Excellent - Green
  if (score >= 8.0) return '#2196F3'; // Good - Blue
  if (score >= 7.0) return '#FF9800'; // Average - Orange
  return '#F44336'; // Poor - Red
};
```

### Company Icons

Add custom company icons by modifying the experience icon logic:

```tsx
{exp.company === 'YourCompany' && '🏢'}
```

### Responsive Breakpoints

Customize responsive behavior in the CSS file:

```css
@media (max-width: 1200px) {
  /* Tablet styles */
}

@media (max-width: 768px) {
  /* Mobile styles */
}
```

## Browser Support

- Chrome 90+
- Firefox 88+
- Safari 14+
- Edge 90+

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests for new functionality
5. Ensure all tests pass
6. Submit a pull request

## License

MIT License - see LICENSE file for details.