import { GraphQLClient, gql } from "graphql-request";
import type { Post, Rechner, PostACF, SEO, RechnerConfigOverrides } from "./types";
import { decodePostContent } from "./html-utils";

function getClient(): GraphQLClient {
  const endpoint = process.env.WORDPRESS_API_URL;
  if (!endpoint) throw new Error("WORDPRESS_API_URL ist nicht gesetzt");
  return new GraphQLClient(endpoint);
}

// ─────────────────────────────────────────────
// Alle Beiträge (für Übersichtsseiten / SSG)
// ─────────────────────────────────────────────

export async function getAllPosts(): Promise<Post[]> {
  const client = getClient();

  const query = gql`
    query GetPosts {
      posts {
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
  `;

  const data = await client.request<{ posts: { nodes: Post[] } }>(query);
  return data.posts.nodes.map(post => decodePostContent(post));
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
        }
      }
    }
  `;

  try {
    const data = await client.request<{ posts: { nodes: Post[] } }>(query, {
      search: searchQuery,
    });
    return data.posts.nodes.map(post => decodePostContent(post));
  } catch (error) {
    console.error(`Error searching posts for "${searchQuery}":`, error);
    return [];
  }
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
            }
          }
        }
      }
    }
  `;

  try {
    const data = await client.request<{
      categories: {
        nodes: Array<{ posts: { nodes: Post[] } }>
      }
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
// Einzelner Beitrag mit ACF-Feldern
// ─────────────────────────────────────────────

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
            beitragFelder {
              beitragUntertitel
              beitragZusammenfassung
              beitragPdf {
                mediaItemUrl
              }
              beitragFeaturedTool
              beitragRechner {
                ... on Rechner {
                  id
                  title
                  rechnerFelder {
                    rechnerTyp
                    rechnerBeschreibung
                  }
                }
              }
            }
            seo {
              title
              metaDesc
              canonical
              opengraphTitle
              opengraphDescription
              opengraphImage {
                sourceUrl
              }
            }
          }
        }
      `;

      try {
        const aclData = await client.request<{ postBy: { beitragFelder?: PostACF; seo?: SEO } | null }>(aclQuery, { slug });
        if (aclData.postBy) {
          post.beitragFelder = aclData.postBy.beitragFelder;
          post.seo = aclData.postBy.seo;
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
  children: Array<{ name: string; slug: string; count: number }>;
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
      children: childrenData.categories.nodes.map((child) => ({
        name: child.name,
        slug: child.slug,
        count: child.count,
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

  const query = gql`
    query GetToolCategories {
      allRechner(first: 1) {
        nodes {
          id
        }
      }
      checklisten(first: 1) {
        nodes {
          id
        }
      }
      vergleiche(first: 1) {
        nodes {
          id
        }
      }
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
    const data = await client.request<{
      allRechner: { nodes: Array<{ id: string }> };
      checklisten: { nodes: Array<{ id: string }> };
      vergleiche: { nodes: Array<{ id: string }> };
      rechnerCategory: { nodes: Array<{ count: number }> };
      checklistenCategory: { nodes: Array<{ count: number }> };
      vergleichCategory: { nodes: Array<{ count: number }> };
    }>(query);

    const categories: ToolCategory[] = [];

    // Rechner (CPT + Posts mit Kategorie)
    const rechnerCptCount = data.allRechner.nodes.length;
    const rechnerPostCount = data.rechnerCategory.nodes[0]?.count || 0;
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
    const checklistenCptCount = data.checklisten.nodes.length;
    const checklistenPostCount = data.checklistenCategory.nodes[0]?.count || 0;
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
    const vergleicheCptCount = data.vergleiche.nodes.length;
    const vergleichePostCount = data.vergleichCategory.nodes[0]?.count || 0;
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
          parent?: { node: { id: string; name: string; slug: string } };
        }>;
      };
    }>(query, { slug });

    const cat = data.categories.nodes[0];
    if (!cat) return null;
    // Flatten parent.node to parent for easier access
    return {
      id: cat.id,
      name: cat.name,
      slug: cat.slug,
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

export async function getRechnerConfig(): Promise<RechnerConfigOverrides | null> {
  const wpUrl = process.env.WORDPRESS_API_URL;
  if (!wpUrl) return null;

  // Extract base URL (remove /graphql)
  const baseUrl = wpUrl.replace('/graphql', '');

  try {
    // REST API: Holt ACF Options via custom Endpoint
    const response = await fetch(`${baseUrl}/wp-json/finanzleser/v1/rechner-config`);
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
