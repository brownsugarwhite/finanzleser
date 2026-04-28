import { GraphQLClient, gql } from "graphql-request";
import type { Post, Rechner, Checkliste, Vergleich, Dokument, PostACF, SEO, RechnerConfigOverrides, AnbieterPost } from "./types";
import { decodePostContent } from "./html-utils";

function getClient(revalidate: number = 3600): GraphQLClient {
  const endpoint = process.env.WORDPRESS_API_URL;
  if (!endpoint) throw new Error("WORDPRESS_API_URL ist nicht gesetzt");
  return new GraphQLClient(endpoint, {
    fetch: globalThis.fetch,
    next: { revalidate },
  });
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
      posts: { nodes: (Post & { beitrag?: { untertitel?: string } })[] };
    }>(query, { limit });
    return data.posts.nodes.map((post) => {
      const decoded = decodePostContent(post);
      if (post.beitrag?.untertitel) {
        decoded.beitragFelder = { ...decoded.beitragFelder, beitragUntertitel: post.beitrag.untertitel };
      }
      return decoded;
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
      posts: { nodes: (Post & { beitrag?: { untertitel?: string } })[] };
    }>(query, { search: searchQuery });
    const posts = data.posts.nodes.map((post) => {
      const decoded = decodePostContent(post);
      if (post.beitrag?.untertitel) {
        decoded.beitragFelder = {
          ...decoded.beitragFelder,
          beitragUntertitel: post.beitrag.untertitel,
        };
      }
      return decoded;
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

export async function getPostsByCategory(categorySlug: string): Promise<Post[]> {
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
        nodes: Array<{ posts: { nodes: (Post & { beitrag?: { untertitel?: string } })[] } }>
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
      return decoded;
    });
  } catch (error) {
    console.error(`Error fetching posts for category "${categorySlug}":`, error);
    return [];
  }
}

// ─────────────────────────────────────────────
// Einzelner Beitrag mit ACF-Feldern
// ─────────────────────────────────────────────

export async function getMegamenuPostsByCategory(
  categorySlug: string,
  limit = 3
): Promise<Array<Post & { tools: ("rechner" | "checkliste" | "vergleich")[] }>> {
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
      const content = post.content || "";
      const tools: ("rechner" | "checkliste" | "vergleich")[] = [];
      if (/wp:finanzleser\/rechner|data-finanzleser-rechner/.test(content)) tools.push("rechner");
      if (/wp:finanzleser\/vergleich|data-finanzleser-vergleich/.test(content)) tools.push("vergleich");
      if (/wp:finanzleser\/checkliste|data-finanzleser-checkliste/.test(content)) tools.push("checkliste");
      const { content: _omit, ...withoutContent } = decoded;
      return { ...withoutContent, tools };
    });
  } catch (error) {
    console.error(`Error fetching megamenu posts for "${categorySlug}":`, error);
    return [];
  }
}

