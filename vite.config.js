import { defineConfig } from 'vite'

// Strict-ish CSP for a fully static, no-network app. `style-src 'unsafe-inline'`
// is required because the designer writes inline `style="..."` for component
// positioning — those count against `style-src`. Everything else is locked to
// the same origin. Note: header-only directives (frame-ancestors,
// Permissions-Policy, HSTS, X-Content-Type-Options) cannot be set via meta and
// require a CDN/reverse proxy; GitHub Pages does not let you set them.
const CSP = [
  "default-src 'self'",
  "script-src 'self'",
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data: blob:",
  "font-src 'self' data:",
  "connect-src 'self'",
  "object-src 'none'",
  "base-uri 'self'",
  "form-action 'self'",
  "manifest-src 'self'",
].join('; ')

export default defineConfig({
  plugins: [
    {
      name: 'inject-csp',
      apply: 'build',
      transformIndexHtml() {
        return [
          {
            tag: 'meta',
            attrs: { 'http-equiv': 'Content-Security-Policy', content: CSP },
            injectTo: 'head-prepend',
          },
        ]
      },
    },
  ],
})
