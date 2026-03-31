import fs from 'fs'
import path from 'path'
import matter from 'gray-matter'

const postsDirectory = path.join(process.cwd(), 'posts')

export interface PostFrontmatter {
  title: string
  description: string
  date: string
  slug: string
  category: string
  affiliate_link?: string
  affiliate_text?: string
  seo_title?: string
  seo_description?: string
}

export interface Post {
  frontmatter: PostFrontmatter
  content: string
  slug: string
}

export function getAllPosts(): Post[] {
  if (!fs.existsSync(postsDirectory)) return []

  const fileNames = fs.readdirSync(postsDirectory)
  return fileNames
    // Only read .mdx files directly in /posts/ — skip subdirectories like /posts/queue/
    .filter((f) => {
      if (!f.endsWith('.mdx')) return false
      return fs.statSync(path.join(postsDirectory, f)).isFile()
    })
    .map((fileName) => {
      const fileSlug = fileName.replace(/\.mdx$/, '')
      const fullPath = path.join(postsDirectory, fileName)
      const fileContents = fs.readFileSync(fullPath, 'utf8')
      const { data, content } = matter(fileContents)
      return {
        frontmatter: data as PostFrontmatter,
        content,
        slug: (data.slug as string) || fileSlug,
      }
    })
    .sort(
      (a, b) =>
        new Date(b.frontmatter.date).getTime() -
        new Date(a.frontmatter.date).getTime()
    )
}

export function getPostBySlug(slug: string): Post | null {
  try {
    const fullPath = path.join(postsDirectory, `${slug}.mdx`)
    const fileContents = fs.readFileSync(fullPath, 'utf8')
    const { data, content } = matter(fileContents)
    return {
      frontmatter: data as PostFrontmatter,
      content,
      slug,
    }
  } catch {
    return null
  }
}
