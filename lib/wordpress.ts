import { cache } from "react";
import { GraphQLClient, gql } from "graphql-request";
import type { Post, Rechner, Checkliste, Vergleich, Dokument, PostACF, SEO, RechnerConfigOverrides, AnbieterPost, SiteSettings } from "./types";
import { decodePostContent, decodeHtmlEntities } from "./html-utils";
import { extractArticleHeader } from "./articleHeader";
import { detectToolTypes } from "./content-utils";
import { stripHtml } from "./seo";

export interface LatestTool {
  type: "rechner" | "checkliste" | "vergleich";
  label: string;
  title: string;
  description: string;
  href: string;
}

/**
 * Konvention v2 (Struktur-Migration): Der Karten-/Preview-Untertitel ist der Kicker
 * = 1. Content-<h2> (= article-subtitle auf der Beitragsseite → kohärenter Morph).
 * Das alte ACF-Feld beitragUntertitel ist veraltet; hier mit dem Content-h2
 * überschreiben (ACF bleibt Fallback, wenn kein Content-h2 vorhanden). `content`
 * wird NICHT an den Client durchgereicht (Payload schlank halten).
 * WICHTIG: nach dem ACF-Mapping aufrufen, damit es den stale Wert überschreibt.
 * Mutiert + liefert denselben Post zurück.
 */
function applyContentHeaderTitle(post: Post & { content?: string }): Post {
  const header = extractArticleHeader(post.content);
  if (header?.subtitle) {
    post.beitragFelder = { ...post.beitragFelder, beitragUntertitel: header.subtitle };
  }
  if ("content" in post) delete (post as { content?: string }).content;
  return post;
}

function getClient(revalidate: number = 3600): GraphQLClient {
  const endpoint = process.env.WORDPRESS_API_URL;
  if (!endpoint) throw new Error("WORDPRESS_API_URL ist nicht gesetzt");
  const client = new GraphQLClient(endpoint, {
    fetch: globalThis.fetch,
    next: { revalidate },
  });

  // Retry mit Backoff bei transienten WP-Fehlern. IONOS-Shared-Hosting wirft
  // unter Build-Last (456 Seiten parallel) "Error establishing a database
  // connection" (500) bzw. "temporarily unavailable" (503). Ohne Retry fängt
  // der jeweilige catch-Block das ab und liefert leeren Content → leere
  // Slider/Footer/Tools im statischen Build. Mit Retry erholen sich die meisten
  // Abfragen und der Build wird vollständig.
  const orig = client.request.bind(client);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  (client as any).request = async (...args: unknown[]) => {
    const MAX = 6;
    let lastErr: unknown;
    for (let attempt = 0; attempt < MAX; attempt++) {
      try {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        return await (orig as any)(...args);
      } catch (e: unknown) {
        lastErr = e;
        const status = (e as { response?: { status?: number } })?.response?.status;
        // Transient = 5xx ODER Netzwerkfehler ohne Response (ECONNRESET / "fetch failed" /
        // Timeout). Letztere hatte die alte Logik NICHT abgedeckt → Build-Seiten fielen bei
        // IONOS-Connection-Resets sofort aus (= unvollständige SSG / gebackene 404).
        const hasResponse = !!(e as { response?: unknown })?.response;
        const transient = !hasResponse || (typeof status === "number" && status >= 500);
        if (!transient || attempt === MAX - 1) throw e;
        // Progressiver Backoff (500ms..3s) — gibt der IONOS-DB unter Build-Last Luft.
        await new Promise((r) => setTimeout(r, 500 * (attempt + 1)));
      }
    }
    throw lastErr;
  };
  return client;
}

// ─────────────────────────────────────────────
// Alle Beiträge (für Übersichtsseiten / SSG)
// ─────────────────────────────────────────────

export async function getAllPosts(): Promise<Post[]> {
  const client = getClient();

  const query = gql`
    query GetPosts($after: String) {
      posts(first: 100, after: $after) {
        pageInfo {
          hasNextPage
          endCursor
        }
        nodes {
          id
          title
          slug
          date
          excerpt
          featuredImage {
            node {
              sourceUrl
              altText
            }
          }
          categories {
            nodes {
              name
              slug
            }
          }
          beitrag {
            untertitel
          }
        }
      }
    }
  `;

  const allNodes: (Post & { beitrag?: { untertitel?: string } })[] = [];
  let hasNextPage = true;
  let after: string | null = null;

  type AllPostsResponse = {
    posts: { nodes: (Post & { beitrag?: { untertitel?: string } })[]; pageInfo: { hasNextPage: boolean; endCursor: string } };
  };
  while (hasNextPage) {
    const data: AllPostsResponse = await client.request<AllPostsResponse>(query, { after });
    allNodes.push(...data.posts.nodes);
    hasNextPage = data.posts.pageInfo.hasNextPage;
    after = data.posts.pageInfo.endCursor;
  }

  return allNodes.map(post => {
    const decoded = decodePostContent(post);
    if (post.beitrag?.untertitel) {
      decoded.beitragFelder = { ...decoded.beitragFelder, beitragUntertitel: post.beitrag.untertitel };
    }
    return decoded;
  });
}

// ─────────────────────────────────────────────
// Neueste Beiträge (sortiert nach Datum DESC)
// ─────────────────────────────────────────────

export async function getLatestPosts(limit = 10): Promise<Post[]> {
  const client = getClient();

  const query = gql`
    query GetLatestPosts($limit: Int!) {
      posts(first: $limit, where: { orderby: { field: DATE, order: DESC } }) {
        nodes {
          id
          title
          slug
          date
          excerpt
          content
          featuredImage {
            node {
              sourceUrl
              altText
            }
          }
          categories {
            nodes {
              name
              slug
            }
          }
          beitrag {
            untertitel
          }
        }
      }
    }
  `;

  try {
    const data = await client.request<{
      posts: { nodes: (Post & { beitrag?: { untertitel?: string }; content?: string })[] };
    }>(query, { limit });
    return data.posts.nodes.map((post) => {
      const decoded = decodePostContent(post);
      if (post.beitrag?.untertitel) {
        decoded.beitragFelder = { ...decoded.beitragFelder, beitragUntertitel: post.beitrag.untertitel };
      }
      // Eingebettete Tools aus dem Content ableiten, BEVOR applyContentHeaderTitle ihn strippt.
      const tools = detectToolTypes(post.content);
      // Konvention v2: Karten-Untertitel = 1. Content-<h2> (Kicker); überschreibt das
      // veraltete ACF-Feld, danach content aus dem Payload entfernen.
      return { ...applyContentHeaderTitle(decoded), tools };
    });
  } catch (error) {
    console.error("Error fetching latest posts:", error);
    return [];
  }
}

// ─────────────────────────────────────────────
// Beiträge suchen
// ─────────────────────────────────────────────

