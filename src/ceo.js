import { agents } from './registry.js';

const MODEL = process.env.OPENAI_MODEL || 'gpt-5.6';
const API_URL = 'https://api.openai.com/v1/responses';

const CEO_INSTRUCTIONS = `You are the CEO Agent, the central orchestrator of a multi-agent software system.

Your job is NOT to do every specialist task yourself. Your job is to understand the objective, inspect available data and agents, break work into tasks, delegate tasks to the right agents, evaluate their outputs, and decide what should happen next.

Rules:
1. Understand the original objective before delegating.
2. Use only agents that are actually available in the registry.
3. Give every selected agent a precise, actionable task and useful context.
4. Prefer parallel independent work when tasks do not depend on one another.
5. Identify dependencies when one task must wait for another.
6. Review agent outputs against the original objective.
7. If an output is incomplete or wrong, create a correction task for the appropriate agent.
8. Do not claim an action was executed unless an execution result was actually provided.
9. Stop when the objective is sufficiently complete or when human input is genuinely required.
10. Return strict JSON matching the supplied schema.

The CEO should behave like an orchestrator: PLAN -> DELEGATE -> REVIEW -> REPLAN -> COMPLETE.`;

const schema = {
  type: 'object',
  additionalProperties: false,
  properties: {
    summary: { type: 'string' },
    objective: { type: 'string' },
    priority: { type: 'string', enum: ['low', 'medium', 'high', 'critical'] },
    plan: {
      type: 'array',
      items: {
        type: 'object',
        additionalProperties: false,
        properties: {
          task_id: { type: 'string' },
          agent_id: { type: 'string' },
          instruction: { type: 'string' },
          depends_on: { type: 'array', items: { type: 'string' } },
          success_criteria: { type: 'array', items: { type: 'string' } }
        },
        required: ['task_id', 'agent_id', 'instruction', 'depends_on', 'success_criteria']
      }
    },
    next_action: { type: 'string' },
    requires_human_input: { type: 'boolean' },
    human_question: { type: 'string' }
  },
  required: ['summary', 'objective', 'priority', 'plan', 'next_action', 'requires_human_input', 'human_question']
};

async function callOpenAI(input) {
  if (!process.env.OPENAI_API_KEY) {
    throw new Error('OPENAI_API_KEY is not configured on the server.');
  }

  const response = await fetch(API_URL, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      model: MODEL,
      instructions: CEO_INSTRUCTIONS,
      input,
      text: {
        format: {
          type: 'json_schema',
          name: 'ceo_plan',
          strict: true,
          schema
        }
      }
    })
  });

  const payload = await response.json();
  if (!response.ok) throw new Error(payload?.error?.message || `OpenAI request failed with ${response.status}`);
  return JSON.parse(payload.output_text);
}

export async function runCEO({ goal, data }) {
  const availableAgents = agents.map(({ id, name, purpose, capabilities }) => ({ id, name, purpose, capabilities }));
  const input = JSON.stringify({
    goal,
    data,
    available_agents: availableAgents,
    instruction: 'Create the first executable orchestration plan. Do not invent unavailable agents or claim that tasks have already been executed.'
  });

  const plan = await callOpenAI(input);
  const allowed = new Set(agents.map((agent) => agent.id));
  const invalid = plan.plan.filter((task) => !allowed.has(task.agent_id));
  if (invalid.length) throw new Error(`CEO selected unavailable agent(s): ${invalid.map((x) => x.agent_id).join(', ')}`);

  return {
    status: 'planned',
    model: MODEL,
    generated_at: new Date().toISOString(),
    ...plan
  };
}
