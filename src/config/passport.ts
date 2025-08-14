import passport from 'passport';
import { Strategy as GoogleStrategy, Profile } from 'passport-google-oauth20';
import { User, GoogleProfile } from '../types/auth';
import { UserModel } from '../models/User';

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
        // Check if user already exists in database
        let existingUser = await UserModel.findByGoogleId(profile.id);
        
        if (existingUser) {
          // Update last login
          const updatedUser = await UserModel.updateLastLogin(profile.id);
          return done(null, updatedUser || existingUser);
        }

        // Create new user in database
        const newUser = await UserModel.create({
          id: profile.id,
          email: profile.emails?.[0]?.value || '',
          name: profile.displayName,
          picture: profile.photos?.[0]?.value,
          provider: profile.provider,
        });

        return done(null, newUser);
      } catch (error) {
        console.error('Passport Google Strategy Error:', error);
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
passport.deserializeUser(async (id: string, done) => {
  try {
    const user = await UserModel.findByGoogleId(id);
    done(null, user);
  } catch (error) {
    console.error('Passport deserializeUser error:', error);
    done(error, null);
  }
});

export default passport;
