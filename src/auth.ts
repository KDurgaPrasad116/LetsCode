import NextAuth from "next-auth";
import Google from "next-auth/providers/google";
import Credentials from "next-auth/providers/credentials";
import { prisma } from "@/lib/prisma";
import { mockDb } from "@/lib/mockDb";

const googleClientId =
  process.env.AUTH_GOOGLE_ID || process.env.GOOGLE_CLIENT_ID || "";
const googleClientSecret =
  process.env.AUTH_GOOGLE_SECRET || process.env.GOOGLE_CLIENT_SECRET || "";

export const isGoogleConfigured = Boolean(
  googleClientId &&
  googleClientSecret &&
  !googleClientId.startsWith("mock-") &&
  googleClientId.trim().length > 0
);

const publicAppUrl =
  process.env.RENDER_EXTERNAL_URL ||
  process.env.AUTH_URL ||
  process.env.NEXTAUTH_URL ||
  process.env.NEXT_PUBLIC_APP_URL ||
  "http://localhost:3000";

const canonicalUrl = publicAppUrl.startsWith("http")
  ? publicAppUrl.replace(/\/+$/, "")
  : `https://${publicAppUrl.replace(/\/+$/, "")}`;

process.env.AUTH_URL = canonicalUrl;
process.env.NEXTAUTH_URL = canonicalUrl;

const authSecret =
  process.env.AUTH_SECRET ||
  process.env.NEXTAUTH_SECRET ||
  "letscode_dsa_tracker_super_secret_jwt_key_2026_dev_prod";

if (!process.env.AUTH_SECRET) {
  process.env.AUTH_SECRET = authSecret;
}

export const { handlers, signIn, signOut, auth } = NextAuth({
  trustHost: true,
  providers: [
    Google({
      clientId: googleClientId || "google-client-placeholder",
      clientSecret: googleClientSecret || "google-secret-placeholder",
      allowDangerousEmailAccountLinking: true,
    }),
    Credentials({
      id: "credentials",
      name: "Account Sign In",
      credentials: {
        email: { label: "Email", type: "email", placeholder: "you@example.com" },
        name: { label: "Name", type: "text", placeholder: "Your Name" },
      },
      async authorize(credentials) {
        const email =
          typeof credentials?.email === "string"
            ? credentials.email.trim().toLowerCase()
            : "";
        const rawName =
          typeof credentials?.name === "string" ? credentials.name.trim() : "";

        if (!email) {
          return null;
        }

        const name = rawName || email.split("@")[0] || "Developer";

        // Try persisting or retrieving user via Prisma
        let resolvedUser = null;
        try {
          const existing = await prisma.user.findUnique({
            where: { email },
          });

          if (existing) {
            resolvedUser = {
              id: existing.id,
              name: existing.name || name,
              email: existing.email || email,
              image: existing.image || null,
            };
          } else {
            const newUser = await prisma.user.create({
              data: {
                email,
                name,
              },
            });

            resolvedUser = {
              id: newUser.id,
              name: newUser.name || name,
              email: newUser.email || email,
              image: newUser.image || null,
            };
          }
        } catch (dbError) {
          // If database is disconnected or running in mock store mode,
          // create a deterministic user ID per email so users have isolated sessions
          const sanitized = email.replace(/[^a-zA-Z0-9]/g, "_");
          resolvedUser = {
            id: `usr_${sanitized}`,
            name,
            email,
            image: null,
          };
        }

        if (resolvedUser) {
          mockDb.registerOrUpdateUser({
            id: resolvedUser.id,
            name: resolvedUser.name,
            email: resolvedUser.email,
          });
        }

        return resolvedUser;
      },
    }),
  ],
  session: {
    strategy: "jwt",
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
  callbacks: {
    async signIn({ user, account }) {
      // Sync Google profile into database if user signed in via Google OAuth
      if (account?.provider === "google" && user?.email) {
        const email = user.email.toLowerCase().trim();
        try {
          const existing = await prisma.user.findUnique({
            where: { email },
          });

          if (existing) {
            await prisma.user.update({
              where: { id: existing.id },
              data: {
                name: existing.name || user.name || "Google User",
                image: user.image || existing.image,
              },
            });
            user.id = existing.id;
          } else {
            const newUser = await prisma.user.create({
              data: {
                email,
                name: user.name || email.split("@")[0],
                image: user.image || null,
              },
            });
            user.id = newUser.id;
          }
        } catch (err) {
          console.warn("Could not sync Google OAuth user to Prisma database:", err);
          user.id = `usr_${email.replace(/[^a-zA-Z0-9]/g, "_")}`;
        }
      }

      if (user?.id) {
        mockDb.registerOrUpdateUser({
          id: user.id as string,
          name: user.name,
          email: user.email,
        });
      }

      return true;
    },
    async jwt({ token, user, account }) {
      if (user) {
        token.id = user.id;
        token.email = user.email;
        token.name = user.name;
        token.picture = user.image;
      }
      if (account?.provider === "google") {
        token.provider = "google";
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user && token) {
        session.user.id = (token.id as string) || (token.sub as string);
        session.user.name = token.name as string;
        session.user.email = token.email as string;
        session.user.image = (token.picture as string) || null;

        mockDb.registerOrUpdateUser({
          id: session.user.id,
          name: session.user.name,
          email: session.user.email,
        });
      }
      return session;
    },
  },
  pages: {
    signIn: "/auth/signin",
  },
  secret: authSecret,
});
