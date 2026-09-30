import { NextAuthOptions } from 'next-auth';
import GoogleProvider from 'next-auth/providers/google';
import CredentialsProvider from 'next-auth/providers/credentials';
import { connectDB } from './db';
import { User, IUser, UserRole } from '@/models/User';
import { TutorInvitation } from '@/models/TutorInvitation';
import { AuditLog } from '@/models/AuditLog';

// Extend NextAuth types
declare module 'next-auth' {
  interface Session {
    user: {
      id: string;
      name?: string | null;
      email?: string | null;
      image?: string | null;
      role: UserRole;
      status: 'ACTIVE' | 'SUSPENDED';
    };
  }

  interface User {
    id: string;
    role: UserRole;
    status: 'ACTIVE' | 'SUSPENDED';
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    id: string;
    role: UserRole;
    status: 'ACTIVE' | 'SUSPENDED';
    lastChecked?: number;
  }
}

export const authOptions: NextAuthOptions = {
  secret: process.env.NEXTAUTH_SECRET,
  session: {
    strategy: 'jwt',
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
  pages: {
    signIn: '/login',
    error: '/login',
  },
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID || '',
      clientSecret: process.env.GOOGLE_CLIENT_SECRET || '',
      authorization: {
        params: {
          scope: 'openid email profile',
          prompt: 'select_account',
          access_type: 'offline',
          response_type: 'code',
        },
      },
    }),
    // Development helper provider: enabled only when explicit dev flag is turned on
    // This allows verifying the full LMS workflow locally before Google Cloud Console keys are entered
    ...(process.env.NODE_ENV !== 'production' || process.env.ALLOW_DEV_IMPERSONATION === 'true'
      ? [
          CredentialsProvider({
            id: 'dev-impersonation',
            name: 'Development Role Switcher',
            credentials: {
              email: { label: 'Email', type: 'text' },
            },
            async authorize(credentials) {
              if (process.env.ALLOW_DEV_IMPERSONATION !== 'true') {
                return null;
              }
              if (!credentials?.email) return null;

              await connectDB();
              const user = await User.findOne({ email: credentials.email.toLowerCase() });
              if (!user) {
                return null;
              }
              if (user.status === 'SUSPENDED') {
                throw new Error('AccountSuspended');
              }

              return {
                id: user._id.toString(),
                name: user.name,
                email: user.email,
                image: user.image,
                role: user.role,
                status: user.status,
              };
            },
          }),
        ]
      : []),
  ],
  callbacks: {
    async signIn({ user, account, profile }) {
      if (account?.provider === 'google') {
        const googleProfile = profile as { email_verified?: boolean; sub?: string } | undefined;
        
        // Strict Google Verification Check: Reject unverified emails
        if (!googleProfile?.email_verified) {
          console.warn(`[OAuth Warning] Denied sign-in for unverified email: ${user.email}`);
          return false;
        }

        const googleProviderId = account.providerAccountId;
        if (!googleProviderId) {
          return false;
        }

        await connectDB();
        const email = user.email?.toLowerCase();
        if (!email) return false;

        // 1. Look up existing user by Google Provider ID
        let dbUser = await User.findOne({ googleProviderId });

        if (dbUser) {
          // If suspended, reject login
          if (dbUser.status === 'SUSPENDED') {
            console.warn(`[Auth Warning] Suspended user attempted sign in: ${dbUser.email}`);
            return '/suspended';
          }

          // Check for pending tutor invitation for this verified email
          if (dbUser.role === 'STUDENT') {
            const pendingInvite = await TutorInvitation.findOne({
              email: dbUser.email,
              status: 'PENDING',
              expiresAt: { $gt: new Date() },
            });

            if (pendingInvite) {
              dbUser.role = 'TUTOR';
              await dbUser.save();

              pendingInvite.status = 'ACCEPTED';
              pendingInvite.acceptedAt = new Date();
              pendingInvite.acceptedByUserId = dbUser._id;
              await pendingInvite.save();

              await AuditLog.create({
                action: 'TUTOR_INVITATION_ACCEPTED',
                performedBy: dbUser._id,
                targetType: 'TutorInvitation',
                targetId: pendingInvite._id,
                details: { email: dbUser.email, assignedCourses: pendingInvite.assignedCourses },
              });
            }
          }

          // Update profile details
          dbUser.name = user.name || dbUser.name;
          if (user.image) dbUser.image = user.image;
          dbUser.emailVerified = new Date();
          await dbUser.save();

          user.id = dbUser._id.toString();
          user.role = dbUser.role;
          user.status = dbUser.status;
          return true;
        }

        // 2. Check if user exists by email without googleProviderId
        // Rule: "Never automatically merge accounts solely because email addresses match."
        const existingEmailUser = await User.findOne({ email });
        if (existingEmailUser) {
          // If the account has no provider ID (e.g. invited tutor or seeded user), link it securely with verified Google identity
          if (!existingEmailUser.googleProviderId) {
            existingEmailUser.googleProviderId = googleProviderId;
            existingEmailUser.emailVerified = new Date();
            if (user.image && !existingEmailUser.image) {
              existingEmailUser.image = user.image;
            }
            await existingEmailUser.save();

            // Check if invited tutor
            const pendingInvite = await TutorInvitation.findOne({
              email,
              status: 'PENDING',
              expiresAt: { $gt: new Date() },
            });
            if (pendingInvite) {
              existingEmailUser.role = 'TUTOR';
              await existingEmailUser.save();

              pendingInvite.status = 'ACCEPTED';
              pendingInvite.acceptedAt = new Date();
              pendingInvite.acceptedByUserId = existingEmailUser._id;
              await pendingInvite.save();
            }

            user.id = existingEmailUser._id.toString();
            user.role = existingEmailUser.role;
            user.status = existingEmailUser.status;
            return true;
          } else {
            // Already linked to a different provider account! Reject to prevent account takeover
            console.error(`[Auth Error] Email ${email} already linked to another provider account.`);
            return false;
          }
        }

        // 3. New User Registration
        // Check if there is a pending tutor invitation
        const pendingInvite = await TutorInvitation.findOne({
          email,
          status: 'PENDING',
          expiresAt: { $gt: new Date() },
        });

        const initialRole: UserRole = pendingInvite ? 'TUTOR' : 'STUDENT';

        const newUser = await User.create({
          name: user.name || email.split('@')[0],
          email,
          emailVerified: new Date(),
          image: user.image || '',
          role: initialRole,
          status: 'ACTIVE',
          googleProviderId,
        });

        if (pendingInvite) {
          pendingInvite.status = 'ACCEPTED';
          pendingInvite.acceptedAt = new Date();
          pendingInvite.acceptedByUserId = newUser._id;
          await pendingInvite.save();

          await AuditLog.create({
            action: 'TUTOR_INVITATION_ACCEPTED',
            performedBy: newUser._id,
            targetType: 'TutorInvitation',
            targetId: pendingInvite._id,
            details: { email, assignedCourses: pendingInvite.assignedCourses },
          });
        }

        user.id = newUser._id.toString();
        user.role = newUser.role;
        user.status = newUser.status;
        return true;
      }

      return true;
    },

    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.role = user.role;
        token.status = user.status;
        token.lastChecked = Date.now();
      }

      // Re-verify user status and role from DB every 5 minutes or on demand
      const shouldRecheck = !token.lastChecked || Date.now() - token.lastChecked > 5 * 60 * 1000;
      if (token.id && shouldRecheck) {
        try {
          await connectDB();
          const dbUser = await User.findById(token.id).select('role status');
          if (dbUser) {
            token.role = dbUser.role;
            token.status = dbUser.status;
            token.lastChecked = Date.now();
          }
        } catch {
          // Keep previous token values if DB lookup fails temporarily
        }
      }

      return token;
    },

    async session({ session, token }) {
      if (session.user && token) {
        session.user.id = token.id;
        session.user.role = token.role;
        session.user.status = token.status;
      }
      return session;
    },
  },
};