export async function searchPosts(searchQuery: string): Promise<Post[]> {
  if (!searchQuery || searchQuery.trim().length === 0) {
    return [];
  }

  const client = getClient();

  const query = gql`
    query SearchPosts($search: String!) {
      posts(where: { search: $search }, first: 50) {
        nodes {
          id
          title
          slug
          date
          excerpt
          content
          featuredImage {
            node {
              sourceUrl
              altText
            }
          }
          categories {
            nodes {
              name
              slug
            }
          }
          beitrag {
            untertitel
          }
        }
      }
    }
  `;

  try {
    const data = await client.request<{
      posts: { nodes: (Post & { beitrag?: { untertitel?: string }; content?: string })[] };
    }>(query, { search: searchQuery });
    const posts = data.posts.nodes.map((post) => {
      const decoded = decodePostContent(post);
      if (post.beitrag?.untertitel) {
        decoded.beitragFelder = {
          ...decoded.beitragFelder,
          beitragUntertitel: post.beitrag.untertitel,
        };
      }
      // Konvention v2: Karten-Untertitel = 1. Content-<h2> (überschreibt stale ACF).
      return applyContentHeaderTitle(decoded);
    });
    return rankByRelevance(posts, searchQuery);
  } catch (error) {
    console.error(`Error searching posts for "${searchQuery}":`, error);
    return [];
  }
}

function relevanceScore(post: Post, query: string): number {
  const q = query.toLowerCase().trim();
  if (!q) return 0;
  const title = (post.title || "").toLowerCase();
  const excerpt = (post.excerpt || "").replace(/<[^>]*>/g, "").toLowerCase();

  let score = 0;
  if (title === q) score += 100;
  if (title.startsWith(q)) score += 50;
  if (title.includes(q)) score += 30;

  // Word-boundary match in title
  const wordRe = new RegExp(`\\b${q.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}\\b`, "i");
  if (wordRe.test(title)) score += 15;

  // Multi-token: each query token boosts if found in title
  const tokens = q.split(/\s+/).filter((t) => t.length >= 2);
  if (tokens.length > 1) {
    for (const t of tokens) {
      if (title.includes(t)) score += 8;
    }
  }

  // Excerpt match (less weight)
  if (excerpt.includes(q)) score += 6;
  for (const t of tokens) {
    if (excerpt.includes(t)) score += 1;
  }

  // Slight penalty for very long titles vs short ones (prefer concise, on-topic)
  score -= Math.max(0, title.length - 60) * 0.02;

  return score;
}

function rankByRelevance(posts: Post[], query: string): Post[] {
  if (!query.trim() || posts.length <= 1) return posts;
  return posts
    .map((post) => ({ post, score: relevanceScore(post, query) }))
    .sort((a, b) => b.score - a.score)
    .map((x) => x.post);
}

// ─────────────────────────────────────────────
// Beiträge nach Kategorie
// ─────────────────────────────────────────────

export const getPostsByCategory = cache(async (categorySlug: string): Promise<Post[]> => {
  // Build: aus der Posts-Bulk-Map ableiten statt pro Subkategorie (~158) einzeln abzufragen.
  if (IS_BUILD) {
    const map = await getAllPostsMap();
    const out: Post[] = [];
    for (const p of map.values()) {
      if (p.categories?.nodes?.some((c) => c.slug === categorySlug)) {
        const tools = detectToolTypes((p as Post & { content?: string }).content);
        // Klonen — applyContentHeaderTitle mutiert (strippt content) → Map-Eintrag nicht korrumpieren.
        const clone = { ...p, beitragFelder: { ...p.beitragFelder } } as Post & { content?: string };
        out.push({ ...applyContentHeaderTitle(clone), tools });
      }
    }
    if (out.length > 0) return out;
    // leer → Kategorie ohne Posts (oder Slug nicht in Map) → Einzelabfrage als Fallback.
  }
  const client = getClient();

  const query = gql`
    query GetPostsByCategory($slug: [String!]!) {
      categories(where: { slug: $slug }) {
        nodes {
          posts(first: 100) {
            nodes {
              id
              title
              slug
              date
              excerpt
              content
              featuredImage {
                node {
                  sourceUrl
                  altText
                }
              }
              categories {
                nodes {
                  name
                  slug
                }
              }
              beitrag {
                untertitel
              }
            }
          }
        }
      }
    }
  `;

  try {
    const data = await client.request<{
      categories: {
        nodes: Array<{ posts: { nodes: (Post & { beitrag?: { untertitel?: string }; content?: string })[] } }>
      }
    }>(query, {
      slug: [categorySlug],
    });
    const posts = data.categories.nodes[0]?.posts.nodes || [];
    return posts.map(post => {
      const decoded = decodePostContent(post);
      if (post.beitrag?.untertitel) {
        decoded.beitragFelder = {
          ...decoded.beitragFelder,
          beitragUntertitel: post.beitrag.untertitel,
        };
      }
      // Eingebettete Tools ableiten, BEVOR applyContentHeaderTitle den Content strippt.
      const tools = detectToolTypes(post.content);
      // Konvention v2: Karten-Untertitel = 1. Content-<h2> (überschreibt stale ACF).
      return { ...applyContentHeaderTitle(decoded), tools };
    });
  } catch (error) {
    console.error(`Error fetching posts for category "${categorySlug}":`, error);
    return [];
  }
});

// ─────────────────────────────────────────────
// Einzelner Beitrag mit ACF-Feldern
// ─────────────────────────────────────────────

export async function getMegamenuPostsByCategory(
  categorySlug: string,
  limit = 3
): Promise<Array<Post & { tools: ("rechner" | "checkliste" | "vergleich" | "dokumente")[] }>> {
  const client = getClient();
  const query = gql`
    query GetMegamenuPosts($slug: [String!]!, $first: Int!) {
      categories(where: { slug: $slug }) {
        nodes {
          posts(first: $first) {
            nodes {
              id
              title
              slug
              date
              excerpt
              content
              featuredImage { node { sourceUrl altText } }
              categories { nodes { name slug } }
              beitrag { untertitel }
            }
          }
        }
      }
    }
  `;
  try {
    const data = await client.request<{
      categories: {
        nodes: Array<{ posts: { nodes: (Post & { content?: string; beitrag?: { untertitel?: string } })[] } }>;
      };
    }>(query, { slug: [categorySlug], first: limit });
    const nodes = data.categories.nodes[0]?.posts.nodes || [];
    return nodes.map((post) => {
      const decoded = decodePostContent(post);
      if (post.beitrag?.untertitel) {
        decoded.beitragFelder = { ...decoded.beitragFelder, beitragUntertitel: post.beitrag.untertitel };
      }
      // tools VOR dem Strippen aus dem Content ableiten.
      const content = post.content || "";
      const tools: ("rechner" | "checkliste" | "vergleich" | "dokumente")[] = [];
      if (/wp:finanzleser\/rechner|data-finanzleser-rechner/.test(content)) tools.push("rechner");
      if (/wp:finanzleser\/vergleich|data-finanzleser-vergleich/.test(content)) tools.push("vergleich");
      if (/wp:finanzleser\/checkliste|data-finanzleser-checkliste/.test(content)) tools.push("checkliste");
      if (/wp:finanzleser\/dokumente|data-finanzleser-dokumente/.test(content)) tools.push("dokumente");
      // Konvention v2: Untertitel = 1. Content-<h2> (überschreibt stale ACF) + strippt content.
      applyContentHeaderTitle(decoded);
      return { ...decoded, tools };
    });
  } catch (error) {
    console.error(`Error fetching megamenu posts for "${categorySlug}":`, error);
    return [];
  }
}

export type MegamenuTool = { type: "rechner" | "vergleich" | "checkliste"; slug: string; title: string };

