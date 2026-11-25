import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { defineConfig, loadEnv } from 'vite'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

async function handleBibleProxy(request: Request, apiKey: string): Promise<Response> {
  const url = new URL(request.url)
  const reference = url.searchParams.get('ref')
  const version = url.searchParams.get('version') ?? 'RVR1960'

  if (!apiKey) {
    return Response.json(
      {
        success: false,
        error: {
          code: 'MISSING_API_KEY',
          message: 'Configura APIBIBLIA_API_KEY en el archivo .env y reinicia el servidor.',
        },
      },
      { status: 503 },
    )
  }

  if (!reference) {
    return Response.json(
      { success: false, error: { code: 'INVALID_REFERENCE', message: 'Reference is required' } },
      { status: 400 },
    )
  }

  const upstreamUrl = new URL('https://api.apibiblia.com/v1/passage')
  upstreamUrl.searchParams.set('ref', reference)
  upstreamUrl.searchParams.set('version', version)

  const upstreamResponse = await fetch(upstreamUrl, {
    headers: {
      'X-API-Key': apiKey,
      Accept: 'application/json',
    },
  })
  const payload = await upstreamResponse.text()

  return new Response(payload, {
    status: upstreamResponse.status,
    headers: {
      'Content-Type': upstreamResponse.headers.get('content-type') ?? 'application/json',
    },
  })
}

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  const apiKey = env.APIBIBLIA_API_KEY?.trim() ?? ''

  return {
    plugins: [
      react(),
      tailwindcss(),
      {
        name: 'ensenappt-bible-local-proxy',
        configureServer(server) {
          server.middlewares.use(async (nodeRequest, nodeResponse, next) => {
            if (!nodeRequest.url?.startsWith('/api/bible/passage')) {
              next()
              return
            }

            const protocol = 'http'
            const host = nodeRequest.headers.host ?? '127.0.0.1:5173'
            const url = new URL(nodeRequest.url, `${protocol}://${host}`)
            const request = new Request(url, {
              method: 'GET',
              headers: {
                Accept: 'application/json',
              },
            })

            try {
              const response = await handleBibleProxy(request, apiKey)
              nodeResponse.statusCode = response.status
              response.headers.forEach((value, name) => nodeResponse.setHeader(name, value))
              nodeResponse.end(await response.text())
            } catch {
              nodeResponse.statusCode = 502
              nodeResponse.setHeader('Content-Type', 'application/json')
              nodeResponse.end(JSON.stringify({
                success: false,
                error: { code: 'UPSTREAM_ERROR', message: 'No se pudo conectar con ApiBiblia.' },
              }))
            }
          })
        },
      },
    ],
    resolve: {
      alias: {
        '@': path.resolve(path.dirname(fileURLToPath(import.meta.url)), 'src'),
      },
    },
  }
})
