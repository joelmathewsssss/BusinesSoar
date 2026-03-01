# Cloudflare Turnstile Setup Guide

Cloudflare Turnstile is now integrated into your BusinesSoar application for bot protection on the login and business creation forms.

## Setup Steps

### 1. Create a Cloudflare Account
- Go to [Cloudflare Dashboard](https://dash.cloudflare.com/)
- Sign up or log in to your account

### 2. Create a Turnstile Site
- In the Cloudflare dashboard, navigate to **Turnstile** (you may need to look under "Products")
- Click "Create Site"
- Fill in the following details:
  - **Site name**: `BusinesSoar` (or your preferred name)
  - **Domains**: Add your domain (e.g., `localhost:3000` for development, your production domain for live)
  - **Mode**: Choose "Managed" for ease of use, or "Strict" for higher security
  - **Widget Mode**: Select "Non-Interactive" or "Invisible" for better UX (recommended: Non-Interactive)

### 3. Get Your Keys
After creating the site, you'll see:
- **Site Key** (Public key - safe to use in frontend)
- **Secret Key** (Private key - keep this secure!)

### 4. Configure Environment Variables
Update your `.env.local` file with your Turnstile keys:

```env
NEXT_PUBLIC_TURNSTILE_SITE_KEY=your_actual_site_key_here
TURNSTILE_SECRET_KEY=your_actual_secret_key_here
```

Replace the placeholder values with your actual keys from Cloudflare.

### 5. Restart Your Application
```bash
npm run dev
```

The Turnstile widget will now appear on:
- **Login Page** (`/login`) - Sign In and Create Account forms
- **Add Business Page** (`/add-business`) - Business creation form

## How It Works

1. **Frontend**: When users submit a form, the Turnstile widget generates a token
2. **Verification**: The token is sent to `/api/verify-turnstile`
3. **Backend**: Your server verifies the token with Cloudflare's servers
4. **Authentication**: Only after successful verification does the form submission proceed

## Development vs Production

### Development (localhost)
- When adding `localhost:3000` to Cloudflare Turnstile, you can test locally
- Use the "Non-Interactive" mode for easier testing

### Production
- Before deploying, add your production domain to the Cloudflare Turnstile site
- Test thoroughly with the production domain

## Testing

### With Turnstile Enabled
1. Go to login page or add-business page
2. You should see the Turnstile widget
3. Complete the CAPTCHA challenge
4. The form will submit normally

### Without Keys (Development)
- If `NEXT_PUBLIC_TURNSTILE_SITE_KEY` is not set, the Turnstile widget won't show
- Forms will submit without CAPTCHA verification
- This is useful for testing other features

## Troubleshooting

### Widget Not Appearing
- Verify `NEXT_PUBLIC_TURNSTILE_SITE_KEY` is set in `.env.local`
- Restart the development server (`npm run dev`)
- Clear browser cache

### "Turnstile verification failed"
- Ensure `TURNSTILE_SECRET_KEY` is correctly set in `.env.local`
- Verify the secret key matches what's in Cloudflare dashboard
- Check that your domain is added to the Turnstile site in Cloudflare

### Widget Load Errors
- Check browser console for CORS errors
- Ensure you're using a domain added to your Cloudflare Turnstile site
- For localhost development, add `localhost:3000` to allowed domains

## Environment Variable Reference

| Variable | Type | Purpose | Required |
|----------|------|---------|----------|
| `NEXT_PUBLIC_TURNSTILE_SITE_KEY` | Public | Frontend widget initialization | Yes |
| `TURNSTILE_SECRET_KEY` | Secret | Backend verification with Cloudflare | Yes |

**Important**: Never commit your secret key to version control. Keep it in `.env.local` which should be in `.gitignore`.

## Customization

To customize the Turnstile widget appearance, edit the Turnstile components in:
- `app/login/login-form.tsx`
- `app/add-business/page.tsx`

Available options:
```tsx
<Turnstile
  sitekey={process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY}
  onVerify={(token) => setTurnstileToken(token)}
  theme="light"              // "light" or "dark"
  appearance="always"        // "always", "execute", or "interaction-only"
  language="en"              // Language code
  retryInterval={8000}       // Retry interval in ms
  tabindex={0}               // Tab index for accessibility
/>
```

## More Information

- [Cloudflare Turnstile Docs](https://developers.cloudflare.com/turnstile/)
- [react-turnstile Package](https://github.com/marsidev/react-turnstile)