// Die 3 neuesten Finanztools, die in den Beiträgen einer Subkategorie eingebaut
// sind (neueste Beiträge zuerst). Ein Tool darf max. 2× erscheinen. Vollautomatisch
// aus dem Beitrags-Content — keine Backend-Pflege nötig. Verlinkung nach Typ.
export async function getMegamenuToolsByCategory(categorySlug: string): Promise<MegamenuTool[]> {
  const client = getClient();
  const postsQuery = gql`
    query GetCatPostContents($slug: [String!]!) {
      categories(where: { slug: $slug }) {
        nodes {
          posts(first: 25, where: { orderby: { field: DATE, order: DESC } }) {
            nodes { content }
          }
        }
      }
    }
  `;
  try {
    const data = await client.request<{
      categories: { nodes: Array<{ posts: { nodes: Array<{ content?: string }> } }> };
    }>(postsQuery, { slug: [categorySlug] });
    const posts = data.categories.nodes[0]?.posts.nodes || [];

    const counts = new Map<string, number>();
    const picked: Array<{ type: "rechner" | "vergleich" | "checkliste"; slug: string }> = [];
    for (const p of posts) {
      // Regex PRO Beitrag neu erzeugen — sonst trägt lastIndex (g-Flag) über
      // verschiedene content-Strings hinweg und überspringt Treffer.
      const embedRe = /data-finanzleser-(rechner|vergleich|checkliste)="([^"]+)"|wp:finanzleser\/(rechner|vergleich|checkliste)\s*\{"slug":"([^"]+)"\}/g;
      const content = p.content || "";
      let m: RegExpExecArray | null;
      while ((m = embedRe.exec(content)) !== null) {
        const type = (m[1] || m[3]) as "rechner" | "vergleich" | "checkliste";
        const slug = m[2] || m[4];
        if (!type || !slug) continue;
        const key = `${type}:${slug}`;
        const c = counts.get(key) || 0;
        if (c >= 2) continue; // dasselbe Tool max. 2×
        counts.set(key, c + 1);
        picked.push({ type, slug });
        if (picked.length >= 3) break;
      }
      if (picked.length >= 3) break;
    }
    if (picked.length === 0) return [];

    // Titel pro Tool auflösen (aliased Single-Node-Queries je CPT-Typ).
    const fieldFor = (t: string) => (t === "rechner" ? "rechnerBy" : t === "checkliste" ? "checklisteBy" : "vergleichBy");
    const aliases = picked
      .map((e, i) => `t${i}: ${fieldFor(e.type)}(slug: ${JSON.stringify(e.slug)}) { title slug }`)
      .join("\n");
    try {
      const titleData = await client.request<Record<string, { title?: string } | null>>(`query { ${aliases} }`);
      return picked.map((e, i) => ({ ...e, title: titleData[`t${i}`]?.title || e.slug }));
    } catch {
      // Titel-Auflösung fehlgeschlagen → Slug als Fallback-Titel (Links bleiben korrekt).
      return picked.map((e) => ({ ...e, title: e.slug }));
    }
  } catch (error) {
    console.error(`Error fetching megamenu tools for "${categorySlug}":`, error);
    return [];
  }
}

// Schlanke Query nur für die Artikel-Vorschau (erster Absatz, Lesezeit, Tools).
// getPostBySlug zieht Autor, alle Kategorien + ACF — overkill für die Preview
// und spürbar langsamer. Hier nur content laden → schnellerer Roundtrip, kürzeres
// Skeleton im Vorschauslider.
export async function getPostContentBySlug(slug: string): Promise<string | null> {
  const client = getClient();
  const query = gql`
    query GetPostContent($slug: String!) {
      posts(where: { name: $slug }) {
        nodes {
          content
        }
      }
    }
  `;
  try {
    const data = await client.request<{ posts: { nodes: Array<{ content?: string }> } }>(query, { slug });
    const node = data.posts.nodes[0];
    if (!node) return null;
    return node.content || "";
  } catch (error) {
    console.error(`Error fetching post content for "${slug}":`, error);
    return null;
  }
}

// ── Build-Bulk ──
// Beim SSG-Build alle Standard-Posts MIT content in ~8 gebündelten Abfragen holen statt
// 200+ Einzel-getPostBySlug → IONOS-Shared-Hosting wird nicht überlastet (verhindert die
// reihenweise gebackenen notFound()-404). Modul-Memo = pro Build-Worker-Prozess EINMAL.
// Zur LAUFZEIT (on-demand/ISR) NICHT genutzt → dort frische Einzelabfrage.
let _postsMapPromise: Promise<Map<string, Post>> | null = null;
function getAllPostsMap(): Promise<Map<string, Post>> {
  if (!_postsMapPromise) _postsMapPromise = buildPostsMap();
  return _postsMapPromise;
}
async function buildPostsMap(): Promise<Map<string, Post>> {
  const client = getClient();
  const query = gql`
    query BulkPosts($after: String) {
      posts(first: 25, after: $after) {
        pageInfo { hasNextPage endCursor }
        nodes {
          id title slug date content excerpt
          featuredImage { node { sourceUrl altText } }
          author { node { id name firstName lastName description avatar { url } } }
          categories { nodes { name slug } }
          beitrag { untertitel featuredTool }
        }
      }
    }
  `;
  type BulkPostsResponse = {
    posts: { nodes: (Post & { beitrag?: { untertitel?: string; featuredTool?: boolean } })[]; pageInfo: { hasNextPage: boolean; endCursor: string } };
  };
  const map = new Map<string, Post>();
  let after: string | null = null;
  let hasNext = true;
  let guard = 0;
  while (hasNext && guard++ < 60) {
    try {
      const data: BulkPostsResponse = await client.request<BulkPostsResponse>(query, { after });
      for (const node of data.posts.nodes) {
        const decoded = decodePostContent(node) as Post & { beitrag?: { untertitel?: string; featuredTool?: boolean } };
        if (node.beitrag) {
          decoded.beitragFelder = { beitragUntertitel: node.beitrag.untertitel, beitragFeaturedTool: node.beitrag.featuredTool };
        }
        if (decoded.slug) map.set(decoded.slug, decoded);
      }
      hasNext = data.posts.pageInfo.hasNextPage;
      after = data.posts.pageInfo.endCursor;
    } catch (e) {
      // Teil-Map: fehlende Posts fallen unten auf die Einzelabfrage zurück (kein harter Abbruch).
      console.error("[buildPostsMap] chunk failed (partial map):", e);
      break;
    }
  }
  console.log(`[buildPostsMap] ${map.size} Posts gebündelt geladen`);
  return map;
}

const IS_BUILD = process.env.NEXT_PHASE === "phase-production-build";

// ── Build-Memo ──
// Beim SSG-Build dieselbe getAll*-Abfrage NICHT pro Seite neu feuern, sondern pro
// Worker-Prozess EINMAL (z.B. getAllVergleiche wird sonst von jeder der 42 Detailseiten
// erneut geholt). Zur LAUFZEIT (ISR/on-demand) kein Memo → frische Daten.
const _buildMemo = new Map<string, Promise<unknown>>();
function buildMemo<T>(key: string, fn: () => Promise<T>): Promise<T> {
  if (!IS_BUILD) return fn();
  let p = _buildMemo.get(key) as Promise<T> | undefined;
  if (!p) { p = fn(); _buildMemo.set(key, p); }
  return p;
}