export async function getPostBySlug(slug: string): Promise<Post | null> {
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

  try {
    const data = await client.request<{ posts: { nodes: Post[] } }>(query, { slug });
    let post = data.posts.nodes[0] || null;

    // Dekodiere HTML-Entities
    if (post) {
      post = decodePostContent(post);
    }

    // If it's a regular post, try to fetch ACF fields separately
    if (post) {
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
        const aclData = await client.request<{ postBy: { beitrag?: { untertitel?: string; featuredTool?: boolean } } | null }>(aclQuery, { slug });
        if (aclData.postBy?.beitrag) {
          post.beitragFelder = {
            beitragUntertitel: aclData.postBy.beitrag.untertitel,
            beitragFeaturedTool: aclData.postBy.beitrag.featuredTool,
          };
        }
      } catch {
        // ACF fields not available for this post type - that's ok
        // Custom post types don't have these fields
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

export async function getCategoryWithChildren(categorySlug: string): Promise<{
  name: string;
  slug: string;
  description?: string;
  image?: string;
  children: Array<{ name: string; slug: string; count: number; description?: string; image?: string }>;
  posts: Post[];
} | null> {
  const client = getClient();

  // First query: get the main category
  const mainCategoryQuery = gql`
    query GetMainCategory($slug: [String!]!) {
      categories(where: { slug: $slug }) {
        nodes {
          databaseId
          name
          slug
          description
          kategorieFelder {
            kategorieBild {
              node {
                sourceUrl
              }
            }
          }
          posts(first: 6) {
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
    const categoryData = await client.request<{
      categories: {
        nodes: Array<{
          databaseId: number;
          name: string;
          slug: string;
          description?: string;
          kategorieFelder?: { kategorieBild?: { node?: { sourceUrl: string } } };
          posts: { nodes: Post[] };
        }>;
      };
    }>(mainCategoryQuery, {
      slug: [categorySlug],
    });

    const category = categoryData.categories.nodes[0];
    if (!category) return null;

    // Second query: get child categories and their posts
    const childrenQuery = gql`
      query GetChildCategories($parent: Int!) {
        categories(where: { parent: $parent }) {
          nodes {
            name
            slug
            count
            description
            kategorieFelder {
              kategorieBild {
                node {
                  sourceUrl
                }
              }
            }
            posts(first: 6) {
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

    const childrenData = await client.request<{
      categories: {
        nodes: Array<{
          name: string;
          slug: string;
          count: number;
          description?: string;
          kategorieFelder?: { kategorieBild?: { node?: { sourceUrl: string } } };
          posts: { nodes: Post[] };
        }>;
      };
    }>(childrenQuery, {
      parent: category.databaseId,
    });

    // If no direct posts, collect from children
    let allPosts = category.posts.nodes.map(post => decodePostContent(post));
    if (allPosts.length === 0 && childrenData.categories.nodes.length > 0) {
      childrenData.categories.nodes.forEach((child) => {
        allPosts = allPosts.concat(child.posts.nodes.map(post => decodePostContent(post)));
      });
      allPosts = allPosts.slice(0, 6); // limit to 6
    }

    return {
      name: category.name,
      slug: category.slug,
      description: category.description || undefined,
      image: category.kategorieFelder?.kategorieBild?.node?.sourceUrl || undefined,
      children: childrenData.categories.nodes.map((child) => ({
        name: child.name,
        slug: child.slug,
        count: child.count,
        description: child.description || undefined,
        image: child.kategorieFelder?.kategorieBild?.node?.sourceUrl || undefined,
      })),
      posts: allPosts,
    };
  } catch (error) {
    console.error(`Error fetching category with children "${categorySlug}":`, error);
    return null;
  }
}

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
  const client = getClient();

  const query = gql`
    query GetRechner {
      allRechner(first: 100) {
        nodes {
          id
          title
          slug
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
  const client = getClient();

  const query = gql`
    query GetRechnerBySlug($slug: String!) {
      rechnerBy(slug: $slug) {
        id
        title
        slug
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

export async function getChecklisteBySlug(slug: string): Promise<Checkliste | null> {
  const client = getClient();

  const query = gql`
    query GetChecklisteBySlug($slug: String!) {
      checklisteBy(slug: $slug) {
        id
        title
        slug
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
// Alle Vergleiche
// ─────────────────────────────────────────────

export async function getAllVergleiche(): Promise<Vergleich[]> {
  const client = getClient();

  const query = gql`
    query GetVergleiche {
      vergleiche(first: 100) {
        nodes {
          id
          title
          slug
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

export async function getCategoryBySlug(slug: string) {
  const client = getClient();

  const query = gql`
    query GetCategory($slug: [String]!) {
      categories(where: { slug: $slug }, first: 1) {
        nodes {
          id
          name
          slug
          description
          kategorieFelder {
            kategorieBild {
              node {
                sourceUrl
              }
            }
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
          kategorieFelder?: { kategorieBild?: { node?: { sourceUrl: string } } };
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
      image: cat.kategorieFelder?.kategorieBild?.node?.sourceUrl || undefined,
      parent: cat.parent?.node || null,
    };
  } catch (error) {
    console.error("Error fetching category:", error);
    return null;
  }
}

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
        posts: { nodes: (Post & { beitrag?: { untertitel?: string }; databaseId: number })[] };
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
        return decoded;
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
