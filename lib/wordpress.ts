import { GraphQLClient, gql } from "graphql-request";
import type { Post, Rechner } from "./types";

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
  return data.posts.nodes;
}

// ─────────────────────────────────────────────
// Beiträge nach Kategorie
// ─────────────────────────────────────────────

export async function getPostsByCategory(categorySlug: string): Promise<Post[]> {
  const client = getClient();

  const query = gql`
    query GetPostsByCategory($categoryName: String!) {
      posts(where: { categoryName: $categoryName }) {
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

  const data = await client.request<{ posts: { nodes: Post[] } }>(query, {
    categoryName: categorySlug,
  });
  return data.posts.nodes;
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
    const post = data.posts.nodes[0] || null;

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
        const aclData = await client.request<{ postBy: { beitragFelder?: any; seo?: any } | null }>(aclQuery, { slug });
        if (aclData.postBy) {
          post.beitragFelder = aclData.postBy.beitragFelder;
          post.seo = aclData.postBy.seo;
        }
      } catch (aclError) {
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
// Alle Rechner
// ─────────────────────────────────────────────

export async function getAllRechner(): Promise<Rechner[]> {
  const client = getClient();

  const query = gql`
    query GetRechner {
      rechners {
        nodes {
          id
          title
          slug
          rechnerFelder {
            rechnerTyp
            rechnerBeschreibung
            rechnerIcon {
              sourceUrl
            }
          }
        }
      }
    }
  `;

  const data = await client.request<{ rechners: { nodes: Rechner[] } }>(query);
  return data.rechners.nodes;
}
