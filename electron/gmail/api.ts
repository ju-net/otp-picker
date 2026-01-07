import { google } from 'googleapis'
import { OAuth2Client } from 'google-auth-library'

interface OTPEmail {
  id: string
  subject: string
  from: string
  code: string
  receivedAt: Date
}

// Common OTP patterns
const OTP_PATTERNS = [
  // 4-8 digit codes
  /\b(\d{4,8})\b/g,
  // Codes with dashes: 123-456
  /\b(\d{3}-\d{3})\b/g,
  // Codes with spaces: 123 456
  /\b(\d{3}\s\d{3})\b/g,
  // Letter-number codes: ABC123
  /\b([A-Z]{3}\d{3})\b/gi,
]

// Patterns to exclude (years, times, etc.)
const EXCLUDE_PATTERNS = [
  /^(19|20)\d{2}$/, // Years
  /^\d{1,2}:\d{2}$/, // Times
  /^\d{1,2}\/\d{1,2}$/, // Dates
]

export async function fetchOTPEmails(
  auth: OAuth2Client,
  keywords: string[]
): Promise<OTPEmail[]> {
  const gmail = google.gmail({ version: 'v1', auth })

  // Calculate time 10 minutes ago
  const tenMinutesAgo = Math.floor((Date.now() - 10 * 60 * 1000) / 1000)

  // Build search query with keywords
  const keywordQuery = keywords.map(k => `"${k}"`).join(' OR ')
  const query = `after:${tenMinutesAgo} (${keywordQuery})`

  try {
    // List messages matching the query
    const listResponse = await gmail.users.messages.list({
      userId: 'me',
      q: query,
      maxResults: 10,
    })

    const messages = listResponse.data.messages || []
    const otpEmails: OTPEmail[] = []

    // Fetch each message details
    for (const message of messages) {
      if (!message.id) continue

      const msgResponse = await gmail.users.messages.get({
        userId: 'me',
        id: message.id,
        format: 'full',
      })

      const msgData = msgResponse.data
      const headers = msgData.payload?.headers || []

      // Extract headers
      const subject = headers.find(h => h.name?.toLowerCase() === 'subject')?.value || ''
      const from = headers.find(h => h.name?.toLowerCase() === 'from')?.value || ''
      const date = headers.find(h => h.name?.toLowerCase() === 'date')?.value
      const receivedAt = date ? new Date(date) : new Date()

      // Extract body text
      const bodyText = extractBodyText(msgData.payload)

      // Extract OTP code
      const code = extractOTPCode(bodyText, subject)

      if (code) {
        otpEmails.push({
          id: message.id,
          subject,
          from: extractEmailAddress(from),
          code,
          receivedAt,
        })
      }
    }

    // Sort by received date (newest first)
    otpEmails.sort((a, b) => b.receivedAt.getTime() - a.receivedAt.getTime())

    return otpEmails
  } catch (error) {
    console.error('Error fetching emails:', error)
    return []
  }
}

function extractBodyText(payload: any): string {
  if (!payload) return ''

  let text = ''

  // Check for direct body data
  if (payload.body?.data) {
    text += decodeBase64(payload.body.data)
  }

  // Check parts (for multipart messages)
  if (payload.parts) {
    for (const part of payload.parts) {
      if (part.mimeType === 'text/plain' && part.body?.data) {
        text += decodeBase64(part.body.data)
      } else if (part.mimeType === 'text/html' && part.body?.data) {
        // Strip HTML tags for OTP extraction
        const html = decodeBase64(part.body.data)
        text += stripHtml(html)
      } else if (part.parts) {
        // Recursively handle nested parts
        text += extractBodyText(part)
      }
    }
  }

  return text
}

function decodeBase64(data: string): string {
  try {
    // URL-safe base64 to regular base64
    const base64 = data.replace(/-/g, '+').replace(/_/g, '/')
    return Buffer.from(base64, 'base64').toString('utf-8')
  } catch {
    return ''
  }
}

function stripHtml(html: string): string {
  return html
    .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')
    .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/\s+/g, ' ')
    .trim()
}

function extractOTPCode(body: string, subject: string): string | null {
  const text = `${subject} ${body}`

  // Look for common OTP patterns with context
  const contextPatterns = [
    // "code is 123456" or "code: 123456"
    /(?:code|コード|番号)[\s:：は]*(\d{4,8})/gi,
    // "123456 is your code"
    /(\d{4,8})[\s]*(?:is your|があなたの)/gi,
    // "verification: 123456"
    /(?:verification|認証|確認)[\s:：]*(\d{4,8})/gi,
    // "OTP: 123456"
    /OTP[\s:：]*(\d{4,8})/gi,
    // "PIN: 123456"
    /PIN[\s:：]*(\d{4,8})/gi,
    // Standalone 6-digit code (most common)
    /\b(\d{6})\b/g,
  ]

  for (const pattern of contextPatterns) {
    const matches = text.matchAll(pattern)
    for (const match of matches) {
      const code = match[1]
      if (isValidOTPCode(code)) {
        return code
      }
    }
  }

  // Fallback: look for any 4-8 digit number
  for (const pattern of OTP_PATTERNS) {
    const matches = text.matchAll(pattern)
    for (const match of matches) {
      const code = match[1].replace(/[\s-]/g, '')
      if (isValidOTPCode(code)) {
        return match[1] // Return original format
      }
    }
  }

  return null
}

function isValidOTPCode(code: string): boolean {
  // Remove spaces and dashes for validation
  const cleanCode = code.replace(/[\s-]/g, '')

  // Check length
  if (cleanCode.length < 4 || cleanCode.length > 8) {
    return false
  }

  // Check against exclude patterns
  for (const pattern of EXCLUDE_PATTERNS) {
    if (pattern.test(cleanCode)) {
      return false
    }
  }

  return true
}

function extractEmailAddress(from: string): string {
  // Extract email from "Name <email@example.com>" format
  const match = from.match(/<([^>]+)>/)
  if (match) {
    return match[1]
  }
  // Return as-is if no angle brackets
  return from
}
