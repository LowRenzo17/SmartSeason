# SmartSeason - Agri-Intelligence Dashboard

SmartSeason is an agricultural tech operational dashboard designed for farm managers and field agents to seamlessly monitor, track, and manage crop fields. The platform emphasizes a modern, responsive "Agro-Modernist" aesthetic combined with real-time tracking, environmental data, and robust role-based access control.

## Key Features

- **Role-Based Access Control**: Strict segregation between Administrators (who manage infrastructure, seed databases, and assign agents) and Field Agents (who update field status and log activities).
- **Live Telemetry & Environmental Data**: Integrates live localized weather API data (Open-Meteo) alongside dynamic simulated Soil Intelligence (Moisture, pH, Nitrogen levels).
- **Field Inventory Management**: Robust tracking of fields including planting date, crop type, lifecycle stages (Planted, Growing, Ready, Harvested), and automated risk statuses (Active, At Risk, Completed).
- **Activity Logging**: Track all actions chronologically to ensure traceability and operational accountability.
- **AI Crop Diagnosis**: Upload crop images, record symptoms, receive disease/remedy guidance, and save diagnosis history per field. Works in demo-assist mode by default and can use OpenAI vision when `OPENAI_API_KEY` is configured.
- **Data Portability**: Instantly export comprehensive field histories or global field inventories into CSV formats.
- **Secure By Default**: Hardened against vulnerabilities with rigorous ID validations, Helmet headers, Rate Limiting, and JWT token authentication.

## Tech Stack

### Frontend
- **Framework**: React 18 with Vite
- **Styling**: Tailwind CSS (with custom color palettes tailored for agricultural apps)
- **Routing**: React Router DOM
- **Icons**: Lucide React
- **HTTP Client**: Axios

### Backend
- **Framework**: Node.js & Express.js
- **Database**: PostgreSQL
- **ORM**: Prisma
- **Authentication**: JWT & Cookie-Parser
- **Security**: Helmet & Express Rate Limiting

## Setup Instructions

### Prerequisites
- Node.js (v18+)
- PostgreSQL installed and running

### 1. Database Setup
Ensure PostgreSQL is running, then create a local database.

```bash
# In the /backend directory
npm install
npx prisma db push
npm run seed  # Populates Kenyan agricultural demo data
```

### 2. Running the Application
Open two terminal windows:

**Terminal 1 (Backend):**
```bash
cd backend
npm run dev
```

**Terminal 2 (Frontend):**
```bash
cd frontend
npm install
npm run dev
```

Navigate to `http://localhost:5173` to access the application.

## Demo Credentials
*Admin Account:* `admin` / `admin123`
*Agent Account:* `agent1` / `agent123`

## License
MIT License
