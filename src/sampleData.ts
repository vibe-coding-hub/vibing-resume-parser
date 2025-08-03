import { Candidate } from './CustomerSuccessManager';

export const sampleCandidates: Candidate[] = [
  {
    id: '1',
    name: 'Lucas',
    location: 'Vancouver, BC, Canada',
    currentRole: 'Senior Director of Operations',
    currentCompany: 'CONNECTIONPOINT SYSTEMS INC',
    score: 8.9,
    experiences: [
      {
        role: 'Customer Success Manager',
        company: 'Zendesk',
        period: 'Apr 2022 - Present'
      },
      {
        role: 'Customer Success Manager',
        company: 'Freshworks',
        period: 'July 2017 - April 2022'
      },
      {
        role: 'Customer Success Manager',
        company: 'Monday.com',
        period: 'March 2015 - June 2017'
      }
    ],
    strengths: [
      '9+ years in Customer Success roles',
      '3+ years in mid-size companies',
      'Achieved 30 churn at Freshworks System',
      'Background in Software Development industry',
      'Managed $1,000,000+ ARR accounts'
    ],
    weaknesses: [
      'Slight overqualification for the role',
      'Limited recent experience in smaller startups'
    ],
    recommendation: 'approve'
  },
  {
    id: '2',
    name: 'Jackson',
    location: 'Minneapolis, MN, USA',
    currentRole: 'Senior Customer Success',
    currentCompany: 'Manager at Relay Systems',
    score: 8.4,
    experiences: [
      {
        role: 'Senior Customer Success Manager',
        company: 'HubSpot',
        period: 'September 2019 - Present'
      },
      {
        role: 'Customer Success Manager',
        company: 'Drift',
        period: 'March 2018 - August 2019'
      },
      {
        role: 'Customer Success Manager',
        company: 'Slack',
        period: 'June 2015 - February 2018'
      }
    ],
    strengths: [
      '9+ years in Customer Success roles',
      '3+ years in mid-size companies',
      'Managed $1,000,000+ ARR accounts',
      'Worked for similar size series B startup'
    ],
    weaknesses: [
      'Limited experience in HR Tech',
      'Short tenure at Slack (less than a year)'
    ],
    recommendation: 'approve'
  },
  {
    id: '3',
    name: 'Henry',
    location: 'Billings, MT, USA',
    currentRole: 'Customer Success Specialist',
    currentCompany: 'PerformYard',
    score: 7.9,
    experiences: [
      {
        role: 'Customer Success Manager',
        company: 'Salesforce',
        period: 'August 2021 - Present'
      },
      {
        role: 'Customer Support Analyst',
        company: 'Lattice',
        period: 'January 2017 - July 2021'
      }
    ],
    strengths: [
      '3+ years in customer success role',
      'Experience in HR Tech and SaaS',
      'High customer retention rates',
      'Relevant experience in technology industries',
      'Worked in hyper-growth company'
    ],
    weaknesses: [
      'Limited experience with Enterprise clients'
    ],
    recommendation: 'approve'
  },
  {
    id: '4',
    name: 'Victoria',
    location: 'Colorado Springs, CO, USA',
    currentRole: 'Customer Success Agent',
    currentCompany: 'MinistryBrands',
    score: 5.8,
    experiences: [
      {
        role: 'Customer Success Manager',
        company: 'Intercom',
        period: 'June 2021 - Jan 2023'
      },
      {
        role: 'Customer Support Associate',
        company: 'Gainsight',
        period: 'October 2015 - May 2019'
      }
    ],
    strengths: [
      '1.5 year experience in SaaS (Intercom)',
      'Worked with funded startups'
    ],
    weaknesses: [
      'Recent employment gaps',
      'Only beginner proficiency in some key skills',
      'No upselling experience'
    ],
    recommendation: 'reject'
  }
];