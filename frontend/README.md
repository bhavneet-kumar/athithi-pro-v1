# Travel Agent Nexus AI

A modern, professional-grade travel agency management system built with cutting-edge technologies.

## 🚀 Tech Stack

- **Framework**: React + TypeScript
- **Build Tool**: Vite
- **Routing**: TanStack Router (File-based routing)
- **State Management**: Redux Toolkit (RTK) with caching support
- **UI Components**: shadcn/ui (Exploring other options as well)
- **Tables**: TanStack Table
- **Styling**: Tailwind CSS
- **Code Quality**: ESLint, Prettier, Husky

## 📁 Project Structure

```
travel-agent-nexus-ai/
├── src/
│   ├── components/     # Reusable UI components
│   │   ├── ui/        # shadcn/ui components
│   │   └── shared/    # Shared components across features
│   ├── features/      # Feature-based modules
│   │   ├── auth/      # Authentication feature
│   │   ├── bookings/  # Booking management
│   │   └── users/     # User management
│   ├── hooks/         # Custom React hooks
│   ├── lib/           # Utility functions and configurations
│   │   ├── api/       # API client and endpoints
│   │   └── utils/     # Helper functions
│   ├── routes/        # TanStack Router file-based routes
│   │   ├── _app.tsx   # Root route layout
│   │   ├── index.tsx  # Home page route
│   │   ├── auth/      # Authentication routes
│   │   │   ├── login.tsx
│   │   │   └── register.tsx
│   │   ├── bookings/  # Booking routes
│   │   │   ├── index.tsx
│   │   │   └── $bookingId.tsx
│   │   └── users/     # User management routes
│   │       ├── index.tsx
│   │       └── $userId.tsx
│   ├── store/         # Redux store configuration
│   │   ├── index.ts   # Store setup
│   │   ├── api/       # RTK Query API definitions
│   │   │   ├── auth.api.ts
│   │   │   ├── bookings.api.ts
│   │   │   └── users.api.ts
│   │   └── slices/    # Redux slices
│   │       ├── auth.slice.ts
│   │       ├── bookings.slice.ts
│   │       └── users.slice.ts
│   ├── types/         # TypeScript type definitions
│   ├── App.tsx        # Root component
│   └── main.tsx       # Application entry point
├── public/            # Static assets
├── .husky/           # Git hooks
└── [config files]    # Various configuration files
```

## 🛠️ Getting Started

### Prerequisites

- Node.js (v18 or higher)
- npm, yarn, or bun

### Installation

1. Clone the repository:

   ```bash
   git clone [repository-url]
   cd travel-agent-nexus-ai
   ```

2. Install dependencies:

   ```bash
   npm install
   # or
   yarn install
   # or
   bun install
   ```

3. Start the development server:
   ```bash
   npm run dev
   # or
   yarn dev
   # or
   bun dev
   ```

## 🏗️ Architecture

### Routing

The application uses TanStack Router with file-based routing. The `src/routes` directory contains all route definitions, where:

- Each file represents a route
- File names determine the URL structure
- `_app.tsx` defines the root layout
- Dynamic routes use `$` prefix (e.g., `$userId.tsx`)
- Nested routes are organized in subdirectories

### State Management

Redux Toolkit (RTK) is used for state management with built-in caching support. The store is organized by features, with each feature having its own slice and API definition:

- `store/slices/` contains Redux slices for local state management
- `store/api/` contains RTK Query API definitions for server state management
- Each feature has its corresponding slice and API file (e.g., `auth.slice.ts` and `auth.api.ts`)

### UI Components

The project uses shadcn/ui as the base component library, providing a solid foundation for building a consistent and accessible user interface.

### Data Tables

TanStack Table is implemented for handling complex data tables with features like:

- Sorting
- Filtering
- Pagination
- Row selection
- Custom cell rendering

## 🧪 Development

### Code Style

- ESLint and Prettier are configured for consistent code style
- Husky pre-commit hooks ensure code quality
- TypeScript for type safety

### Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run lint` - Run ESLint
- `npm run format` - Format code with Prettier
- `npm run type-check` - Run TypeScript type checking

## 📝 Contributing

1. Create a feature branch
2. Make your changes
3. Submit a pull request

## 📄 License

[License Type] - See LICENSE file for details
