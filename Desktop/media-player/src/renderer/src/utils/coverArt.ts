// Fetches cover art from iTunes Search API as fallback when the source doesn't provide one.
// Free, no API key required. Results are cached in memory.

const cache = new Map<string, string | null>()
const pending = new Map<string, Promise<string | null>>()

export function fetchFallbackCover(artist: string, title: string): Promise<string | null> {
  const key = `${artist.toLowerCase()}::${title.toLowerCase()}`

  if (cache.has(key)) return Promise.resolve(cache.get(key)!)
  if (pending.has(key)) return pending.get(key)!

  const promise = (async (): Promise<string | null> => {
    try {
      const q = encodeURIComponent(`${artist} ${title}`)
      const r = await fetch(
        `https://itunes.apple.com/search?term=${q}&media=music&entity=song&limit=1`
      )
      const d = await r.json()
      // Replace 100x100 thumbnail with 300x300
      const url: string | null =
        d.results?.[0]?.artworkUrl100?.replace('100x100bb', '300x300bb') ?? null
      cache.set(key, url)
      return url
    } catch {
      cache.set(key, null)
      return null
    } finally {
      pending.delete(key)
    }
  })()

  pending.set(key, promise)
  return promise
}
