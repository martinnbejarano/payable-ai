import { tavily } from '@tavily/core'

/** Returns a Tavily client instance. Throws if TAVILY_API_KEY is not set. */
export function getTavilyClient() {
  const apiKey = process.env.TAVILY_API_KEY
  if (!apiKey) {
    throw new Error('TAVILY_API_KEY is not set')
  }
  return tavily({ apiKey })
}

/** Runs a basic search and returns results. */
export async function tavilySearch(query: string) {
  const client = getTavilyClient()
  return client.search(query, {
    searchDepth: 'basic',
    maxResults: 5,
  })
}