// React.cache → dedupliziert den Doppel-Aufruf aus generateMetadata + Page-Component.
// Beim Build aus der Bulk-Map (1 Fetch/Worker), zur Laufzeit per Einzelabfrage (frisch).
export const getPostBySlug = cache(async (slug: string): Promise<Post | null> => {
  if (IS_BUILD) {
    const hit = (await getAllPostsMap()).get(slug);
    if (hit) return hit;
    // Nicht in der Bulk-Map (z.B. CPT/Legacy-Slug) → Einzelabfrage.
  }
  return getPostBySlugSingle(slug);
});

async function getPostBySlugSingle(slug: string): Promise<Post | null> {
  const client = getClient();

  // Query all post types (standard posts + custom post types like dokumente, nachrichten, etc.)
  // Note: Custom post types may not have ACF fields, so we query basics for all
  const query = gql`
    query GetPost($slug: String!) {
      posts(where: { name: $slug }) {
        nodes {
          id
          title
          slug
          date
          content
          excerpt
          featuredImage {
            node {
              sourceUrl
              altText
            }
          }
          author {
            node {
              id
              name
              firstName
              lastName
              description
              avatar {
                url
              }
            }
          }
          categories {
            nodes {
              name
              slug
            }
          }
        }
      }
    }
  `;

  // ACF-Felder (Untertitel/Featured-Tool) PARALLEL zur Hauptabfrage holen — beide
  // hängen nur am slug, kein Waterfall. Custom Post Types haben kein `beitrag` →
  // .catch(null), das ist ok.
  const aclQuery = gql`
    query GetPostACF($slug: String!) {
      postBy(slug: $slug) {
        beitrag {
          untertitel
          featuredTool
        }
      }
    }
  `;

  try {
    const [data, aclData] = await Promise.all([
      client.request<{ posts: { nodes: Post[] } }>(query, { slug }),
      client
        .request<{ postBy: { beitrag?: { untertitel?: string; featuredTool?: boolean } } | null }>(aclQuery, { slug })
        .catch(() => null),
    ]);

    let post = data.posts.nodes[0] || null;
    if (post) {
      post = decodePostContent(post);
      if (aclData?.postBy?.beitrag) {
        post.beitragFelder = {
          beitragUntertitel: aclData.postBy.beitrag.untertitel,
          beitragFeaturedTool: aclData.postBy.beitrag.featuredTool,
        };
      }
    }

    return post;
  } catch (error) {
    console.error(`Error fetching post with slug "${slug}":`, error);
    return null;
  }
}

// ─────────────────────────────────────────────
// Hauptkategorie mit Child-Kategorien
// ─────────────────────────────────────────────

export const getCategoryWithChildren = cache(async (categorySlug: string): Promise<{
  name: string;
  slug: string;
  description?: string;
  image?: string;
  imageWide?: string;
  children: Array<{ name: string; slug: string; count: number; description?: string; image?: string }>;
  posts: Post[];
} | null> => {
  const client = getClient();

  // EINE verschachtelte Query: Hauptkategorie + Child-Kategorien zusammen — vorher
  // zwei sequentielle Requests (2. brauchte die databaseId der 1.), jetzt ein
  // Roundtrip via `children`-Connection.
  const postFields = `
    nodes {
      id
      title
      slug
      date
      excerpt
      content
      featuredImage { node { sourceUrl altText } }
      categories { nodes { name slug } }
    }
  `;
  const query = gql`
    query GetCategoryWithChildren($slug: [String!]!) {
      categories(where: { slug: $slug }) {
        nodes {
          databaseId
          name
          slug
          description
          kategorieBildSlider { sourceUrl }
          kategorieBildWide { sourceUrl }
          posts(first: 6) { ${postFields} }
          children(first: 50) {
            nodes {
              name
              slug
              count
              description
              kategorieBildSlider { sourceUrl }
              posts(first: 6) { ${postFields} }
            }
          }
        }
      }
    }
  `;

  try {
    const categoryData = await client.request<{
      categories: {
        nodes: Array<{
          databaseId: number;
          name: string;
          slug: string;
          description?: string;
          kategorieBildSlider?: { sourceUrl: string };
          kategorieBildWide?: { sourceUrl: string };
          posts: { nodes: Post[] };
          children: {
            nodes: Array<{
              name: string;
              slug: string;
              count: number;
              description?: string;
              kategorieBildSlider?: { sourceUrl: string };
              posts: { nodes: Post[] };
            }>;
          };
        }>;
      };
    }>(query, { slug: [categorySlug] });

    const category = categoryData.categories.nodes[0];
    if (!category) return null;

    const childNodes = category.children?.nodes ?? [];

    // Tools aus dem Content ableiten, dann content aus dem Payload entfernen (schlank halten).
    const mapPost = (post: Post & { content?: string }): Post => {
      const tools = detectToolTypes(post.content);
      const decoded = decodePostContent(post) as Post & { content?: string };
      delete decoded.content;
      return { ...decoded, tools };
    };

    // If no direct posts, collect from children
    let allPosts = category.posts.nodes.map(mapPost);
    if (allPosts.length === 0 && childNodes.length > 0) {
      childNodes.forEach((child) => {
        allPosts = allPosts.concat(child.posts.nodes.map(mapPost));
      });
      allPosts = allPosts.slice(0, 6); // limit to 6
    }

    return {
      name: category.name,
      slug: category.slug,
      description: category.description || undefined,
      image: category.kategorieBildSlider?.sourceUrl || undefined,
      imageWide: category.kategorieBildWide?.sourceUrl || undefined,
      children: childNodes.map((child) => ({
        name: child.name,
        slug: child.slug,
        count: child.count,
        description: child.description || undefined,
        image: child.kategorieBildSlider?.sourceUrl || undefined,
      })),
      posts: allPosts,
    };
  } catch (error) {
    console.error(`Error fetching category with children "${categorySlug}":`, error);
    return null;
  }
});

// ─────────────────────────────────────────────
// Navigation: Hauptkategorien + Subkategorien aus WordPress
// ─────────────────────────────────────────────

const NAV_MAIN_SLUGS = ["finanzen", "versicherungen", "steuern", "recht"];

export async function getNavItems(): Promise<
  Array<{
    label: string;
    href: string;
    megamenu: boolean;
    submenu: Array<{ label: string; href: string }>;
  }>
> {
  const client = getClient();

  const query = gql`
    query GetNavCategories($slugs: [String!]!) {
      categories(where: { slug: $slugs }, first: 10) {
        nodes {
          databaseId
          name
          slug
          children(first: 20) {
            nodes {
              name
              slug
            }
          }
        }
      }
    }
  `;

  try {
    const data = await client.request<{
      categories: {
        nodes: Array<{
          databaseId: number;
          name: string;
          slug: string;
          children: { nodes: Array<{ name: string; slug: string }> };
        }>;
      };
    }>(query, { slugs: NAV_MAIN_SLUGS });

    // Sort by the order defined in NAV_MAIN_SLUGS
    const sorted = NAV_MAIN_SLUGS.map((slug) =>
      data.categories.nodes.find((c) => c.slug === slug)
    ).filter(Boolean) as typeof data.categories.nodes;

    return sorted.map((cat) => ({
      label: cat.name,
      href: `/${cat.slug}`,
      megamenu: true,
      submenu: cat.children.nodes.map((child) => ({
        label: child.name,
        href: `/${cat.slug}/${child.slug}`,
      })),
    }));
  } catch (error) {
    console.error("Error fetching nav items from WordPress:", error);
    return [];
  }
}

