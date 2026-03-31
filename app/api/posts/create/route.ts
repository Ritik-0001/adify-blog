import { NextRequest, NextResponse } from 'next/server'
import fs from 'fs'
import path from 'path'

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as {
      title?: string
      content?: string
      description?: string
      date?: string
      slug?: string
      category?: string
      affiliate_link?: string
      affiliate_text?: string
      seo_title?: string
      seo_description?: string
    }

    const { title, content, slug } = body

    if (!title || !content || !slug) {
      return NextResponse.json(
        { error: 'title, content, and slug are required fields' },
        { status: 400 }
      )
    }

    // Sanitize slug: lowercase, hyphens only, no path traversal
    const safeSlug = slug
      .toLowerCase()
      .replace(/[^a-z0-9-]/g, '-')
      .replace(/-+/g, '-')
      .replace(/^-|-$/g, '')

    if (!safeSlug) {
      return NextResponse.json({ error: 'Invalid slug' }, { status: 400 })
    }

    const esc = (s: string) => s.replace(/\\/g, '\\\\').replace(/"/g, '\\"')

    const frontmatterLines = [
      `title: "${esc(title)}"`,
      body.description ? `description: "${esc(body.description)}"` : null,
      `date: "${body.date ?? new Date().toISOString().split('T')[0]}"`,
      `slug: "${safeSlug}"`,
      body.category ? `category: "${esc(body.category)}"` : null,
      body.affiliate_link ? `affiliate_link: "${esc(body.affiliate_link)}"` : null,
      body.affiliate_text ? `affiliate_text: "${esc(body.affiliate_text)}"` : null,
      body.seo_title ? `seo_title: "${esc(body.seo_title)}"` : null,
      body.seo_description ? `seo_description: "${esc(body.seo_description)}"` : null,
    ]
      .filter(Boolean)
      .join('\n')

    const mdxContent = `---\n${frontmatterLines}\n---\n\n${content}`

    const postsDir = path.join(process.cwd(), 'posts')
    if (!fs.existsSync(postsDir)) {
      fs.mkdirSync(postsDir, { recursive: true })
    }

    const filePath = path.join(postsDir, `${safeSlug}.mdx`)

    // Guard against path traversal
    if (!filePath.startsWith(postsDir + path.sep) && filePath !== postsDir) {
      return NextResponse.json({ error: 'Invalid slug' }, { status: 400 })
    }

    fs.writeFileSync(filePath, mdxContent, 'utf8')

    return NextResponse.json(
      { success: true, slug: safeSlug, url: `/blog/${safeSlug}` },
      { status: 201 }
    )
  } catch (error) {
    console.error('[POST /api/posts/create]', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
