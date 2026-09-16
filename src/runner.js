const MODEL = process.env.OPENAI_MODEL || 'gpt-5.6';
const API_URL = 'https://api.openai.com/v1/responses';

async function ask(instructions, input) {
  if (!process.env.OPENAI_API_KEY) throw new Error('OPENAI_API_KEY is not configured on the server.');
  const response = await fetch(API_URL, {
    method: 'POST',
    headers: { Authorization: `Bearer ${process.env.OPENAI_API_KEY}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ model: MODEL, instructions, input })
  });
  const data = await response.json();
  if (!response.ok) throw new Error(data?.error?.message || `OpenAI request failed with ${response.status}`);
  return data.output_text;
}

export async function executePlan({ goal, plan }) {
  const results = [];
  for (const task of plan) {
    const output = await ask(
      `You are the ${task.agent_id} specialist in a multi-agent system. Complete only the assigned task. Be factual about what you did and did not do. Return a concise result with findings, work completed, blockers, and recommended next step.`,
      JSON.stringify({ goal, task })
    );
    results.push({ task_id: task.task_id, agent_id: task.agent_id, status: 'completed', output });
  }
  return results;
}

export async function reviewResults({ goal, plan, results }) {
  return ask(
    `You are the CEO Agent reviewing specialist outputs. Compare the results against the original objective. Identify completed work, gaps, conflicts and the most useful next action. Do not claim execution that is not present in the results.`,
    JSON.stringify({ goal, plan, results })
  );
}
