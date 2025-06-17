# AthithiPro Leads CRM

A comprehensive Customer Relationship Management (CRM) system built with Node.js, TypeScript, and Express.js, designed for managing leads and agencies with robust authentication, role-based access control,and multi-tenant architecture.

## 🚀 Features

### Core Functionality
- **Multi-Tenant Agency Management**: Support for multiple agencies with isolated data
- **User Authentication & Authorization**: JWT-based authentication with role-based access control
- **Lead Management**: Comprehensive lead tracking and management system
- **Role-Based Access Control (RBAC)**: Granular permissions system
- **Real-time Rate Limiting**: Redis-powered rate limiting for API endpoints
- **Email Integration**: Email service for notifications and verification
- **API Documentation**: Auto-generated Swagger/OpenAPI documentation

### Security Features
- **Password Encryption**: bcrypt-based password hashing
- **Request Validation**: Zod schema validation for all inputs
- **Security Headers**: Helmet.js for security headers
- **CORS Protection**: Configurable cross-origin resource sharing
- **Rate Limiting**: Multi-tier rate limiting (login, signup, password reset)

### Monitoring & Observability
- **Structured Logging**: Winston-based logging
- **Health Checks**: Built-in health monitoring endpoints
- **Request Logging**: Comprehensive request/response logging

## 🛠 Tech Stack

### Backend Framework
- **Node.js** (v20+) - Runtime environment
- **Express.js** (v4.18.2) - Web framework
- **TypeScript** (v5.0.4) - Type-safe JavaScript

### Database & Caching
- **MongoDB** (v8.0.0) - Primary database with Mongoose ODM
- **Redis** (IORedis v5.6.1) - Caching and session management and Queue Management System

### Authentication & Security
- **JWT** (v9.0.2) - JSON Web Tokens
- **Passport.js** (v0.7.0) - Authentication middleware
- **bcrypt.js** (v2.4.3) - Password hashing
- **Helmet** (v7.0.0) - Security headers

### Validation & Documentation
- **Zod** (v3.22.4) - Schema validation
- **Swagger UI Express** (v5.0.1) - API documentation

### Development & Code Quality
- **ESLint** (v9.28.0) - Code linting with extensive rules
- **Prettier** (v3.5.3) - Code formatting
- **Husky** (v9.1.7) - Git hooks
- **Lint-staged** (v16.1.0) - Pre-commit linting
- **Commitlint** - Conventional commit enforcement

## 🌐 External Services & Integrations

### Communication Services
- **SMTP Integration**: Email service for notifications
  - User verification emails
  - Password reset emails
  - System notifications

- **WhatsApp Business API**: Messaging integration for customer communication
  - Lead notifications
  - Customer engagement
  - Automated messaging

### Infrastructure Services
- **Redis Cloud/AWS ElastiCache**: Distributed caching and session management
- **MongoDB Atlas/AWS DocumentDB**: Managed database hosting
- **Environment-based Configuration**: Support for multiple deployment environments

## 📋 Prerequisites

- **Node.js** v20.0.0 or higher
- **MongoDB** v6.0 or higher
- **Redis** v6.0 or higher
- **npm** or **yarn** package manager

## ⚡ Quick Start

### 1. Clone the Repository
```bash
git clone <repository-url>
cd athitipro-leads-crm
```

### 2. Install Dependencies
```bash
npm install
```

### 3. Environment Configuration
Create a `.env` file in the root directory:

```env
# Server Configuration
NODE_ENV=development
PORT=3000
SERVER_TIMEOUT=60000

# Database
MONGO_URI=mongodb://localhost:27017/athitipro-crm

# Redis
REDIS_URL=redis://localhost:6379

# JWT Configuration
JWT_PRIVATE_KEY=your-jwt-private-key
JWT_PUBLIC_KEY=your-jwt-public-key
JWT_EXPIRES_IN=24h
JWT_REFRESH_SECRET=your-refresh-secret
JWT_REFRESH_EXPIRES_IN=7d
JWT_REFRESH_PRIVATE_KEY=your-refresh-private-key
JWT_REFRESH_PUBLIC_KEY=your-refresh-public-key

# Email Configuration
SMTP_HOST=your-smtp-host
SMTP_PORT=587
SMTP_USER=your-smtp-user
SMTP_PASS=your-smtp-password

# External Services
WHATSAPP_API_KEY=your-whatsapp-api-key
DATADOG_API_KEY=your-datadog-api-key

# Security
ALLOWED_ORIGINS=http://localhost:3000,http://localhost:3001
```

