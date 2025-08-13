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

3. Start development server:
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

- `GET /` - Welcome message
- `GET /health` - Health check
- `GET /api/users` - Get all users (mock data)
- `POST /api/users` - Create a new user

### Project Structure

```
src/
├── index.ts          # Main server file
├── routes/           # Route handlers (add as needed)
├── middleware/       # Custom middleware (add as needed)
├── controllers/      # Route controllers (add as needed)
├── models/           # Data models (add as needed)
└── utils/            # Utility functions (add as needed)
```

### Environment Variables

Copy `.env.example` to `.env` and configure as needed:

- `NODE_ENV` - Environment (development/production)
- `PORT` - Server port (default: 3000)

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
