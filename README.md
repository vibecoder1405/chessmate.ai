# ChessMate.ai

A modern chess application built with Next.js, featuring AI-powered gameplay and a beautiful user interface.

## Features

- Interactive chessboard with move validation
- AI opponent using Stockfish engine
- Dark/Light theme support
- Responsive design for mobile and desktop
- Modern UI components using Radix UI
- Real-time game state management

## Tech Stack

- **Frontend Framework**: Next.js 15.2.3
- **UI Components**: Radix UI
- **Styling**: Tailwind CSS
- **State Management**: React Query
- **Chess Engine**: Stockfish
- **Form Handling**: React Hook Form
- **Type Safety**: TypeScript
- **AI Integration**: Genkit

## Project Structure

```
src/
├── app/              # Next.js app router pages
├── components/       # React components
│   ├── ui/          # Reusable UI components
│   └── chessboard.tsx # Main chessboard component
├── lib/             # Utility functions and core logic
├── hooks/           # Custom React hooks
└── ai/              # AI-related functionality
```

## Getting Started

1. Clone the repository
2. Install dependencies:
   ```bash
   npm install
   ```
3. Start the development server:
   ```bash
   npm run dev
   ```
4. Open [http://localhost:9002](http://localhost:9002) in your browser

## Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run lint` - Run ESLint
- `npm run typecheck` - Run TypeScript type checking

## Environment Variables

Create a `.env` file in the root directory with the following variables:
- Add any required environment variables here

## Contributing

1. Fork the repository
2. Create your feature branch
3. Commit your changes
4. Push to the branch
5. Create a new Pull Request

## License

This project is licensed under the MIT License - see the LICENSE file for details.