### 4. Start the Application

#### Development Mode
```bash
npm run dev
```

#### Production Mode
```bash
npm run build
npm start
```

## 📚 API Documentation

Once the server is running, access the interactive API documentation at:
- **Swagger UI**: `http://localhost:3000/api-docs`

### Key Endpoints

#### Authentication
- `POST /api/v1/auth/register` - User registration
- `POST /api/v1/auth/login` - User login
- `POST /api/v1/auth/refresh` - Refresh tokens
- `POST /api/v1/auth/forgot-password` - Password reset request
- `POST /api/v1/auth/reset-password` - Password reset confirmation

#### Agency Management
- `GET /api/v1/agencies` - List agencies
- `POST /api/v1/agencies` - Create agency
- `GET /api/v1/agencies/:id` - Get agency details
- `PUT /api/v1/agencies/:id` - Update agency
- `DELETE /api/v1/agencies/:id` - Delete agency

#### Health & Monitoring
- `GET /api/health` - Application health check

## 🔧 Development Scripts

```bash
# Development with hot reload
npm run dev

# Build TypeScript
npm run build

# Production start
npm start

# Code linting
npm run lint
npm run lint-fix

# Code formatting
npm run format
npm run format:check

# Type checking
npm run tsc

# Complete code quality check
npm run code-quality
```

## 🏗 Project Structure

```
athitipro-leads-crm/
├── src/
│   ├── module/                 # Business modules
│   │   ├── auth/              # Authentication module
│   │   └── agency/            # Agency management module
│   ├── shared/                # Shared utilities
│   │   ├── config/            # Configuration files
│   │   ├── middlewares/       # Express middlewares
│   │   ├── models/            # Database models
│   │   ├── services/          # Business services
│   │   ├── utils/             # Utility functions
│   │   └── core/              # Core application logic
│   ├── types/                 # TypeScript type definitions
│   ├── app.ts                 # Express app configuration
│   └── server.ts              # Application entry point
├── docs/                      # Documentation
├── dist/                      # Compiled JavaScript
├── .husky/                    # Git hooks
├── .vscode/                   # VS Code configuration
└── package.json
```

## 🔒 Security Features

### Authentication & Authorization
- **Multi-layer Security**: JWT AES256 Encryption
- **Role-based Access Control**: Granular permissions system
- **Password Security**: bcrypt hashing with salt rounds
- **Account Protection**: Login attempt limiting and account lockout

### API Security
- **Rate Limiting**: Redis-backed rate limiting for sensitive endpoints
- **Input Validation**: Comprehensive Zod schema validation
- **Security Headers**: Helmet.js implementation
- **CORS Protection**: Configurable origin restrictions

### Data Protection
- **Environment Variables**: Secure configuration management
- **Database Security**: Mongoose schema validation and sanitization
- **Error Handling**: Secure error responses without data leakage

## 📊 Monitoring & Logging

### Application Monitoring
- **Health Checks**: Built-in health monitoring endpoints
- **Performance Tracking**: Request/response time monitoring

### Logging System
- **Winston Logger**: Structured logging with multiple transports
- **Error Tracking**: Comprehensive error logging and stack traces

## 🚀 Deployment

### Environment Setup
1. Configure production environment variables
2. Set up MongoDB and Redis instances
3. Configure external service API keys
4. Set up SSL certificates for HTTPS

### Production Considerations
- Use PM2 or similar process manager
- Configure reverse proxy (Nginx/Apache)
- Set up monitoring and alerting
- Implement backup strategies for databases
- Configure CI/CD pipelines
---

**AthithiPro Leads CRM** - Empowering businesses with intelligent lead management and customer relationship tools. 
