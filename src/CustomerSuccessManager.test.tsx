import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import CustomerSuccessManager, { Candidate } from './CustomerSuccessManager';
import { sampleCandidates } from './sampleData';

// Mock data for testing
const mockCandidates: Candidate[] = [
  {
    id: '1',
    name: 'John Doe',
    location: 'New York, NY, USA',
    currentRole: 'Senior Customer Success Manager',
    currentCompany: 'Tech Corp',
    score: 8.5,
    experiences: [
      {
        role: 'Customer Success Manager',
        company: 'SaaS Company',
        period: 'Jan 2020 - Present'
      }
    ],
    strengths: ['5+ years experience', 'Strong communication skills'],
    weaknesses: ['Limited technical background'],
    recommendation: 'approve'
  },
  {
    id: '2',
    name: 'Jane Smith',
    location: 'San Francisco, CA, USA',
    currentRole: 'Customer Success Associate',
    currentCompany: 'Startup Inc',
    score: 6.2,
    experiences: [
      {
        role: 'Support Specialist',
        company: 'Help Desk Co',
        period: 'Mar 2019 - Dec 2021'
      }
    ],
    strengths: ['Quick learner', 'Customer focused'],
    weaknesses: ['Limited CS experience', 'No enterprise experience'],
    recommendation: 'hold'
  }
];

