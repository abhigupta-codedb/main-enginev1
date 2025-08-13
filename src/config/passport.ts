import passport from 'passport';
import { Strategy as GoogleStrategy, Profile } from 'passport-google-oauth20';
import { User, GoogleProfile } from '../types/auth';

// In a real application, you would store users in a database
// For now, we'll use an in-memory store
const users: User[] = [];

// Validate required environment variables
if (!process.env.GOOGLE_CLIENT_ID || !process.env.GOOGLE_CLIENT_SECRET || !process.env.GOOGLE_CALLBACK_URL) {
  console.error('Missing required Google OAuth environment variables:');
  console.error('GOOGLE_CLIENT_ID:', process.env.GOOGLE_CLIENT_ID ? '✓' : '✗');
  console.error('GOOGLE_CLIENT_SECRET:', process.env.GOOGLE_CLIENT_SECRET ? '✓' : '✗');
  console.error('GOOGLE_CALLBACK_URL:', process.env.GOOGLE_CALLBACK_URL ? '✓' : '✗');
  throw new Error('Google OAuth configuration is incomplete. Please check your .env file.');
}

// Configure Google OAuth strategy
passport.use(
  new GoogleStrategy(
    {
      clientID: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      callbackURL: process.env.GOOGLE_CALLBACK_URL,
    },
    async (accessToken: string, refreshToken: string, profile: Profile, done) => {
      try {
        // Check if user already exists
        let existingUser = users.find(user => user.id === profile.id);
        
        if (existingUser) {
          // Update last login
          existingUser.lastLogin = new Date();
          return done(null, existingUser);
        }

        // Create new user
        const newUser: User = {
          id: profile.id,
          email: profile.emails?.[0]?.value || '',
          name: profile.displayName,
          picture: profile.photos?.[0]?.value,
          provider: profile.provider,
          createdAt: new Date(),
          lastLogin: new Date(),
        };

        users.push(newUser);
        return done(null, newUser);
      } catch (error) {
        return done(error, undefined);
      }
    }
  )
);

// Serialize user for session
passport.serializeUser((user: Express.User, done) => {
  done(null, user.id);
});

// Deserialize user from session
passport.deserializeUser((id: string, done) => {
  const user = users.find(user => user.id === id);
  done(null, user || null);
});

export default passport;