// ─────────────────────────────────────────────
// Dynamische Menü-Kategorien (Rechner, Checklisten, Vergleiche)
// ─────────────────────────────────────────────

export interface ToolCategory {
  label: string;
  href: string;
  count: number;
  cptCount: number;
  postCount: number;
}

export async function getToolCategories(): Promise<ToolCategory[]> {
  const client = getClient();

  // WPGraphQL clamped first: N auf 100 → paginieren bis hasNextPage=false
  const countAllNodes = async (fieldName: "allRechner" | "checklisten" | "vergleiche"): Promise<number> => {
    let total = 0;
    let after: string | null = null;
    while (true) {
      const data: Record<string, { nodes: Array<{ id: string }>; pageInfo: { hasNextPage: boolean; endCursor: string | null } }> = await client.request(
        `query($after: String) {
          ${fieldName}(first: 100, after: $after) {
            nodes { id }
            pageInfo { hasNextPage endCursor }
          }
        }`,
        { after }
      );
      const connection = data[fieldName];
      total += connection.nodes.length;
      if (!connection.pageInfo.hasNextPage) break;
      after = connection.pageInfo.endCursor;
    }
    return total;
  };

  const categoryQuery = gql`
    query GetToolPostCategories {
      rechnerCategory: categories(where: { slug: ["rechner"] }) {
        nodes {
          count
        }
      }
      checklistenCategory: categories(where: { slug: ["checkliste"] }) {
        nodes {
          count
        }
      }
      vergleichCategory: categories(where: { slug: ["vergleich"] }) {
        nodes {
          count
        }
      }
    }
  `;

  try {
    const [rechnerCptCount, checklistenCptCount, vergleicheCptCount, catData] = await Promise.all([
      countAllNodes("allRechner"),
      countAllNodes("checklisten"),
      countAllNodes("vergleiche"),
      client.request<{
        rechnerCategory: { nodes: Array<{ count: number }> };
        checklistenCategory: { nodes: Array<{ count: number }> };
        vergleichCategory: { nodes: Array<{ count: number }> };
      }>(categoryQuery),
    ]);

    const categories: ToolCategory[] = [];

    // Rechner (CPT + Posts mit Kategorie)
    const rechnerPostCount = catData.rechnerCategory.nodes[0]?.count || 0;
    const rechnerTotal = rechnerCptCount + rechnerPostCount;
    if (rechnerTotal > 0) {
      categories.push({
        label: "Rechner",
        href: "/finanztools/rechner",
        count: rechnerTotal,
        cptCount: rechnerCptCount,
        postCount: rechnerPostCount,
      });
    }

    // Checklisten (CPT + Posts mit Kategorie)
    const checklistenPostCount = catData.checklistenCategory.nodes[0]?.count || 0;
    const checklistenTotal = checklistenCptCount + checklistenPostCount;
    if (checklistenTotal > 0) {
      categories.push({
        label: "Checklisten",
        href: "/finanztools/checklisten",
        count: checklistenTotal,
        cptCount: checklistenCptCount,
        postCount: checklistenPostCount,
      });
    }

    // Vergleiche (CPT + Posts mit Kategorie)
    const vergleichePostCount = catData.vergleichCategory.nodes[0]?.count || 0;
    const vergleicheTotal = vergleicheCptCount + vergleichePostCount;
    if (vergleicheTotal > 0) {
      categories.push({
        label: "Vergleiche",
        href: "/finanztools/vergleiche",
        count: vergleicheTotal,
        cptCount: vergleicheCptCount,
        postCount: vergleichePostCount,
      });
    }

    return categories;
  } catch (error) {
    console.error("Error fetching tool categories:", error);
    return [];
  }
}

// ─────────────────────────────────────────────
// Alle Rechner
// ─────────────────────────────────────────────

// ─────────────────────────────────────────────
// Alle Rechner
// ─────────────────────────────────────────────

// ─────────────────────────────────────────────
// Posts & CPTs nach Kategorie (kombiniert)
// ─────────────────────────────────────────────

export async function getPostsAndCPTsByCategory(categorySlug: string): Promise<Post[]> {
  const client = getClient();

  const query = gql`
    query GetPostsByCategory($slug: [String!]!) {
      categories(where: { slug: $slug }) {
        nodes {
          posts(first: 100) {
            nodes {
              id
              title
              slug
              date
              excerpt
              featuredImage {
                node {
                  sourceUrl
                  altText
                }
              }
              categories {
                nodes {
                  name
                  slug
                }
              }
            }
          }
        }
      }
    }
  `;

  try {
    const data = await client.request<{
      categories: {
        nodes: Array<{ posts: { nodes: Post[] } }>;
      };
    }>(query, {
      slug: [categorySlug],
    });

    const posts = data.categories.nodes[0]?.posts.nodes || [];
    return posts.map(post => decodePostContent(post));
  } catch (error) {
    console.error(`Error fetching posts for category "${categorySlug}":`, error);
    return [];
  }
}

// ─────────────────────────────────────────────
// Alle Rechner
// ─────────────────────────────────────────────

export async function getAllRechner(): Promise<Rechner[]> {
  return buildMemo("allRechner", _fetchAllRechner);
}
async function _fetchAllRechner(): Promise<Rechner[]> {
  const client = getClient();

  const query = gql`
    query GetRechner {
      allRechner(first: 100) {
        nodes {
          id
          title
          slug
          excerpt
          rechnerFelder {
            rechnerTyp
            beschreibung
          }
        }
      }
    }
  `;

  try {
    const data = await client.request<{ allRechner: { nodes: Rechner[] } }>(query);
    return data.allRechner.nodes;
  } catch (error) {
    console.error("Error fetching all Rechner:", error);
    return [];
  }
}

// ─────────────────────────────────────────────
// Einzelner Rechner nach Slug
// ─────────────────────────────────────────────

export async function getRechnerBySlug(slug: string): Promise<Rechner | null> {
  if (IS_BUILD) {
    const hit = (await getAllRechner()).find((r) => r.slug === slug);
    if (hit) return hit;
  }
  const client = getClient();

  const query = gql`
    query GetRechnerBySlug($slug: String!) {
      rechnerBy(slug: $slug) {
        id
        title
        slug
        excerpt
        rechnerFelder {
          beschreibung
        }
      }
    }
  `;

  try {
    const data = await client.request<{ rechnerBy: Rechner }>(query, { slug });
    return data.rechnerBy;
  } catch (error) {
    console.error(`Error fetching Rechner with slug "${slug}":`, error);
    return null;
  }
}

// ─────────────────────────────────────────────
// Alle Checklisten
// ─────────────────────────────────────────────

export async function getAllChecklisten(): Promise<Checkliste[]> {
  return buildMemo("allChecklisten", _fetchAllChecklisten);
}
async function _fetchAllChecklisten(): Promise<Checkliste[]> {
  const client = getClient();

  const query = gql`
    query GetChecklisten($after: String) {
      checklisten(first: 100, after: $after) {
        pageInfo {
          hasNextPage
          endCursor
        }
        nodes {
          id
          title
          slug
          excerpt
          checklisten {
            checklistenBeschreibung
          }
        }
      }
    }
  `;

  try {
    const allNodes: Checkliste[] = [];
    let hasNextPage = true;
    let after: string | null = null;

    type ChecklistenResponse = {
      checklisten: { nodes: Checkliste[]; pageInfo: { hasNextPage: boolean; endCursor: string } };
    };
    while (hasNextPage) {
      const data: ChecklistenResponse = await client.request<ChecklistenResponse>(query, { after });
      allNodes.push(...data.checklisten.nodes);
      hasNextPage = data.checklisten.pageInfo.hasNextPage;
      after = data.checklisten.pageInfo.endCursor;
    }

    return allNodes.sort((a, b) => a.title.localeCompare(b.title, "de"));
  } catch (error) {
    console.error("Error fetching all Checklisten:", error);
    return [];
  }
}

