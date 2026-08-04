// Browser-Cache (Cache-Control) + Netlify Durable Cache (Netlify-CDN-Cache-Control).
// Netlify konsumiert/stripped den CDN-Header aus der Response; "durable" = EIN geteilter
// Cache über alle Edge-Nodes — s-maxage allein cached nur pro Node (jeder neue Node = Miss
// = Function-Invocation). Ohne max-age revalidiert der Browser jeden Aufruf.
export function cacheHeaders(browserMaxAge: number, cdnMaxAge: number, swr = 86400) {
  return {
    "Cache-Control": `public, max-age=${browserMaxAge}, stale-while-revalidate=${swr}`,
    "Netlify-CDN-Cache-Control": `public, durable, s-maxage=${cdnMaxAge}, stale-while-revalidate=${swr}`,
  };
}
