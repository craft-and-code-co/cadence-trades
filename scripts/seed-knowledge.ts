/**
 * seed-knowledge.ts — Seeds the knowledge_documents table from markdown files
 *
 * Usage:  npx tsx scripts/seed-knowledge.ts
 *
 * Environment variables (set in shell or .env file):
 *   SUPABASE_URL              — e.g. https://nethroisexlhyqgyxtvw.supabase.co
 *   SUPABASE_SERVICE_ROLE_KEY — service role key from Supabase dashboard
 *
 * .env.example:
 *   SUPABASE_URL=https://<project-ref>.supabase.co
 *   SUPABASE_SERVICE_ROLE_KEY=eyJ...
 */

import { createClient } from '@supabase/supabase-js'
import * as fs from 'node:fs'
import * as path from 'node:path'

// ---------------------------------------------------------------------------
// Load .env.local
// ---------------------------------------------------------------------------

const envPath = path.resolve(process.cwd(), '.env.local')
if (fs.existsSync(envPath)) {
  for (const line of fs.readFileSync(envPath, 'utf-8').split('\n')) {
    const trimmed = line.trim()
    if (!trimmed || trimmed.startsWith('#')) continue
    const idx = trimmed.indexOf('=')
    if (idx === -1) continue
    const key = trimmed.slice(0, idx).trim()
    const val = trimmed.slice(idx + 1).trim()
    if (!process.env[key]) process.env[key] = val
  }
}

// ---------------------------------------------------------------------------
// Config
// ---------------------------------------------------------------------------

const SUPABASE_URL = process.env.SUPABASE_URL
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  console.error(
    'Missing environment variables. Set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY.',
  )
  process.exit(1)
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)

const KNOWLEDGE_DIR = path.resolve(import.meta.dirname ?? __dirname, '..', 'knowledge')
const MAX_CONCURRENCY = 5
const TOKENS_PER_CHUNK = 500
const OVERLAP_TOKENS = 50
const INITIAL_BACKOFF_MS = 1000
const MAX_RETRIES = 5

// ---------------------------------------------------------------------------
// Frontmatter parser (regex-based, no external deps)
// ---------------------------------------------------------------------------

interface Frontmatter {
  title: string
  category: string
  trade_tags: string[]
}

