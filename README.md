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

## Authentication setup

The `/user` page signs users in with Google through `@react-oauth/google`. The
frontend sends the Google ID token to the backend, which verifies it and sets an
httpOnly session cookie. Session state is restored on every page load via
`GET /authMe`.

1. Copy `.env.example` to `.env.local`.
2. Set `NEXT_PUBLIC_GOOGLE_CLIENT_ID` to the same Google OAuth client ID the
   backend uses for `GOOGLE_CLIENT_ID`. The backend validates the token audience
   against it.
3. In Google Cloud Console, add `http://localhost:3000` as an authorized
   JavaScript origin for that OAuth client.
4. Run the backend on port 5000, or set `NEXT_PUBLIC_API_URL` to its base URL.

Google sign-in requires a real Google account and a configured OAuth client, so
it cannot be exercised in automated tests.

## Chatbot

The floating assistant is mounted in the root layout and is available on every
page. It uses the backend's authenticated chatbot API:

- `GET /api-v1/chatbot/messages`
- `POST /api-v1/chatbot/messages`

The widget only works for signed-in users. It uses the same
`NEXT_PUBLIC_API_URL` base as the auth client and requires no additional
frontend environment variables. Conversation storage, summaries, and AI
responses are owned by the backend.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
