/**
 * Capability planner.
 *
 * Single gpt-4o-mini call at the start of each agent run. Maps the user task
 * (plus a flag indicating whether an image was attached) to an ordered
 * sequence of capabilities that the agent should acquire.
 *
 * Returns a deterministic JSON object — no narration, no streaming.
 */

import { getOpenAI } from './openai'

const KNOWN_CAPABILITIES = ['ocr', 'web-search'] as const
export type KnownCapability = (typeof KNOWN_CAPABILITIES)[number]

const SYSTEM = `You are a router for an AI agent that buys access to compute capabilities in a marketplace. Given a task and whether the user attached an image, pick the minimum sequence of capabilities the agent needs.

Available capabilities:
- "ocr": extract text from an image, screenshot, or PDF. Only useful when the task references an image OR HasImage=true.
- "web-search": search the live public web for current information.

Rules:
- Output strictly valid JSON: { "capabilities": string[], "rationale": string }
- "capabilities" is an ordered array. Each entry must be one of: "ocr", "web-search". Include each at most once.
- If HasImage=true and the task wants information beyond what's in the image, return ["ocr", "web-search"].
- If HasImage=true and the task only asks to extract/transcribe content, return ["ocr"].
- If HasImage=false and the task is informational/research, return ["web-search"].
- "rationale" is a single sentence under 140 chars explaining the choice.`

export interface Plan {
  capabilities: KnownCapability[]
  rationale: string
}

const FALLBACK: Plan = {
  capabilities: ['web-search'],
  rationale: 'fallback: defaulting to web-search',
}

export async function planCapabilities(task: string, hasImage: boolean): Promise<Plan> {
  const openai = getOpenAI()
  const res = await openai.chat.completions.create({
    model: 'gpt-4o-mini',
    response_format: { type: 'json_object' },
    temperature: 0,
    messages: [
      { role: 'system', content: SYSTEM },
      {
        role: 'user',
        content: `Task: ${task}\nHasImage: ${hasImage}\n\nReturn the JSON now.`,
      },
    ],
  })
  const raw = res.choices[0]?.message?.content
  if (!raw) return FALLBACK
  let parsed: { capabilities?: unknown; rationale?: unknown }
  try {
    parsed = JSON.parse(raw)
  } catch {
    return FALLBACK
  }
  const caps = Array.isArray(parsed.capabilities) ? parsed.capabilities : []
  const valid: KnownCapability[] = []
  for (const c of caps) {
    if (typeof c !== 'string') continue
    if (!(KNOWN_CAPABILITIES as readonly string[]).includes(c)) continue
    if (valid.includes(c as KnownCapability)) continue
    valid.push(c as KnownCapability)
  }
  if (valid.length === 0) return FALLBACK
  const rationale =
    typeof parsed.rationale === 'string' && parsed.rationale.length > 0
      ? parsed.rationale.slice(0, 240)
      : 'capabilities selected'
  return { capabilities: valid.slice(0, 3), rationale }
}
