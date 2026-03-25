import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import db, { initDb } from "./db.ts";

async function startServer() {
  initDb();
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // Auth Routes
  app.post("/api/auth/login", (req, res) => {
    const { username, password } = req.body;
    const admin = db.prepare('SELECT * FROM admins WHERE username = ? AND password = ?').get(username, password) as any;
    if (admin) {
      res.json({ success: true, user: { id: admin.id, username: admin.username } });
    } else {
      res.status(401).json({ success: false, message: "Invalid credentials" });
    }
  });

  app.post("/api/auth/register", (req, res) => {
    const { username, password } = req.body;
    try {
      const result = db.prepare('INSERT INTO admins (username, password) VALUES (?, ?)').run(username, password);
      res.json({ success: true, id: result.lastInsertRowid });
    } catch (error: any) {
      if (error.code === 'SQLITE_CONSTRAINT_UNIQUE') {
        res.status(400).json({ success: false, message: "Username already exists" });
      } else {
        res.status(500).json({ success: false, message: "Server error" });
      }
    }
  });

  // API Routes
  app.get("/api/stats", (req, res) => {
    const hotels = db.prepare('SELECT COUNT(*) as count FROM hotels').get() as any;
    const rooms = db.prepare('SELECT COUNT(*) as count FROM rooms').get() as any;
    const bookings = db.prepare('SELECT COUNT(*) as count FROM bookings').get() as any;
    const guests = db.prepare('SELECT COUNT(*) as count FROM guests').get() as any;
    
    res.json({
      hotels: hotels.count,
      rooms: rooms.count,
      bookings: bookings.count,
      guests: guests.count
    });
  });

  app.get("/api/hotels", (req, res) => {
    const hotels = db.prepare('SELECT * FROM hotels').all();
    res.json(hotels);
  });

  app.get("/api/rooms", (req, res) => {
    const rooms = db.prepare('SELECT r.*, h.name as hotel_name FROM rooms r JOIN hotels h ON r.hotel_id = h.id').all();
    res.json(rooms);
  });

  app.get("/api/bookings", (req, res) => {
    const bookings = db.prepare(`
      SELECT b.*, g.name as guest_name, r.type as room_type, h.name as hotel_name 
      FROM bookings b 
      JOIN guests g ON b.guest_id = g.id 
      JOIN rooms r ON b.room_id = r.id
      JOIN hotels h ON r.hotel_id = h.id
    `).all();
    res.json(bookings);
  });

  app.get("/api/download-sql", (req, res) => {
    const sql = `
-- Hotel Booking System SQL Export
-- Generated on ${new Date().toISOString()}

CREATE TABLE hotels (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  location TEXT NOT NULL
);

CREATE TABLE rooms (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  hotel_id INTEGER NOT NULL,
  type TEXT NOT NULL,
  price REAL NOT NULL,
  FOREIGN KEY (hotel_id) REFERENCES hotels (id)
);

CREATE TABLE guests (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  phone TEXT NOT NULL,
  email TEXT
);

CREATE TABLE bookings (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  guest_id INTEGER NOT NULL,
  room_id INTEGER NOT NULL,
  check_in DATE NOT NULL,
  check_out DATE NOT NULL,
  total_price REAL NOT NULL,
  FOREIGN KEY (guest_id) REFERENCES guests (id),
  FOREIGN KEY (room_id) REFERENCES rooms (id)
);

CREATE TABLE staff (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  hotel_id INTEGER NOT NULL,
  name TEXT NOT NULL,
  role TEXT NOT NULL,
  salary REAL NOT NULL,
  FOREIGN KEY (hotel_id) REFERENCES hotels (id)
);

CREATE TABLE payments (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  booking_id INTEGER NOT NULL,
  amount REAL NOT NULL,
  payment_date DATETIME DEFAULT CURRENT_TIMESTAMP,
  method TEXT NOT NULL,
  FOREIGN KEY (booking_id) REFERENCES bookings (id)
);

-- Sample Data
INSERT INTO hotels (name, location) VALUES ('Grand Horizon Resort', 'Maldives');
INSERT INTO hotels (name, location) VALUES ('Skyline Suites', 'New York');
INSERT INTO rooms (hotel_id, type, price) VALUES (1, 'Deluxe Ocean View', 450);
INSERT INTO rooms (hotel_id, type, price) VALUES (1, 'Presidential Villa', 1200);
INSERT INTO rooms (hotel_id, type, price) VALUES (2, 'Executive Suite', 350);
`;
    res.setHeader('Content-Type', 'application/sql');
    res.setHeader('Content-Disposition', 'attachment; filename=hotel_booking_system.sql');
    res.send(sql);
  });

  app.get("/api/guests", (req, res) => {
    const guests = db.prepare('SELECT * FROM guests').all();
    res.json(guests);
  });

  app.get("/api/staff", (req, res) => {
    const staff = db.prepare('SELECT s.*, h.name as hotel_name FROM staff s JOIN hotels h ON s.hotel_id = h.id').all();
    res.json(staff);
  });

  app.post("/api/staff", (req, res) => {
    const { hotel_id, name, role, salary } = req.body;
    try {
      const result = db.prepare('INSERT INTO staff (hotel_id, name, role, salary) VALUES (?, ?, ?, ?)').run(hotel_id, name, role, salary);
      res.json({ success: true, id: result.lastInsertRowid });
    } catch (error) {
      res.status(500).json({ success: false, message: "Failed to add staff" });
    }
  });

  app.get("/api/payments", (req, res) => {
    const payments = db.prepare('SELECT p.*, b.guest_id, g.name as guest_name FROM payments p JOIN bookings b ON p.booking_id = b.id JOIN guests g ON b.guest_id = g.id').all();
    res.json(payments);
  });

  app.post("/api/hotels", (req, res) => {
    const { name, location } = req.body;
    try {
      const result = db.prepare('INSERT INTO hotels (name, location) VALUES (?, ?)').run(name, location);
      res.json({ success: true, id: result.lastInsertRowid });
    } catch (error) {
      res.status(500).json({ success: false, message: "Failed to add hotel" });
    }
  });

  app.post("/api/rooms", (req, res) => {
    const { hotel_id, type, price } = req.body;
    try {
      const result = db.prepare('INSERT INTO rooms (hotel_id, type, price) VALUES (?, ?, ?)').run(hotel_id, type, price);
      res.json({ success: true, id: result.lastInsertRowid });
    } catch (error) {
      res.status(500).json({ success: false, message: "Failed to add room" });
    }
  });

  app.post("/api/guests", (req, res) => {
    const { name, phone, email } = req.body;
    try {
      const result = db.prepare('INSERT INTO guests (name, phone, email) VALUES (?, ?, ?)').run(name, phone, email);
      res.json({ success: true, id: result.lastInsertRowid });
    } catch (error) {
      res.status(500).json({ success: false, message: "Failed to add guest" });
    }
  });

  app.get("/api/receipt/:id", (req, res) => {
    const { id } = req.params;
    const booking = db.prepare(`
      SELECT b.*, g.name as guest_name, g.email as guest_email, r.type as room_type, h.name as hotel_name 
      FROM bookings b 
      JOIN guests g ON b.guest_id = g.id 
      JOIN rooms r ON b.room_id = r.id 
      JOIN hotels h ON r.hotel_id = h.id 
      WHERE b.id = ?
    `).get(id) as any;

    if (!booking) return res.status(404).send("Booking not found");

    const receipt = `
========================================
       GRAND HORIZON HOTEL RECEIPT
========================================
Booking ID: ${booking.id}
Date: ${new Date().toLocaleDateString()}

GUEST INFORMATION
Name: ${booking.guest_name}
Email: ${booking.guest_email}

HOTEL INFORMATION
Hotel: ${booking.hotel_name}
Room Type: ${booking.room_type}

STAY DETAILS
Check-In: ${booking.check_in}
Check-Out: ${booking.check_out}

TOTAL AMOUNT: $${booking.total_price}
========================================
Thank you for staying with us!
========================================
    `;

    res.setHeader('Content-Type', 'text/plain');
    res.setHeader('Content-Disposition', `attachment; filename=receipt_${id}.txt`);
    res.send(receipt);
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
