import { GraphQLClient, gql } from "graphql-request";
import type { Post, Rechner, PostACF, SEO } from "./types";
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
// Dynamische Menü-Kategorien (Rechner, Checklisten, Vergleiche)
// ─────────────────────────────────────────────

export interface ToolCategory {
  label: string;
  href: string;
  count: number;
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
    }
  `;

  try {
    const data = await client.request<{
      allRechner: { nodes: Array<{ id: string }> };
      checklisten: { nodes: Array<{ id: string }> };
      vergleiche: { nodes: Array<{ id: string }> };
    }>(query);

    const categories: ToolCategory[] = [];

    // Rechner
    if (data.allRechner.nodes.length > 0) {
      categories.push({
        label: "Rechner",
        href: "/finanztools/rechner",
        count: data.allRechner.nodes.length,
      });
    }

    // Checklisten
    if (data.checklisten.nodes.length > 0) {
      categories.push({
        label: "Checklisten",
        href: "/finanztools/checklisten",
        count: data.checklisten.nodes.length,
      });
    }

    // Vergleiche
    if (data.vergleiche.nodes.length > 0) {
      categories.push({
        label: "Vergleiche",
        href: "/finanztools/vergleiche",
        count: data.vergleiche.nodes.length,
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