describe('CustomerSuccessManager Component', () => {
  const mockOnRecommendationChange = jest.fn();
  const mockOnResumeUpload = jest.fn();

  beforeEach(() => {
    mockOnRecommendationChange.mockClear();
    mockOnResumeUpload.mockClear();
  });

  test('renders header correctly', () => {
    render(
      <CustomerSuccessManager
        candidates={mockCandidates}
        onRecommendationChange={mockOnRecommendationChange}
        onResumeUpload={mockOnResumeUpload}
      />
    );

    expect(screen.getByRole('heading', { name: 'Customer Success Manager' })).toBeInTheDocument();
    expect(screen.getByText('🎯')).toBeInTheDocument();
  });

  test('renders section headers', () => {
    render(
      <CustomerSuccessManager
        candidates={mockCandidates}
        onRecommendationChange={mockOnRecommendationChange}
        onResumeUpload={mockOnResumeUpload}
      />
    );

    expect(screen.getByText('Candidates')).toBeInTheDocument();
    expect(screen.getByText('Experience')).toBeInTheDocument();
    expect(screen.getByText('Details')).toBeInTheDocument();
    expect(screen.getByText('Shortlist Recommendation - Yes/No')).toBeInTheDocument();
  });

  test('renders candidate information correctly', () => {
    render(
      <CustomerSuccessManager
        candidates={mockCandidates}
        onRecommendationChange={mockOnRecommendationChange}
        onResumeUpload={mockOnResumeUpload}
      />
    );

    // Check first candidate
    expect(screen.getByText('John Doe')).toBeInTheDocument();
    expect(screen.getByText((content, element) => {
      return element?.textContent === '📍 New York, NY, USA';
    })).toBeInTheDocument();
    expect(screen.getByText((content, element) => {
      return element?.textContent === '👤 Senior Customer Success Manager';
    })).toBeInTheDocument();
    expect(screen.getByText((content, element) => {
      return element?.textContent === '🏢 Tech Corp';
    })).toBeInTheDocument();

    // Check second candidate
    expect(screen.getByText('Jane Smith')).toBeInTheDocument();
    expect(screen.getByText((content, element) => {
      return element?.textContent === '📍 San Francisco, CA, USA';
    })).toBeInTheDocument();
  });

  test('displays candidate scores correctly', () => {
    render(
      <CustomerSuccessManager
        candidates={mockCandidates}
        onRecommendationChange={mockOnRecommendationChange}
        onResumeUpload={mockOnResumeUpload}
      />
    );

    expect(screen.getByText('8.5')).toBeInTheDocument();
    expect(screen.getByText('6.2')).toBeInTheDocument();
  });

  test('renders experience information', () => {
    render(
      <CustomerSuccessManager
        candidates={mockCandidates}
        onRecommendationChange={mockOnRecommendationChange}
        onResumeUpload={mockOnResumeUpload}
      />
    );

    // Use getAllByText to handle multiple instances
    const customerSuccessRoles = screen.getAllByText('Customer Success Manager');
    expect(customerSuccessRoles.length).toBeGreaterThan(0);
    
    expect(screen.getByText('SaaS Company')).toBeInTheDocument();
    expect(screen.getByText('Jan 2020 - Present')).toBeInTheDocument();

    expect(screen.getByText('Support Specialist')).toBeInTheDocument();
    expect(screen.getByText('Help Desk Co')).toBeInTheDocument();
  });

  test('displays strengths and weaknesses', () => {
    render(
      <CustomerSuccessManager
        candidates={mockCandidates}
        onRecommendationChange={mockOnRecommendationChange}
        onResumeUpload={mockOnResumeUpload}
      />
    );

    // Strengths
    expect(screen.getByText('5+ years experience')).toBeInTheDocument();
    expect(screen.getByText('Strong communication skills')).toBeInTheDocument();
    expect(screen.getByText('Quick learner')).toBeInTheDocument();

    // Weaknesses
    expect(screen.getByText('Limited technical background')).toBeInTheDocument();
    expect(screen.getByText('Limited CS experience')).toBeInTheDocument();
  });

  test('renders recommendation buttons with correct initial states', () => {
    render(
      <CustomerSuccessManager
        candidates={mockCandidates}
        onRecommendationChange={mockOnRecommendationChange}
        onResumeUpload={mockOnResumeUpload}
      />
    );

    const approveButtons = screen.getAllByText('Approve');
    const holdButtons = screen.getAllByText('Hold');
    const rejectButtons = screen.getAllByText('Reject');

    expect(approveButtons).toHaveLength(2);
    expect(holdButtons).toHaveLength(2);
    expect(rejectButtons).toHaveLength(2);

    // Check active states
    expect(approveButtons[0]).toHaveClass('active');
    expect(holdButtons[1]).toHaveClass('active');
  });

  test('calls onRecommendationChange when recommendation buttons are clicked', () => {
    render(
      <CustomerSuccessManager
        candidates={mockCandidates}
        onRecommendationChange={mockOnRecommendationChange}
        onResumeUpload={mockOnResumeUpload}
      />
    );

    const holdButtons = screen.getAllByText('Hold');
    fireEvent.click(holdButtons[0]);

    expect(mockOnRecommendationChange).toHaveBeenCalledWith('1', 'hold');
  });

  test('calls onRecommendationChange for reject button', () => {
    render(
      <CustomerSuccessManager
        candidates={mockCandidates}
        onRecommendationChange={mockOnRecommendationChange}
        onResumeUpload={mockOnResumeUpload}
      />
    );

    const rejectButtons = screen.getAllByText('Reject');
    fireEvent.click(rejectButtons[1]);

    expect(mockOnRecommendationChange).toHaveBeenCalledWith('2', 'reject');
  });

  test('handles empty candidates list', () => {
    render(
      <CustomerSuccessManager
        candidates={[]}
        onRecommendationChange={mockOnRecommendationChange}
        onResumeUpload={mockOnResumeUpload}
      />
    );

    expect(screen.getByText('Customer Success Manager')).toBeInTheDocument();
    expect(screen.queryByText('John Doe')).not.toBeInTheDocument();
  });

  test('renders with sample data', () => {
    render(
      <CustomerSuccessManager
        candidates={sampleCandidates}
        onRecommendationChange={mockOnRecommendationChange}
        onResumeUpload={mockOnResumeUpload}
      />
    );

    expect(screen.getByText('Lucas')).toBeInTheDocument();
    expect(screen.getByText('Jackson')).toBeInTheDocument();
    expect(screen.getByText('Henry')).toBeInTheDocument();
    expect(screen.getByText('Victoria')).toBeInTheDocument();
  });

  describe('Score calculation and display', () => {
    test('getScoreColor returns correct colors for different score ranges', () => {
      const { container } = render(
        <CustomerSuccessManager
          candidates={[
            { ...mockCandidates[0], score: 9.0 }, // High score - green
            { ...mockCandidates[0], id: '2', score: 8.0 }, // Mid score - orange
            { ...mockCandidates[0], id: '3', score: 6.0 } // Low score - red
          ]}
          onRecommendationChange={mockOnRecommendationChange}
          onResumeUpload={mockOnResumeUpload}
        />
      );

      const circles = container.querySelectorAll('.score-progress');
      expect(circles[0]).toHaveAttribute('stroke', '#4CAF50'); // Green
      expect(circles[1]).toHaveAttribute('stroke', '#FF9800'); // Orange
      expect(circles[2]).toHaveAttribute('stroke', '#F44336'); // Red
    });

    test('displays correct score percentages', () => {
      const { container } = render(
        <CustomerSuccessManager
          candidates={[{ ...mockCandidates[0], score: 5.0 }]}
          onRecommendationChange={mockOnRecommendationChange}
          onResumeUpload={mockOnResumeUpload}
        />
      );

      const circle = container.querySelector('.score-progress');
      const strokeDasharray = circle?.getAttribute('stroke-dasharray');
      // 5.0 score = 50% = ~125.5, 251.2 (allowing for floating point precision)
      expect(strokeDasharray).toMatch(/125\.\d+, 251\.2/);
    });
  });

  describe('Component interaction', () => {
    test('multiple button clicks work correctly', () => {
      render(
        <CustomerSuccessManager
          candidates={mockCandidates}
          onRecommendationChange={mockOnRecommendationChange}
          onResumeUpload={mockOnResumeUpload}
        />
      );

      const approveButtons = screen.getAllByText('Approve');
      const holdButtons = screen.getAllByText('Hold');

      fireEvent.click(holdButtons[0]);
      fireEvent.click(approveButtons[1]);

      expect(mockOnRecommendationChange).toHaveBeenCalledTimes(2);
      expect(mockOnRecommendationChange).toHaveBeenNthCalledWith(1, '1', 'hold');
      expect(mockOnRecommendationChange).toHaveBeenNthCalledWith(2, '2', 'approve');
    });
  });

  describe('Accessibility', () => {
    test('buttons are accessible', () => {
      render(
        <CustomerSuccessManager
          candidates={mockCandidates}
          onRecommendationChange={mockOnRecommendationChange}
          onResumeUpload={mockOnResumeUpload}
        />
      );

      const buttons = screen.getAllByRole('button');
      expect(buttons.length).toBe(6); // 3 buttons × 2 candidates

      buttons.forEach(button => {
        expect(button).toBeEnabled();
      });
    });

    test('component has proper structure', () => {
      render(
        <CustomerSuccessManager
          candidates={mockCandidates}
          onRecommendationChange={mockOnRecommendationChange}
          onResumeUpload={mockOnResumeUpload}
        />
      );

      expect(screen.getByRole('banner')).toBeInTheDocument(); // header
      expect(screen.getAllByRole('button')).toHaveLength(6);
    });
  });

  describe('Error handling', () => {
    test('handles missing optional fields gracefully', () => {
      const incompleteCandidate: Candidate = {
        id: '1',
        name: 'Incomplete Candidate',
        location: 'Unknown',
        currentRole: 'Role',
        currentCompany: 'Company',
        score: 7.0,
        experiences: [],
        strengths: [],
        weaknesses: [],
        recommendation: 'hold'
      };

      render(
        <CustomerSuccessManager
          candidates={[incompleteCandidate]}
          onRecommendationChange={mockOnRecommendationChange}
          onResumeUpload={mockOnResumeUpload}
        />
      );

      expect(screen.getByText('Incomplete Candidate')).toBeInTheDocument();
    });
  });

  describe('Performance', () => {
    test('renders large number of candidates efficiently', () => {
      const largeCandidateList = Array.from({ length: 50 }, (_, index) => ({
        ...mockCandidates[0],
        id: `candidate-${index}`,
        name: `Candidate ${index}`,
        score: Math.random() * 10
      }));

      const startTime = performance.now();
      render(
        <CustomerSuccessManager
          candidates={largeCandidateList}
          onRecommendationChange={mockOnRecommendationChange}
          onResumeUpload={mockOnResumeUpload}
        />
      );
      const endTime = performance.now();

      expect(endTime - startTime).toBeLessThan(1000); // Should render in less than 1 second
      expect(screen.getByText('Candidate 0')).toBeInTheDocument();
      expect(screen.getByText('Candidate 49')).toBeInTheDocument();
    });
  });
});