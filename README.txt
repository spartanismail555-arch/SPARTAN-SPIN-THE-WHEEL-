# SPARTAN 💎 Lucky Wheel

## Rules
- SPARTAN 💎 is fixed at #1.
- Other participants receive exactly one random number from 2–10.
- A number cannot be selected twice.
- Everyone sees the same public history.
- The database performs the selection atomically, so two people cannot receive the same number.

## Important limitation
This version uses the participant's entered display name as the one-spin identity. That prevents the same *name* from spinning twice, but it does NOT prove that two different names belong to two different WhatsApp accounts.

If you need strict "one real WhatsApp account = one spin", WhatsApp login/verification must be added through an identity provider or WhatsApp-supported authentication flow.

## Deploy
1. Create a free Supabase project.
2. In Supabase SQL Editor, run `schema.sql`.
3. Copy your Supabase project URL and anon/public key.
4. Put them into `app.js`:
   SUPABASE_URL = "..."
   SUPABASE_ANON_KEY = "..."
5. Upload `index.html`, `style.css`, and `app.js` to a static host such as GitHub Pages, Netlify, Vercel, or Cloudflare Pages.
6. Send the resulting HTTPS link in WhatsApp.

Do NOT put a Supabase service-role/secret key in the browser. Only use the public anon key.
