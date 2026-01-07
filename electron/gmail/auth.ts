import { google } from 'googleapis'
import { OAuth2Client } from 'google-auth-library'
import { BrowserWindow } from 'electron'
import crypto from 'crypto'
import http from 'http'
import { URL } from 'url'
import { getTokens, saveTokens, clearTokens } from '../store'

let oauth2Client: OAuth2Client | null = null

const SCOPES = ['https://www.googleapis.com/auth/gmail.readonly']
const REDIRECT_URI = 'http://127.0.0.1:8089/oauth2callback'

// Generate PKCE code verifier and challenge
function generatePKCE(): { codeVerifier: string; codeChallenge: string } {
  const codeVerifier = crypto.randomBytes(32).toString('base64url')
  const codeChallenge = crypto
    .createHash('sha256')
    .update(codeVerifier)
    .digest('base64url')
  return { codeVerifier, codeChallenge }
}

export function createOAuth2Client(clientId: string, clientSecret: string): OAuth2Client {
  oauth2Client = new google.auth.OAuth2(clientId, clientSecret, REDIRECT_URI)

  // Load existing tokens
  const tokens = getTokens()
  if (tokens) {
    oauth2Client.setCredentials(tokens)
  }

  // Handle token refresh
  oauth2Client.on('tokens', (newTokens) => {
    const currentTokens = getTokens()
    const updatedTokens = {
      access_token: newTokens.access_token || currentTokens?.access_token || '',
      refresh_token: newTokens.refresh_token || currentTokens?.refresh_token || '',
      expiry_date: newTokens.expiry_date || currentTokens?.expiry_date || 0,
    }
    saveTokens(updatedTokens)
  })

  return oauth2Client
}

export function getOAuthClient(): OAuth2Client | null {
  return oauth2Client
}

export async function startOAuth(
  clientId: string,
  clientSecret: string
): Promise<{ success: boolean; email?: string; error?: string }> {
  console.log('Starting OAuth with clientId:', clientId)

  return new Promise((resolve) => {
    // Generate PKCE
    const { codeVerifier, codeChallenge } = generatePKCE()
    console.log('PKCE generated')

    // Create OAuth client
    const client = createOAuth2Client(clientId, clientSecret)

    // Generate auth URL with PKCE
    const authUrl = client.generateAuthUrl({
      access_type: 'offline',
      scope: SCOPES,
      prompt: 'consent',
      code_challenge_method: 'S256',
      code_challenge: codeChallenge,
    })

    // Create auth window
    const authWindow = new BrowserWindow({
      width: 500,
      height: 700,
      show: true,
      webPreferences: {
        nodeIntegration: false,
        contextIsolation: true,
      },
    })

    // Start local server to handle callback
    const server = http.createServer(async (req: any, res: any) => {
      const parsedUrl = new URL(req.url, `http://${req.headers.host}`)

      if (parsedUrl.pathname === '/oauth2callback') {
        const code = parsedUrl.searchParams.get('code')

        if (code) {
          try {
            console.log('Exchanging code for tokens...')
            console.log('Code:', code.substring(0, 20) + '...')
            console.log('Code verifier length:', codeVerifier.length)

            // Exchange code for tokens with PKCE verifier
            const { tokens } = await client.getToken({
              code,
              codeVerifier,
            })
            console.log('Tokens received successfully')
            client.setCredentials(tokens)

            // Save tokens
            saveTokens({
              access_token: tokens.access_token || '',
              refresh_token: tokens.refresh_token || '',
              expiry_date: tokens.expiry_date || 0,
            })

            // Get user email
            const gmail = google.gmail({ version: 'v1', auth: client })
            const profile = await gmail.users.getProfile({ userId: 'me' })
            const email = profile.data.emailAddress || ''

            res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' })
            res.end(`
              <html>
                <body style="font-family: sans-serif; text-align: center; padding-top: 50px;">
                  <h2>認証が完了しました</h2>
                  <p>このウィンドウを閉じてください。</p>
                  <script>window.close()</script>
                </body>
              </html>
            `)

            server.close()
            authWindow.close()
            resolve({ success: true, email })
          } catch (error: any) {
            console.error('Token exchange error:', error)
            console.error('Error response:', error.response?.data)

            const errorMessage = error.response?.data?.error_description ||
              error.response?.data?.error ||
              error.message

            res.writeHead(400, { 'Content-Type': 'text/html; charset=utf-8' })
            res.end(`
              <html>
                <body style="font-family: sans-serif; text-align: center; padding-top: 50px;">
                  <h2>認証に失敗しました</h2>
                  <p>${errorMessage}</p>
                </body>
              </html>
            `)

            server.close()
            authWindow.close()
            resolve({ success: false, error: errorMessage })
          }
        } else {
          const error = parsedUrl.searchParams.get('error')
          res.writeHead(400, { 'Content-Type': 'text/html; charset=utf-8' })
          res.end(`
            <html>
              <body style="font-family: sans-serif; text-align: center; padding-top: 50px;">
                <h2>認証がキャンセルされました</h2>
                <p>${error || '不明なエラー'}</p>
              </body>
            </html>
          `)

          server.close()
          authWindow.close()
          resolve({ success: false, error: error || 'cancelled' })
        }
      }
    })

    server.listen(8089, '127.0.0.1', () => {
      authWindow.loadURL(authUrl)
    })

    // Handle window close
    authWindow.on('closed', () => {
      server.close()
    })
  })
}

export async function logout(): Promise<void> {
  clearTokens()
  oauth2Client = null
}

export async function checkAuthStatus(
  clientId?: string,
  clientSecret?: string
): Promise<{ authenticated: boolean; email: string | null }> {
  const tokens = getTokens()

  if (!tokens || !tokens.access_token) {
    return { authenticated: false, email: null }
  }

  // アプリ再起動後、oauth2Clientがnullの場合は再作成
  if (!oauth2Client && clientId && clientSecret) {
    oauth2Client = createOAuth2Client(clientId, clientSecret)
  }

  if (!oauth2Client) {
    return { authenticated: false, email: null }
  }

  try {
    // Check if token is valid by making a simple API call
    const gmail = google.gmail({ version: 'v1', auth: oauth2Client })
    const profile = await gmail.users.getProfile({ userId: 'me' })

    return {
      authenticated: true,
      email: profile.data.emailAddress || null,
    }
  } catch (error) {
    // Token might be expired or invalid
    return { authenticated: false, email: null }
  }
}
