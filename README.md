# 🏆 Auction Bidding System

Real-time auction platform with React, Node.js, Express, MySQL, and Socket.IO.

## ✨ Features

- ⚡ Real-time bidding with WebSocket
- 🔒 Vendor bid locking
- ⏰ Auto-expiry with winner assignment
- � Customer tracking (bid history, wins, stats)
- 🎨 Responsive UI with Tailwind CSS
- 🔐 JWT authentication with UUID support

## 🛠️ Tech Stack

**Frontend:** React, Vite, Tailwind CSS, Socket.IO Client  
**Backend:** Node.js, Express, Socket.IO, JWT, node-cron  
**Database:** MySQL 8  
**Storage:** AWS S3

## 🚀 Quick Start

### Prerequisites
- Node.js (v16+)
- MySQL (v8+)
- AWS S3 account

### Installation

```bash
# Clone repository
git clone https://github.com/YOUR_USERNAME/auction-bidding-system.git
cd auction-bidding-system

# Setup Backend
cd backend
npm install
cp .env.example .env  # Edit with your credentials

# Setup Frontend
cd ../frontend
npm install

# Setup Database
mysql -u root -p
CREATE DATABASE auction_db;
USE auction_db;
SOURCE database_setup.sql;
exit;

# Run Application
# Terminal 1 - Backend
cd backend
npm start

# Terminal 2 - Frontend
cd frontend
npm run dev
```

Access: http://localhost:5173

## 📁 Structure

```
├── backend/          # Express server, API routes
├── frontend/         # React app
└── database_setup.sql
```

##  Environment Variables

**Backend (.env):**
```env
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=your_password
DB_NAME=auction_db
JWT_SECRET=your_jwt_secret
PORT=3000
```

## 📄 License

MIT License - see [LICENSE](LICENSE)

## 👨‍💻 Author

**Ayush Mohite**  
ayush.17740@sakec.ac.in

---

Built with ❤️ using React, Node.js, Express, MySQL, and Socket.IO