// ─────────────────────────────────────────────
// Einzelne Checkliste nach Slug
// ─────────────────────────────────────────────

// Build-Bulk MIT PDF-URL (getAllChecklisten holt die nicht) → eine Map für alle
// getChecklisteBySlug-Aufrufe (207 Detailseiten + Artikel-Checklisten).
function getAllChecklistenFullMap(): Promise<Map<string, Checkliste>> {
  return buildMemo("checklistenFull", async () => {
    const client = getClient();
    const query = gql`
      query BulkChecklistenFull($after: String) {
        checklisten(first: 50, after: $after) {
          pageInfo { hasNextPage endCursor }
          nodes {
            id title slug excerpt
            checklisten { checklistenBeschreibung checklistePdf { node { mediaItemUrl } } }
          }
        }
      }
    `;
    type Resp = { checklisten: { nodes: Checkliste[]; pageInfo: { hasNextPage: boolean; endCursor: string } } };
    const map = new Map<string, Checkliste>();
    let after: string | null = null;
    let hasNext = true;
    let guard = 0;
    while (hasNext && guard++ < 60) {
      try {
        const data: Resp = await client.request<Resp>(query, { after });
        for (const n of data.checklisten.nodes) { if (n.slug) map.set(n.slug, n); }
        hasNext = data.checklisten.pageInfo.hasNextPage;
        after = data.checklisten.pageInfo.endCursor;
      } catch (e) {
        console.error("[checklistenFull] chunk failed (partial map):", e);
        break;
      }
    }
    console.log(`[checklistenFull] ${map.size} Checklisten gebündelt`);
    return map;
  });
}

export async function getChecklisteBySlug(slug: string): Promise<Checkliste | null> {
  // Build: aus Bulk-Map; Laufzeit: Einzelabfrage (Freshness via ISR + On-Demand-Revalidate).
  if (IS_BUILD) {
    const hit = (await getAllChecklistenFullMap()).get(slug);
    if (hit) return hit;
  }
  const client = getClient();

  const query = gql`
    query GetChecklisteBySlug($slug: String!) {
      checklisteBy(slug: $slug) {
        id
        title
        slug
        excerpt
        checklisten {
          checklistenBeschreibung
          checklistePdf {
            node {
              mediaItemUrl
            }
          }
        }
      }
    }
  `;

  try {
    const data = await client.request<{ checklisteBy: Checkliste }>(query, { slug });
    return data.checklisteBy;
  } catch (error) {
    console.error(`Error fetching Checkliste with slug "${slug}":`, error);
    return null;
  }
}

// ─────────────────────────────────────────────
// Alle Dokumente
// ─────────────────────────────────────────────

export async function getAllDokumente(): Promise<Dokument[]> {
  return buildMemo("allDokumente", _fetchAllDokumente);
}
async function _fetchAllDokumente(): Promise<Dokument[]> {
  const client = getClient();

  const query = gql`
    query GetDokumente($after: String) {
      dokumente(first: 100, after: $after) {
        pageInfo {
          hasNextPage
          endCursor
        }
        nodes {
          id
          title
          slug
          excerpt
          pdfFile {
            mediaItemUrl
            title
            mediaDetails {
              file
            }
          }
          dokumentKategorien {
            nodes {
              name
              slug
            }
          }
          featuredImage {
            node {
              sourceUrl
            }
          }
        }
      }
    }
  `;

  try {
    const allNodes: Dokument[] = [];
    let hasNextPage = true;
    let after: string | null = null;

    type DokumenteResponse = {
      dokumente: { nodes: Dokument[]; pageInfo: { hasNextPage: boolean; endCursor: string } };
    };
    while (hasNextPage) {
      const data: DokumenteResponse = await client.request<DokumenteResponse>(query, { after });
      allNodes.push(...data.dokumente.nodes);
      hasNextPage = data.dokumente.pageInfo.hasNextPage;
      after = data.dokumente.pageInfo.endCursor;
    }

    return allNodes.sort((a, b) => a.title.localeCompare(b.title, "de"));
  } catch (error) {
    console.error("Error fetching all Dokumente:", error);
    return [];
  }
}

// ─────────────────────────────────────────────
// Einzelnes Dokument nach Slug
// ─────────────────────────────────────────────

export async function getDokumentBySlug(slug: string): Promise<Dokument | null> {
  if (IS_BUILD) {
    const hit = (await getAllDokumente()).find((d) => d.slug === slug);
    if (hit) return hit;
  }
  const client = getClient();

  const query = gql`
    query GetDokumentBySlug($slug: String!) {
      dokumentBy(slug: $slug) {
        id
        title
        slug
        excerpt
        pdfFile {
          mediaItemUrl
          title
          mediaDetails {
            file
          }
        }
        dokumentKategorien {
          nodes {
            name
            slug
          }
        }
        featuredImage {
          node {
            sourceUrl
          }
        }
      }
    }
  `;

  try {
    const data = await client.request<{ dokumentBy: Dokument | null }>(query, { slug });
    return data.dokumentBy;
  } catch (error) {
    console.error(`Error fetching Dokument with slug "${slug}":`, error);
    return null;
  }
}

// ─────────────────────────────────────────────
// Mehrere Dokumente nach Slugs (für Dokumente-Block im Artikel, ≤4)
// ─────────────────────────────────────────────

export async function getDokumenteBySlugs(slugs: string[]): Promise<Dokument[]> {
  const unique = Array.from(new Set(slugs.map((s) => s.trim()).filter(Boolean))).slice(0, 4);
  if (unique.length === 0) return [];
  const results = await Promise.all(unique.map((slug) => getDokumentBySlug(slug)));
  // Reihenfolge der Slugs beibehalten, null (nicht gefunden) herausfiltern.
  return results.filter((d): d is Dokument => d !== null);
}

// ─────────────────────────────────────────────
// Alle Vergleiche
// ─────────────────────────────────────────────

export async function getAllVergleiche(): Promise<Vergleich[]> {
  return buildMemo("allVergleiche", _fetchAllVergleiche);
}
async function _fetchAllVergleiche(): Promise<Vergleich[]> {
  const client = getClient();

  const query = gql`
    query GetVergleiche {
      vergleiche(first: 100) {
        nodes {
          id
          title
          slug
          excerpt
        }
      }
    }
  `;

  try {
    const data = await client.request<{ vergleiche: { nodes: Vergleich[] } }>(query);
    return data.vergleiche.nodes.sort((a, b) => a.title.localeCompare(b.title, "de"));
  } catch (error) {
    console.error("Error fetching all Vergleiche:", error);
    return [];
  }
}

// ─────────────────────────────────────────────
// Neueste Finanztools (je 1: Rechner, Checkliste, Vergleich) — für Landing-Sidebar
// ─────────────────────────────────────────────

