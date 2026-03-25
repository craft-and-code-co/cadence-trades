const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers':
    'authorization, x-client-info, apikey, content-type',
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), {
      status: 405,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }

  try {
    const apiKey = Deno.env.get('OPENAI_API_KEY')
    if (!apiKey) {
      console.error('OPENAI_API_KEY is not set')
      return new Response(
        JSON.stringify({ error: 'Server configuration error' }),
        {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      )
    }

    const body = await req.json()
    const isBatch = Array.isArray(body.texts)
    const input = isBatch ? body.texts : body.text

    // Validate input
    if (isBatch) {
      if (
        body.texts.length === 0 ||
        body.texts.some(
          (t: unknown) => typeof t !== 'string' || t.trim().length === 0
        )
      ) {
        return new Response(
          JSON.stringify({
            error: 'texts must be a non-empty array of non-empty strings',
          }),
          {
            status: 400,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          }
        )
      }
    } else {
      if (typeof input !== 'string' || input.trim().length === 0) {
        return new Response(
          JSON.stringify({ error: 'text must be a non-empty string' }),
          {
            status: 400,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          }
        )
      }
    }

    const response = await fetch('https://api.openai.com/v1/embeddings', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'text-embedding-3-small',
        input,
      }),
    })

    // Forward rate limit headers
    if (response.status === 429) {
      const retryAfter = response.headers.get('retry-after')
      const headers: Record<string, string> = {
        ...corsHeaders,
        'Content-Type': 'application/json',
      }
      if (retryAfter) {
        headers['Retry-After'] = retryAfter
      }
      return new Response(
        JSON.stringify({ error: 'Rate limited by embedding provider' }),
        { status: 429, headers }
      )
    }

    if (!response.ok) {
      const errorText = await response.text()
      console.error(
        `OpenAI API error: ${response.status} ${response.statusText}`,
        errorText
      )
      return new Response(
        JSON.stringify({ error: 'Embedding provider error' }),
        {
          status: 502,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      )
    }

    const result = await response.json()
    const data = result.data as { embedding: number[] }[]

    const payload = isBatch
      ? { embeddings: data.map((d) => d.embedding) }
      : { embedding: data[0].embedding }

    return new Response(JSON.stringify(payload), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  } catch (err) {
    console.error('embed-documents error:', err)
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    )
  }
})
