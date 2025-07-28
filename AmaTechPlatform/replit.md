# AmaTech - Investment Banking Internal Platform

## Overview

AmaTech is an internal CRM platform designed for investment banking M&A processes, specifically focused on roadshow management and counterparty tracking. The application is built as a full-stack web application with a React frontend, Express.js backend, and PostgreSQL database using Drizzle ORM.

## User Preferences

Preferred communication style: Simple, everyday language.
Design preferences: Sober, professional interface aligned with Amala Partners corporate identity using #0e355c blue color and minimalist design elements.

## System Architecture

### Frontend Architecture
- **Framework**: React 18 with TypeScript
- **Routing**: Wouter for client-side routing
- **State Management**: TanStack React Query for server state management
- **UI Components**: Radix UI primitives with shadcn/ui design system
- **Styling**: Tailwind CSS with CSS variables for theming
- **Form Handling**: React Hook Form with Zod validation
- **Build Tool**: Vite with custom configuration for development and production

### Backend Architecture
- **Runtime**: Node.js with Express.js framework
- **Language**: TypeScript with ES modules
- **API Design**: RESTful API with JSON responses
- **Request Handling**: Express middleware for JSON parsing and error handling
- **Development**: Hot reload with Vite integration in development mode

### Database Design
- **Database**: PostgreSQL (configured for Neon serverless)
- **ORM**: Drizzle ORM with TypeScript-first approach
- **Schema Management**: Drizzle Kit for migrations and schema management
- **Type Safety**: Full TypeScript integration with Drizzle Zod for validation

## Key Components

### Data Models
1. **Societes (Companies)**: Core entity for companies with fields for name, sector, website, description, and buyer/client flags
2. **Contacts**: Individual contacts linked to companies with communication details
3. **Processus (Processes)**: M&A processes linking client companies with transaction details
4. **Interactions**: Communication logs between team and counterparties
5. **Roadshow Items**: Specific entries tracking companies through the M&A sales process
6. **Rappels (Reminders)**: Task reminders with due dates

### Frontend Components
- **Dashboard**: Main application view with Kanban board layout
- **KanbanBoard**: Visual process tracking with drag-and-drop columns
- **Company Cards**: Individual company status displays with interaction capabilities
- **Modals**: Form overlays for adding companies and logging interactions
- **Sidebar**: Navigation with reminder counts and menu items

### Backend Services
- **Storage Interface**: Abstracted data access layer for all entities
- **Route Handlers**: RESTful endpoints for CRUD operations
- **Validation**: Zod schema validation for all API inputs
- **Error Handling**: Centralized error management with proper HTTP status codes

## Data Flow

1. **Client Requests**: Frontend makes API calls using TanStack Query
2. **Route Processing**: Express routes validate and process requests
3. **Data Access**: Storage layer interfaces with Drizzle ORM
4. **Database Operations**: PostgreSQL handles data persistence
5. **Response Generation**: JSON responses sent back to client
6. **State Updates**: React Query manages cache invalidation and UI updates

### Kanban Workflow
Companies progress through defined stages:
- Non Contacté (Not Contacted)
- NDA Envoyé (NDA Sent)
- NDA Signé (NDA Signed)
- IOI Reçu (IOI Received)
- Abandonné (Abandoned)

## External Dependencies

