# Interactive Battle Visualizer

An interactive web application that brings historical battles to life through detailed research, dynamic storytelling, and animated troop movements.

## Features

- Search and visualize historical battles
- Interactive map representations with troop movements
- AI-powered research compilation and narration
- Modern, responsive UI with smooth animations
- Scene-by-scene battle progression
- Historical context and battle impact analysis

## Tech Stack

- **Frontend**: Next.js (React), Three.js, TailwindCSS
- **Backend**: Next.js API Routes
- **AI Integration**: OpenAI API for research and text-to-speech
- **Database**: PostgreSQL with Prisma ORM
- **Styling**: TailwindCSS + HeadlessUI

## Getting Started

### Prerequisites

- Node.js 18+ 
- npm or yarn
- PostgreSQL database
- OpenAI API key

### Environment Setup

Create a `.env` file in the root directory with the following variables:

```env
# Database
DATABASE_URL="postgresql://user:password@localhost:5432/battle_visualizer"

# OpenAI
OPENAI_API_KEY="your-api-key"
OPENAI_MODEL="gpt-4-turbo-preview"  # or your preferred model
```

### Installation

1. Clone the repository:
```bash
git clone [repository-url]
cd battle-visualizer
```

2. Install dependencies:
```bash
npm install
# or
yarn install
```

3. Set up the database:
```bash
npx prisma generate
npx prisma db push
```

4. Run the development server:
```bash
npm run dev
# or
yarn dev
```

5. Open [http://localhost:3000](http://localhost:3000) in your browser.

## Project Structure

```
battle-visualizer/
├── app/                    # Next.js app directory
│   ├── api/               # API routes
│   ├── components/        # React components
│   ├── lib/              # Utility functions and services
│   └── pages/            # Page components
├── prisma/               # Database schema and migrations
├── public/              # Static assets
└── styles/             # Global styles
```

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the LICENSE file for details. 