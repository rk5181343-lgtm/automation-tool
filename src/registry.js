export const agents = [
  {
    id: 'researcher',
    name: 'Researcher',
    purpose: 'Research, source gathering, context and fact finding.',
    capabilities: ['research', 'web_context', 'requirements']
  },
  {
    id: 'analyst',
    name: 'Analyst',
    purpose: 'Analyse data, risks, dependencies, priorities and success criteria.',
    capabilities: ['analysis', 'risk', 'prioritisation']
  },
  {
    id: 'designer',
    name: 'Designer',
    purpose: 'Plan UX, UI, information architecture and user experience.',
    capabilities: ['ux', 'ui', 'product_design']
  },
  {
    id: 'builder',
    name: 'Builder',
    purpose: 'Implement software and technical changes.',
    capabilities: ['coding', 'implementation', 'integration']
  },
  {
    id: 'qa',
    name: 'QA Agent',
    purpose: 'Validate outputs, find defects and check requirements.',
    capabilities: ['testing', 'validation', 'quality']
  },
  {
    id: 'operations',
    name: 'Operations',
    purpose: 'Handle delivery, handoff, tracking and operational follow-up.',
    capabilities: ['delivery', 'handoff', 'tracking']
  }
];

export const getAgent = (id) => agents.find((agent) => agent.id === id);