### Core Dependencies
- **@neondatabase/serverless**: PostgreSQL serverless connection
- **drizzle-orm**: TypeScript ORM with PostgreSQL dialect
- **@tanstack/react-query**: Server state management
- **@radix-ui/***: Accessible UI component primitives
- **react-hook-form**: Form state management
- **zod**: Runtime type validation
- **tailwindcss**: Utility-first CSS framework

### Development Tools
- **vite**: Fast build tool and dev server
- **tsx**: TypeScript execution for Node.js
- **drizzle-kit**: Schema management and migrations
- **@replit/vite-plugin-***: Replit-specific development enhancements

## Deployment Strategy

### Development
- **Local Development**: Vite dev server with hot module replacement
- **Backend Integration**: Express server with Vite middleware integration
- **Database**: PostgreSQL connection via environment variables
- **Build Process**: Separate client and server build processes

### Production
- **Client Build**: Vite builds optimized React application to `dist/public`
- **Server Build**: esbuild bundles Express server to `dist/index.js`
- **Static Serving**: Express serves built client files in production
- **Database**: PostgreSQL connection string from `DATABASE_URL` environment variable
- **Process Management**: Single Node.js process serves both API and static files

### Environment Configuration
- **NODE_ENV**: Controls development vs production behavior
- **DATABASE_URL**: PostgreSQL connection string (required)
- **REPL_ID**: Replit-specific environment detection

## Recent Changes

### January 23, 2025 - Dashboard as Single Source of Truth Update
- **Architecture Simplification**: Dashboard established as primary source of truth, removed conflicting pages
- **Success Fee Bug Fix**: Corrected data mapping and forced display of fee calculations
- **User Data Correction**: Fixed user ID mapping issues for team assignment
- **Navigation Streamlined**: Removed redundant Kanban and listing pages that created conflicts
- **Vue Détaillée Créée**: Nouvelle structure ProjectDetail avec header fixe, sidebar navigation et sections modulaires
- **Route Simplifiée**: Une seule route `/projects/:id` pour la vue détaillée, suppression de `/dossiers/:id`
- **PDF Toolbox Feature**: Added OutilsRapides component with 3 PDF manipulation tools:
  - PDF compression with file size display
  - Watermark addition with custom text input
  - PDF merging with drag-and-drop file ordering
- **Security Implementation**: 150MB file size limit, local processing only, no server storage
- **User Experience**: Modal-based interactions with progress indicators and validation
- **Dossiers Page Modernization**: Completely redesigned /dossiers page:
  - Modern card-based layout replacing old roadshow interface
  - Advanced filtering by status, type, and membership
  - Real-time search functionality
  - Statistics dashboard with key metrics
  - Consistent branding and navigation with Dashboard
- **Kanban Workflow Implementation**: Added Kanban board view for M&A deal progression:
  - 8-stage workflow: Préparation → Pre-marketing → Screening → Deal making → Roadshow → Phase 2 → Exclusivité → Road to closing
  - Visual drag-and-drop style stage progression for active deals
  - Toggle between List and Kanban views
  - Real-time stage updates with API integration
  - Enhanced database schema with etape_kanban field
- **ProjetModal Component Rebuild**: Completely reconstructed modal system:
  - Created independent ProjetModal component with controlled state management
  - Eliminated modal focus bugs through proper DOM mounting/unmounting
  - Clean backdrop handling with z-index layering (backdrop z-40, modal z-50)
  - Supports both "edit" and "create" modes with unified interface
  - Parent-controlled state prevents overlay persistence issues
  - Fixed all modal interaction blocking problems
- **Visual Improvements**: Enhanced status indicators across dashboard and dossiers pages:
  - Added visible status indicator dots (green for active, blue for closed, etc.)
  - Improved date validation preventing "Invalid Date" display
  - Consistent status color coding across all views
  - Enhanced admin controls for dossier management (modify, change status, delete)
- **Admin Dashboard Controls**: Added comprehensive admin buttons in "Mes Dossiers" section:
  - "Gérer" button: Opens modal for full dossier modification with existing data pre-filled
  - "Changer statut" button: Color-coded status changes (Actif=vert, Clôturé=bleu, Stand-by=jaune, Failed=rouge)
  - "Supprimer" button: Simplified deletion confirmation explaining what gets deleted (dossier, sociétés, contacts, interactions, roadshow data)
  - Only visible for users with Admin role
  - Compact dropdown menu design that doesn't affect card sizes
- **Dossiers Page Simplification**: Streamlined /dossiers to pure Kanban view:
  - Removed complex filtering, search, and list views
  - Single status filter for Kanban navigation
  - Accessible via "Voir tous les dossiers" link
- **ProjetModal Form Enrichment**: Complete overhaul of project creation/editing forms:
  - **TeamCombobox Component**: Modern autocomplete team selection with 12+ member suggestions, current user protection, and elegant badge display
  - **Admin Economic Block**: Visible only to Admin role users with retainer, flat fee, success fee percentage configuration
  - **Pipeline Weighting System**: Real-time fee simulator with percentage-based value adjustment (0-100%)
  - **Enhanced Schema**: Added success_fee_pourcentage and pipeline_ponderation database fields
  - **Form Validation**: Complete Zod schema with proper type safety for all economic fields
  - **Real-time Calculator**: Live fee estimation based on pipeline weighting and success fee percentage
- **Roadshow UX Synchronization**: Implemented real-time frontend updates without manual refresh:
  - **Dynamic Interaction Counters**: Local state management for instant counter updates after adding interactions
  - **Enhanced Date Field UX**: Edit mode with visual indicators (✏️) for NDA/IM/BP/Teaser dates, showing "+ Ajouter" for empty fields
  - **Phase 2 Toggle**: Functional checkbox with backend integration showing Dataroom/Binding options when activated
  - **Smart Local State**: Optimistic updates with fallback to server data for seamless user experience
  - **Toast Feedback**: Personalized success messages based on event types for better user guidance
- **Roadshow UI/UX Finalization**: Complete professional interface with M&A workflow standards:
  - **Dynamic Status Dropdown**: Replaced static badges with interactive select menu (Live/En attente/No-go) with color-coded indicators
  - **Owner Display Enhancement**: Shows user initials instead of full names with inline edit capability for multi-assignment
  - **Enter Key Validation**: All date fields (Teaser/NDA/IM/BP) accept Enter key for instant save with toast confirmation
  - **Phase 2 Complete**: Proper conditional display of Dataroom and Binding offer date fields with Enter/blur validation
  - **Status Mapping**: Correct UI-to-database mapping (En attente → Waiting) with toast feedback for all status changes
- **Multi-Owner Assignment System**: Complete implementation of multi-assignation for roadshow counterparties:
  - **Junction Table**: Added roadshow_owner table for many-to-many relationship between counterparties and users
  - **Owner Assignment Modal**: Professional modal with checkbox selection, user search, and visual feedback with initials badges
  - **Transaction-Based Updates**: PATCH /roadshow/:counterpartyId/owners endpoint with atomic delete/insert operations
  - **Multi-Badge Display**: Shows multiple owner initials (ZD, AB, etc.) with inline edit button for real-time assignment changes
  - **Cache Invalidation**: Proper React Query cache management for seamless UI updates after owner modifications
- **Professional Table UX Redesign**: Complete overhaul of roadshow table with enhanced user experience:
  - **Expanded Column Spacing**: Increased padding from px-4 py-3 to px-6 py-4 for better readability and interaction space
  - **Enhanced Visual Hierarchy**: Gradient header background, alternating row colors, and improved hover states with blue accent colors
  - **Improved Interactive Elements**: Larger buttons with better hover states, color-coded status indicators with shadows, and professional badge styling
  - **Better Content Organization**: Centered alignment for action columns, improved badge displays for counters, and enhanced Phase 2 section with grouped inputs
  - **Professional Status Design**: Enhanced status dropdown with color-coded indicators and improved visual feedback for all interactive elements

The application follows a monorepo structure with shared TypeScript types and schemas, enabling type safety across the full stack while maintaining clear separation between client, server, and shared code.