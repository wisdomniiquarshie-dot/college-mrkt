This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Supabase Setup

`.env.example` is the template for local Supabase credentials. If `.env.local` does not already exist, copy it with `Copy-Item .env.example .env.local`, then set `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` to the URL and public anon/publishable key from your Supabase project. Do not overwrite an existing `.env.local`. The clients safely treat missing, placeholder, or malformed credentials as an unavailable Supabase connection. In PowerShell, edit the values in `.env.local` rather than entering Bash-style `KEY=value` lines in the terminal. Restart the dev server after changing environment values.

Run the updated [`supabase/schema.sql`](supabase/schema.sql) in the Supabase SQL Editor. It creates the listings, seller profiles, reports, storage bucket, row-level security policies, and a profile trigger for new accounts; it also sets all plan prices to GH₵0 and grants the admin role only to `wisdomniiquarshie@gmail.com`. Enable email/password sign-in in Supabase Auth. If email confirmation is enabled, new users need to confirm their address before they can post or report. Use only the anon/public key in the `NEXT_PUBLIC_` variable.

To set up or repair account profiles without rerunning the full marketplace schema, run [`03_setup_student_accounts.sql`](03_setup_student_accounts.sql) in the Supabase SQL Editor. Supabase Auth stores email addresses and securely hashed passwords; `seller_profiles` stores student profile details such as name, campus, WhatsApp number, and seller type. This script also creates profiles for existing Auth users and automatically creates one for new sign-ups.

If publishing a listing reports that `public.plan_subscriptions` is missing from the schema cache, run [`04_setup_plan_subscriptions.sql`](04_setup_plan_subscriptions.sql) in the same Supabase project's SQL Editor, then refresh the page. It creates the subscription table, index, and row-level security policies. Until then, free plans can still publish; paid plans remain blocked until subscription records are available.

If the app reports `column seller_profiles.is_contact_public does not exist`, run [`02_add_contact_visibility.sql`](02_add_contact_visibility.sql) in the Supabase SQL Editor for the project configured in `.env.local`. This adds the WhatsApp visibility setting to an existing database; it is safe to run more than once. Refresh the page after the SQL succeeds.

## Install on a phone

College MRKT is an installable web app. Deploy it to a public HTTPS address before sharing it with students. On Android, open the site in Chrome or another supported browser and tap **Install app** (or use the browser menu and choose **Install app** / **Add to Home screen**). On iPhone or iPad, open the site in Safari, tap **Share**, then **Add to Home Screen**. The installed app uses the same live site and still needs an internet connection.

The pricing page currently shows the free Student Seller, Student Business and Business Plus plans. Accommodation Advertiser and Regular Advertiser are not shown there.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