export async function getLatestFinanztools(): Promise<LatestTool[]> {
  const client = getClient();

  // Beschreibung kommt jetzt einheitlich aus dem WP-Textauszug (excerpt, HTML) für alle 3 CPTs.
  const query = gql`
    query GetLatestFinanztools {
      allRechner(first: 1, where: { orderby: { field: DATE, order: DESC } }) {
        nodes { title slug excerpt }
      }
      checklisten(first: 1, where: { orderby: { field: DATE, order: DESC } }) {
        nodes { title slug excerpt }
      }
      vergleiche(first: 1, where: { orderby: { field: DATE, order: DESC } }) {
        nodes { title slug excerpt }
      }
    }
  `;

  try {
    const data = await client.request<{
      allRechner: { nodes: { title: string; slug: string; excerpt?: string }[] };
      checklisten: { nodes: { title: string; slug: string; excerpt?: string }[] };
      vergleiche: { nodes: { title: string; slug: string; excerpt?: string }[] };
    }>(query);

    const tools: LatestTool[] = [];
    const r = data.allRechner.nodes[0];
    if (r) tools.push({ type: "rechner", label: "Rechner", title: decodeHtmlEntities(r.title), description: stripHtml(r.excerpt), href: `/finanztools/rechner/${r.slug}` });
    const c = data.checklisten.nodes[0];
    if (c) tools.push({ type: "checkliste", label: "Checkliste", title: decodeHtmlEntities(c.title), description: stripHtml(c.excerpt), href: `/finanztools/checklisten/${c.slug}` });
    const v = data.vergleiche.nodes[0];
    if (v) tools.push({ type: "vergleich", label: "Vergleich", title: decodeHtmlEntities(v.title), description: stripHtml(v.excerpt), href: `/finanztools/vergleiche/${v.slug}` });
    return tools;
  } catch (error) {
    console.error("Error fetching latest Finanztools:", error);
    return [];
  }
}

// ─────────────────────────────────────────────
// Vergleiche – zuletzt geändert
// ─────────────────────────────────────────────

export async function getLatestVergleiche(limit = 10): Promise<Vergleich[]> {
  const client = getClient();

  const query = gql`
    query GetLatestVergleiche($first: Int!) {
      vergleiche(first: $first, where: { orderby: { field: MODIFIED, order: DESC } }) {
        nodes {
          id
          title
          slug
        }
      }
    }
  `;

  try {
    const data = await client.request<{ vergleiche: { nodes: Vergleich[] } }>(query, {
      first: limit,
    });
    return data.vergleiche.nodes;
  } catch (error) {
    console.error("Error fetching latest Vergleiche:", error);
    return [];
  }
}

// ─────────────────────────────────────────────
// Tools (Rechner/Vergleiche/Checklisten) nach Slugs
// ─────────────────────────────────────────────

export async function getToolsBySlug(slugs: string[]): Promise<Post[]> {
  const client = getClient();

  // Query posts and CPTs by slug
  const query = gql`
    query GetToolsBySlug($slugs: [String!]!) {
      posts(where: { name: $slugs }, first: 100) {
        nodes {
          id
          title
          slug
        }
      }
    }
  `;

  try {
    const data = await client.request<{ posts: { nodes: Post[] } }>(query, {
      slugs,
    });
    return data.posts.nodes;
  } catch (error) {
    console.error("Error fetching tools by slug:", error);
    return [];
  }
}

// ─────────────────────────────────────────────
// Kategorie Details mit Parent-Info
// ─────────────────────────────────────────────

export const getCategoryBySlug = cache(async (slug: string) => {
  const client = getClient();

  const query = gql`
    query GetCategory($slug: [String]!) {
      categories(where: { slug: $slug }, first: 1) {
        nodes {
          id
          name
          slug
          description
          kategorieBildSlider {
            sourceUrl
          }
          kategorieBildWide {
            sourceUrl
          }
          parent {
            node {
              id
              name
              slug
            }
          }
        }
      }
    }
  `;

  try {
    const data = await client.request<{
      categories: {
        nodes: Array<{
          id: string;
          name: string;
          slug: string;
          description?: string;
          kategorieBildSlider?: { sourceUrl: string };
          kategorieBildWide?: { sourceUrl: string };
          parent?: { node: { id: string; name: string; slug: string } };
        }>;
      };
    }>(query, { slug });

    const cat = data.categories.nodes[0];
    if (!cat) return null;
    return {
      id: cat.id,
      name: cat.name,
      slug: cat.slug,
      description: cat.description || undefined,
      image: cat.kategorieBildSlider?.sourceUrl || undefined,
      imageWide: cat.kategorieBildWide?.sourceUrl || undefined,
      parent: cat.parent?.node || null,
    };
  } catch (error) {
    console.error("Error fetching category:", error);
    return null;
  }
});

// ─────────────────────────────────────────────
// Rechner-Konfiguration aus WordPress ACF
// ─────────────────────────────────────────────

export async function getLatestPostsByCategoryIds(
  categoryIds: number[],
  limit = 10,
  excludeDatabaseId?: number
): Promise<Post[]> {
  if (categoryIds.length === 0) return [];
  const client = getClient();

  const query = gql`
    query GetLatestByCats($cats: [ID], $first: Int!, $notIn: [ID]) {
      posts(
        first: $first
        where: { categoryIn: $cats, notIn: $notIn, orderby: { field: DATE, order: DESC } }
      ) {
        nodes {
          id
          databaseId
          title
          slug
          date
          excerpt
          content
          featuredImage { node { sourceUrl altText } }
          categories { nodes { name slug databaseId } }
          beitrag { untertitel }
        }
      }
    }
  `;

  async function fetchPosts(cats: number[], exclude: number[]): Promise<Post[]> {
    try {
      const data = await client.request<{
        posts: { nodes: (Post & { beitrag?: { untertitel?: string }; content?: string; databaseId: number })[] };
      }>(query, {
        cats: cats.map(String),
        first: limit + (exclude.length || 0) + 5,
        notIn: exclude.map(String),
      });
      return data.posts.nodes.map((post) => {
        const decoded = decodePostContent(post);
        if (post.beitrag?.untertitel) {
          decoded.beitragFelder = {
            ...decoded.beitragFelder,
            beitragUntertitel: post.beitrag.untertitel,
          };
        }
        // Konvention v2: Karten-Untertitel = 1. Content-<h2> (überschreibt stale ACF).
        // databaseId für den Fallback-Dedup erhalten (applyContentHeaderTitle strippt nur content).
        return applyContentHeaderTitle(decoded as Post & { content?: string; databaseId: number });
      });
    } catch (error) {
      console.error("Error fetching posts by category IDs:", error);
      return [];
    }
  }

  const excludeArr = excludeDatabaseId ? [excludeDatabaseId] : [];
  let posts = await fetchPosts(categoryIds, excludeArr);

  // Fallback: wenn zu wenige → Parent-Kategorien mit einbeziehen
  if (posts.length < limit) {
    const parentIds = await getParentCategoryIds(categoryIds);
    const newIds = parentIds.filter((id) => !categoryIds.includes(id));
    if (newIds.length > 0) {
      const existingIds = new Set(posts.map((p) => (p as Post & { databaseId?: number }).databaseId));
      const fallbackExclude = [...excludeArr, ...posts.map((p) => (p as Post & { databaseId?: number }).databaseId!).filter(Boolean)];
      const extra = await fetchPosts(newIds, fallbackExclude);
      for (const post of extra) {
        const dbId = (post as Post & { databaseId?: number }).databaseId;
        if (dbId && !existingIds.has(dbId)) {
          posts.push(post);
          if (posts.length >= limit) break;
        }
      }
    }
  }

  return posts.slice(0, limit);
}

