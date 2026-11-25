import type { Handler } from '@netlify/functions'

function jsonResponse(statusCode: number, payload: unknown) {
  return {
    statusCode,
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  }
}

export const handler: Handler = async (event) => {
  if (event.httpMethod !== 'GET') {
    return jsonResponse(405, {
      success: false,
      error: { code: 'METHOD_NOT_ALLOWED', message: 'Only GET is supported.' },
    })
  }

  const apiKey = process.env.APIBIBLIA_API_KEY?.trim()
  if (!apiKey) {
    return jsonResponse(503, {
      success: false,
      error: {
        code: 'MISSING_API_KEY',
        message: 'Configura APIBIBLIA_API_KEY en las variables de entorno de Netlify.',
      },
    })
  }

  const reference = event.queryStringParameters?.ref
  if (!reference) {
    return jsonResponse(400, {
      success: false,
      error: { code: 'INVALID_REFERENCE', message: 'Reference is required.' },
    })
  }

  const version = event.queryStringParameters?.version ?? 'RVR1960'
  const upstreamUrl = new URL('https://api.apibiblia.com/v1/passage')
  upstreamUrl.searchParams.set('ref', reference)
  upstreamUrl.searchParams.set('version', version)

  try {
    const response = await fetch(upstreamUrl, {
      headers: {
        'X-API-Key': apiKey,
        Accept: 'application/json',
      },
    })

    return {
      statusCode: response.status,
      headers: {
        'Content-Type': response.headers.get('content-type') ?? 'application/json',
      },
      body: await response.text(),
    }
  } catch {
    return jsonResponse(502, {
      success: false,
      error: { code: 'UPSTREAM_ERROR', message: 'No se pudo conectar con ApiBiblia.' },
    })
  }
}