function parseFrontmatter(raw: string): { meta: Frontmatter; body: string } {
  const match = raw.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n([\s\S]*)$/)
  if (!match) {
    return {
      meta: { title: 'Untitled', category: 'general', trade_tags: ['all'] },
      body: raw,
    }
  }

  const yamlBlock = match[1]
  const body = match[2]

  const titleMatch = yamlBlock.match(/title:\s*["']?(.+?)["']?\s*$/m)
  const categoryMatch = yamlBlock.match(/category:\s*(\S+)/)
  const tagsMatch = yamlBlock.match(/trade_tags:\s*\[([^\]]*)\]/)

  const title = titleMatch?.[1]?.replace(/^["']|["']$/g, '') ?? 'Untitled'
  const category = categoryMatch?.[1] ?? 'general'
  const trade_tags = tagsMatch
    ? tagsMatch[1]
        .split(',')
        .map((t) => t.trim().replace(/^["']|["']$/g, ''))
        .filter(Boolean)
    : ['all']

  return { meta: { title, category, trade_tags }, body }
}

// ---------------------------------------------------------------------------
// Tokenizer (approximate: 1 token ≈ 4 chars for English text)
// ---------------------------------------------------------------------------

function estimateTokens(text: string): number {
  return Math.ceil(text.length / 4)
}

function truncateToTokens(text: string, maxTokens: number): string {
  const maxChars = maxTokens * 4
  if (text.length <= maxChars) return text
  return text.slice(0, maxChars)
}

function lastNTokens(text: string, n: number): string {
  const chars = n * 4
  if (text.length <= chars) return text
  return text.slice(-chars)
}

// ---------------------------------------------------------------------------
// Chunking
// ---------------------------------------------------------------------------

function chunkDocument(title: string, body: string): string[] {
  const prefix = `[${title}] `
  const prefixTokens = estimateTokens(prefix)
  const targetTokens = TOKENS_PER_CHUNK - prefixTokens

  // Split on paragraph boundaries (double newline)
  const paragraphs = body.split(/\n\s*\n/).filter((p) => p.trim().length > 0)

  const chunks: string[] = []
  let currentChunk = ''

  for (const para of paragraphs) {
    const paraTokens = estimateTokens(para)

    // If a single paragraph exceeds the target, split on sentence boundaries
    if (paraTokens > targetTokens) {
      // Flush current chunk first
      if (currentChunk.trim()) {
        chunks.push(currentChunk.trim())
        currentChunk = ''
      }
      const sentences = splitSentences(para)
      for (const sentence of sentences) {
        if (
          estimateTokens(currentChunk) + estimateTokens(sentence) >
          targetTokens
        ) {
          if (currentChunk.trim()) {
            chunks.push(currentChunk.trim())
            currentChunk = ''
          }
        }
        currentChunk += (currentChunk ? ' ' : '') + sentence
      }
      continue
    }

    // Check if adding this paragraph exceeds the target
    const combined = currentChunk
      ? currentChunk + '\n\n' + para
      : para
    if (estimateTokens(combined) > targetTokens && currentChunk.trim()) {
      chunks.push(currentChunk.trim())
      currentChunk = para
    } else {
      currentChunk = combined
    }
  }

  // Flush remaining
  if (currentChunk.trim()) {
    chunks.push(currentChunk.trim())
  }

  // Apply overlap: last ~50 tokens of chunk N prepended to chunk N+1
  const overlapped: string[] = []
  for (let i = 0; i < chunks.length; i++) {
    if (i === 0) {
      overlapped.push(prefix + chunks[i])
    } else {
      const overlapText = lastNTokens(chunks[i - 1], OVERLAP_TOKENS)
      overlapped.push(prefix + overlapText + ' ' + chunks[i])
    }
  }

  return overlapped.length > 0 ? overlapped : [prefix + body.trim()]
}

function splitSentences(text: string): string[] {
  // Split on sentence-ending punctuation followed by space or end of string
  const raw = text.match(/[^.!?]*[.!?]+[\s]*/g)
  if (!raw) return [text]
  return raw.map((s) => s.trim()).filter(Boolean)
}

// ---------------------------------------------------------------------------
// File discovery (recursive readdir, no external glob dep)
// ---------------------------------------------------------------------------

function findMarkdownFiles(dir: string): string[] {
  const results: string[] = []
  const entries = fs.readdirSync(dir, { withFileTypes: true })
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name)
    if (entry.isDirectory()) {
      results.push(...findMarkdownFiles(fullPath))
    } else if (entry.isFile() && entry.name.endsWith('.md')) {
      results.push(fullPath)
    }
  }
  return results
}

// ---------------------------------------------------------------------------
// Embedding via Edge Function
// ---------------------------------------------------------------------------

async function getEmbedding(
  text: string,
  retries = MAX_RETRIES,
): Promise<number[]> {
  let attempt = 0
  let backoff = INITIAL_BACKOFF_MS

  while (attempt <= retries) {
    const response = await fetch(
      `${SUPABASE_URL}/functions/v1/embed-documents`,
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ text }),
      },
    )

    if (response.ok) {
      const data = await response.json()
      return data.embedding
    }

    if (response.status === 429) {
      attempt++
      if (attempt > retries) {
        throw new Error(`Rate limited after ${retries} retries for embedding`)
      }
      console.warn(`  Rate limited, retrying in ${backoff}ms (attempt ${attempt}/${retries})`)
      await sleep(backoff)
      backoff *= 2
      continue
    }

    throw new Error(
      `Embedding request failed: ${response.status} ${response.statusText}`,
    )
  }

  throw new Error('Unreachable')
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

// ---------------------------------------------------------------------------
// Concurrency-limited task runner
// ---------------------------------------------------------------------------

async function runWithConcurrency<T>(
  tasks: (() => Promise<T>)[],
  concurrency: number,
): Promise<T[]> {
  const results: T[] = new Array(tasks.length)
  let nextIndex = 0

  async function worker() {
    while (nextIndex < tasks.length) {
      const idx = nextIndex++
      results[idx] = await tasks[idx]()
    }
  }

  const workers = Array.from({ length: Math.min(concurrency, tasks.length) }, () =>
    worker(),
  )
  await Promise.all(workers)
  return results
}

// ---------------------------------------------------------------------------
// Upsert chunk into knowledge_documents
// ---------------------------------------------------------------------------

async function upsertChunk(params: {
  title: string
  category: string
  source_file: string
  chunk_index: number
  content: string
  embedding: number[]
  trade_tags: string[]
}): Promise<void> {
  const { error } = await supabase
    .from('knowledge_documents')
    .upsert(
      {
        title: params.title,
        category: params.category,
        source_file: params.source_file,
        chunk_index: params.chunk_index,
        content: params.content,
        embedding: params.embedding as any,
        trade_tags: params.trade_tags,
      },
      { onConflict: 'source_file,chunk_index' },
    )

  if (error) {
    throw new Error(`Upsert failed for ${params.source_file}#${params.chunk_index}: ${error.message}`)
  }
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

async function main() {
  console.log('=== Cadence Trades — Knowledge Base Seeder ===\n')

  if (!fs.existsSync(KNOWLEDGE_DIR)) {
    console.error(`Knowledge directory not found: ${KNOWLEDGE_DIR}`)
    process.exit(1)
  }

  const files = findMarkdownFiles(KNOWLEDGE_DIR)
  console.log(`Found ${files.length} markdown file(s) in ${KNOWLEDGE_DIR}\n`)

  if (files.length === 0) {
    console.log('No files to process.')
    return
  }

  let totalChunks = 0
  const errors: string[] = []

  for (const filePath of files) {
    const relativePath = path.relative(KNOWLEDGE_DIR, filePath)
    const raw = fs.readFileSync(filePath, 'utf-8')
    const { meta, body } = parseFrontmatter(raw)

    console.log(`Processing: ${relativePath} — "${meta.title}" [${meta.category}]`)

    const chunks = chunkDocument(meta.title, body)
    console.log(`  ${chunks.length} chunk(s)`)

    // Build tasks: embed + upsert for each chunk
    const tasks = chunks.map((content, idx) => async () => {
      try {
        const embedding = await getEmbedding(content)
        await upsertChunk({
          title: meta.title,
          category: meta.category,
          source_file: relativePath,
          chunk_index: idx,
          content,
          embedding,
          trade_tags: meta.trade_tags,
        })
      } catch (err) {
        const msg = `  ERROR chunk ${idx} of ${relativePath}: ${err instanceof Error ? err.message : err}`
        console.error(msg)
        errors.push(msg)
      }
    })

    await runWithConcurrency(tasks, MAX_CONCURRENCY)
    totalChunks += chunks.length
  }

  // Summary
  console.log('\n=== Summary ===')
  console.log(`Files processed: ${files.length}`)
  console.log(`Total chunks created: ${totalChunks}`)
  if (errors.length > 0) {
    console.log(`Errors: ${errors.length}`)
    errors.forEach((e) => console.log(e))
  } else {
    console.log('Errors: 0')
  }
  console.log('\nDone.')
}

main().catch((err) => {
  console.error('Fatal error:', err)
  process.exit(1)
})