async function getParentCategoryIds(categoryIds: number[]): Promise<number[]> {
  const client = getClient();
  const query = gql`
    query GetParents($ids: [ID]) {
      categories(where: { include: $ids }, first: 100) {
        nodes {
          databaseId
          parent { node { databaseId } }
        }
      }
    }
  `;
  try {
    const data = await client.request<{
      categories: { nodes: Array<{ databaseId: number; parent?: { node?: { databaseId: number } } }> };
    }>(query, { ids: categoryIds.map(String) });
    const parents = data.categories.nodes
      .map((c) => c.parent?.node?.databaseId)
      .filter((id): id is number => typeof id === "number");
    return Array.from(new Set(parents));
  } catch (error) {
    console.error("Error fetching parent category IDs:", error);
    return [];
  }
}

export async function getRechnerConfig(): Promise<RechnerConfigOverrides | null> {
  const wpUrl = process.env.WORDPRESS_API_URL;
  if (!wpUrl) return null;

  // Extract base URL (remove /graphql)
  const baseUrl = wpUrl.replace('/graphql', '');

  try {
    // REST API: Holt ACF Options via custom Endpoint
    const response = await fetch(`${baseUrl}/wp-json/finanzleser/v1/rechner-config`, {
      next: { revalidate: 3600 },
    });
    if (!response.ok) return null;

    const data = await response.json();

    // Endpoint gibt Werte direkt zurück
    const config: RechnerConfigOverrides = {
      rc_mindestlohn: data.rc_mindestlohn,
      rc_kindergeld: data.rc_kindergeld,
      rc_rentenwert: data.rc_rentenwert,
      rc_rv_an: data.rc_rv_an,
      rc_kv_an: data.rc_kv_an,
      rc_kv_zusatz: data.rc_kv_zusatz,
      rc_pv_kinderlos: data.rc_pv_kinderlos,
      rc_alv_an: data.rc_alv_an,
      rc_grundfreibetrag: data.rc_grundfreibetrag,
      rc_bbg_kv: data.rc_bbg_kv,
      rc_bbg_rv: data.rc_bbg_rv,
      rc_elterngeld_min: data.rc_elterngeld_min,
      rc_elterngeld_max: data.rc_elterngeld_max,
    };

    return Object.keys(config).some(key => config[key as keyof RechnerConfigOverrides] !== undefined) ? config : null;
  } catch (error) {
    console.error("Error fetching rechner config from WordPress:", error);
    return null;
  }
}

// ─────────────────────────────────────────────
// Site-Settings (TopBanner & Co.)
// ─────────────────────────────────────────────

export const SITE_SETTINGS_FALLBACK: SiteSettings = {
  top_banner: {
    visibility: "off",
    text: "",
    link_type: "none",
    link_value: "",
  },
  // Default: Werbung aus — sicherer Zustand, falls WP nicht erreichbar.
  article_ads: {
    top: false,
    rails: false,
    mid: false,
  },
};

export async function getSiteSettings(): Promise<SiteSettings> {
  const wpUrl = process.env.WORDPRESS_API_URL;
  if (!wpUrl) return SITE_SETTINGS_FALLBACK;

  const baseUrl = wpUrl.replace("/graphql", "");
  try {
    const res = await fetch(`${baseUrl}/wp-json/finanzleser/v1/site-settings`, {
      next: { revalidate: 3600 },
    });
    if (!res.ok) return SITE_SETTINGS_FALLBACK;
    const data = (await res.json()) as Partial<SiteSettings>;
    return {
      top_banner: { ...SITE_SETTINGS_FALLBACK.top_banner, ...(data.top_banner ?? {}) },
      article_ads: { ...SITE_SETTINGS_FALLBACK.article_ads, ...(data.article_ads ?? {}) },
    };
  } catch (error) {
    console.error("Error fetching site settings from WordPress:", error);
    return SITE_SETTINGS_FALLBACK;
  }
}

// ─────────────────────────────────────────────
// Statische WP-Pages (Impressum, Datenschutz, …)
// ─────────────────────────────────────────────

export type WpPage = {
  title: string;
  content: string;
  modified: string;
  seoTitle?: string;
  seoDescription?: string;
};

export async function getPageBySlug(slug: string): Promise<WpPage | null> {
  const wpUrl = process.env.WORDPRESS_API_URL;
  if (!wpUrl) return null;
  const baseUrl = wpUrl.replace("/graphql", "");

  try {
    const response = await fetch(
      `${baseUrl}/wp-json/wp/v2/pages?slug=${encodeURIComponent(slug)}&_fields=title,content,modified,yoast_head_json`,
      { next: { revalidate: 3600 } },
    );
    if (!response.ok) return null;
    const arr = await response.json();
    if (!Array.isArray(arr) || arr.length === 0) return null;
    const page = arr[0];
    return {
      title: page.title?.rendered ?? "",
      content: page.content?.rendered ?? "",
      modified: page.modified ?? "",
      seoTitle: page.yoast_head_json?.title,
      seoDescription: page.yoast_head_json?.description,
    };
  } catch (error) {
    console.error(`Error fetching page "${slug}" from WordPress:`, error);
    return null;
  }
}

// ─────────────────────────────────────────────
// Anbieter (CPT): Einzelseite nach Slug
// ─────────────────────────────────────────────

export async function getAnbieterBySlug(slug: string): Promise<AnbieterPost | null> {
  const client = getClient();

  const query = gql`
    query GetAnbieter($slug: String!) {
      anbieterBy(slug: $slug) {
        id
        title
        slug
        content
      }
    }
  `;

  try {
    const data = await client.request<{ anbieterBy: AnbieterPost | null }>(query, { slug });
    return data.anbieterBy;
  } catch (error) {
    console.error(`Error fetching Anbieter with slug "${slug}":`, error);
    return null;
  }
}

// ─────────────────────────────────────────────
// Anbieter (CPT): alle (fuer Uebersicht)
// ─────────────────────────────────────────────

export async function getAllAnbieter(): Promise<AnbieterPost[]> {
  const client = getClient();

  const query = gql`
    query GetAllAnbieter($after: String) {
      allAnbieter(first: 100, after: $after) {
        pageInfo {
          hasNextPage
          endCursor
        }
        nodes {
          id
          title
          slug
        }
      }
    }
  `;

  type AllAnbieterData = {
    allAnbieter: { pageInfo: { hasNextPage: boolean; endCursor: string | null }; nodes: AnbieterPost[] };
  };

  try {
    const all: AnbieterPost[] = [];
    let after: string | null = null;
    let hasNext = true;
    while (hasNext) {
      const data: AllAnbieterData = await client.request<AllAnbieterData>(query, { after });
      all.push(...data.allAnbieter.nodes);
      hasNext = data.allAnbieter.pageInfo.hasNextPage;
      after = data.allAnbieter.pageInfo.endCursor;
    }
    return all;
  } catch (error) {
    console.error("Error fetching all Anbieter:", error);
    return [];
  }
}
