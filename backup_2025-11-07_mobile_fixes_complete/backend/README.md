# Bignor Park Fishing App - Backend API

Express.js REST API with PostgreSQL database for managing fishing bookings.

## 🚀 Quick Start

### Prerequisites
- Node.js 16+ installed
- PostgreSQL database (Neon recommended)
- npm or yarn

### 1. Install Dependencies
```bash
npm install
```

### 2. Configure Environment
Create a `.env` file in this directory (copy from `../.env.example`):
```env
DATABASE_URL=postgresql://...
JWT_SECRET=your_secret_key
FISHING_CODE=1187
PORT=3000
NODE_ENV=development
```

### 3. Test Database Connection
```bash
npm test
```

### 4. Start Server
```bash
npm start
```

Or with auto-reload for development:
```bash
npm run dev
```

The server will start on http://localhost:3000

## 📡 API Endpoints

### Health Check
```
GET /api/health
```

### Authentication
```
POST /api/auth/signup
POST /api/auth/login
POST /api/auth/admin-login
GET  /api/auth/me
POST /api/auth/logout
```

### Bookings
```
POST   /api/bookings
GET    /api/bookings/my
GET    /api/bookings/active
GET    /api/bookings/:id
DELETE /api/bookings/:id
GET    /api/bookings/check-availability/:lakeId/:date
```

### Lakes
```
GET /api/lakes
GET /api/lakes/:id
GET /api/lakes/:id/availability/:date
```

### Users
```
GET /api/users/profile
PUT /api/users/profile
PUT /api/users/password
```

### Admin (requires admin privileges)
```
GET    /api/admin/bookings
GET    /api/admin/bookings/stats
DELETE /api/admin/bookings/:id
GET    /api/admin/users
GET    /api/admin/users/:id
PUT    /api/admin/users/:id
POST   /api/admin/users
POST   /api/admin/expire-bookings
GET    /api/admin/dashboard
```

## 🗂️ Project Structure

```
backend/
├── server.js              # Main server file
├── database.js            # Database connection & queries
├── middleware/
│   └── auth.js           # JWT authentication middleware
├── routes/
│   ├── auth.js           # Authentication routes
│   ├── bookings.js       # Booking management routes
│   ├── lakes.js          # Lake information routes
│   ├── users.js          # User profile routes
│   └── admin.js          # Admin-only routes
├── package.json
└── README.md
```

## 🔒 Authentication

All protected endpoints require JWT token in Authorization header:
```
Authorization: Bearer <token>
```

Token is obtained from login/signup endpoints and expires after 7 days (configurable).

## 🧪 Testing

Test database connection:
```bash
npm test
```

Test specific endpoint with curl:
```bash
# Health check
curl http://localhost:3000/api/health

# Login
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"user@example.com","password":"pass123","fishingCode":"1187"}'
```

## 📝 Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `DATABASE_URL` | PostgreSQL connection string | Required |
| `JWT_SECRET` | Secret key for JWT tokens | Required |
| `JWT_EXPIRES_IN` | Token expiration time | 7d |
| `FISHING_CODE` | Member signup/login code | FISH2024 |
| `PORT` | Server port | 3000 |
| `NODE_ENV` | Environment | development |
| `FRONTEND_URL` | Frontend URL for CORS | * |

## 🐛 Debugging

Enable debug logs:
```bash
DEBUG=* npm start
```

Check logs:
```bash
npm start 2>&1 | tee server.log
```

## 📊 Database

The API uses PostgreSQL with the following tables:
- `users` - User accounts (admin and members)
- `lakes` - Fishing lakes/pools
- `bookings` - Fishing session bookings

Schema is in `../schema.sql`

## 🔧 Maintenance

### Expire old bookings
This should be run periodically (daily recommended):
```bash
curl -X POST http://localhost:3000/api/admin/expire-bookings \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN"
```

Or set up a cron job to automate it.

### View logs
If using PM2:
```bash
pm2 logs bignor-api
```

## 🚀 Deployment

See `../DEPLOYMENT_GUIDE.md` for detailed deployment instructions.

Quick deploy to Render:
1. Push to GitHub
2. Connect repository to Render
3. Set root directory to `backend`
4. Add environment variables
5. Deploy!

## 📞 Support

- Main documentation: `../BACKEND_SETUP_COMPLETE.md`
- Deployment guide: `../DEPLOYMENT_GUIDE.md`
- Database schema: `../schema.sql`

## License

MIT

