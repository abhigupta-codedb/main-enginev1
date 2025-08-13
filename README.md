# Main Engine v1 - Express TypeScript Server

A Node.js server built with Express and TypeScript.

## Features

- ✅ Express.js web framework
- ✅ TypeScript for type safety
- ✅ CORS enabled
- ✅ Security headers with Helmet
- ✅ Request logging with Morgan
- ✅ Hot reload with ts-node-dev
- ✅ Health check endpoint
- ✅ Example API routes
- ✅ Error handling middleware
- ✅ Environment configuration
- ✅ Google OAuth 2.0 Authentication
- ✅ Session management
- ✅ JWT token generation
- ✅ Protected routes

## Getting Started

### Prerequisites

- Node.js (v16 or higher)
- npm or yarn

### Installation

1. Install dependencies:

```bash
npm install
```

2. Copy environment variables:

```bash
copy .env.example .env
```

3. **Set up Google OAuth:**

   - Go to [Google Cloud Console](https://console.cloud.google.com/)
   - Create a new project or select an existing one
   - Enable the Google+ API
   - Go to "Credentials" and create OAuth 2.0 Client IDs
   - Add `http://localhost:3000/auth/google/callback` to authorized redirect URIs
   - Copy the Client ID and Client Secret to your `.env` file

4. Start development server:

```bash
npm run dev
```

The server will start on `http://localhost:3000`

### Available Scripts

- `npm run dev` - Start development server with hot reload
- `npm run build` - Build the TypeScript code
- `npm start` - Start production server
- `npm run watch` - Watch TypeScript files and compile on changes
- `npm run clean` - Clean the dist directory

### API Endpoints

**Public Endpoints:**

- `GET /` - Welcome message
- `GET /health` - Health check
- `GET /login` - Login page
- `GET /api/users` - Get all users (mock data)
- `POST /api/users` - Create a new user

**Authentication Endpoints:**

- `GET /auth/google` - Start Google OAuth flow
- `GET /auth/google/callback` - Google OAuth callback
- `GET /auth/profile` - Get user profile (protected)
- `GET /auth/status` - Check authentication status
- `POST /auth/logout` - Logout user

**Protected Endpoints:**

- `GET /api/protected` - Example protected API route (requires authentication)

### Project Structure

```
src/
├── index.ts              # Main server file
├── config/
│   └── passport.ts       # Passport Google OAuth configuration
├── routes/
│   └── auth.ts          # Authentication routes
├── types/
│   └── auth.ts          # TypeScript types for authentication
├── middleware/          # Custom middleware (add as needed)
├── controllers/         # Route controllers (add as needed)
├── models/              # Data models (add as needed)
└── utils/               # Utility functions (add as needed)
```

### Environment Variables

Copy `.env.example` to `.env` and configure as needed:

- `NODE_ENV` - Environment (development/production)
- `PORT` - Server port (default: 3000)
- `GOOGLE_CLIENT_ID` - Google OAuth Client ID
- `GOOGLE_CLIENT_SECRET` - Google OAuth Client Secret
- `GOOGLE_CALLBACK_URL` - Google OAuth callback URL
- `SESSION_SECRET` - Secret key for session encryption
- `JWT_SECRET` - Secret key for JWT token signing

## Google OAuth Setup

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select existing
3. Enable the Google+ API (or Google People API)
4. Go to "Credentials" → "Create Credentials" → "OAuth 2.0 Client IDs"
5. Set application type to "Web application"
6. Add authorized redirect URIs:
   - `http://localhost:3000/auth/google/callback` (development)
   - `https://yourdomain.com/auth/google/callback` (production)
7. Copy Client ID and Client Secret to your `.env` file

## Authentication Flow

1. User visits `/login` to see the login page
2. User clicks "Sign in with Google"
3. User is redirected to Google for authentication
4. Google redirects back to `/auth/google/callback`
5. Server creates/updates user and establishes session
6. User can now access protected routes

## Testing Authentication

1. Start the server: `npm run dev`
2. Visit: `http://localhost:3000/login`
3. Click "Sign in with Google"
4. After successful auth, try accessing: `http://localhost:3000/api/protected`

## Development

The server uses `ts-node-dev` for hot reloading during development. Any changes to TypeScript files will automatically restart the server.

## Production

1. Build the project:

```bash
npm run build
```

2. Start the production server:

```bash
npm start
```

## License

ISC
