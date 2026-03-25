import betterSqlite3 from 'better-sqlite3';
import path from 'path';

const db = new betterSqlite3('hotel.db');

export function initDb() {
  db.exec(`
    CREATE TABLE IF NOT EXISTS admins (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT UNIQUE NOT NULL,
      password TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS hotels (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      location TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS rooms (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      hotel_id INTEGER NOT NULL,
      type TEXT NOT NULL,
      price REAL NOT NULL,
      FOREIGN KEY (hotel_id) REFERENCES hotels (id)
    );

    CREATE TABLE IF NOT EXISTS guests (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      phone TEXT NOT NULL,
      email TEXT
    );

    CREATE TABLE IF NOT EXISTS bookings (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      guest_id INTEGER NOT NULL,
      room_id INTEGER NOT NULL,
      check_in DATE NOT NULL,
      check_out DATE NOT NULL,
      total_price REAL NOT NULL,
      FOREIGN KEY (guest_id) REFERENCES guests (id),
      FOREIGN KEY (room_id) REFERENCES rooms (id)
    );

    CREATE TABLE IF NOT EXISTS staff (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      hotel_id INTEGER NOT NULL,
      name TEXT NOT NULL,
      role TEXT NOT NULL,
      salary REAL NOT NULL,
      FOREIGN KEY (hotel_id) REFERENCES hotels (id)
    );

    CREATE TABLE IF NOT EXISTS payments (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      booking_id INTEGER NOT NULL,
      amount REAL NOT NULL,
      payment_date DATETIME DEFAULT CURRENT_TIMESTAMP,
      method TEXT NOT NULL,
      FOREIGN KEY (booking_id) REFERENCES bookings (id)
    );
  `);

  // Seed data if empty
  const adminCount = db.prepare('SELECT COUNT(*) as count FROM admins').get() as { count: number };
  if (adminCount.count === 0) {
    db.prepare('INSERT INTO admins (username, password) VALUES (?, ?)').run('admin', 'admin');
  }

  const hotelCount = db.prepare('SELECT COUNT(*) as count FROM hotels').get() as { count: number };
  if (hotelCount.count === 0) {
    db.prepare('INSERT INTO hotels (name, location) VALUES (?, ?)').run('Grand Horizon Resort', 'Maldives');
    db.prepare('INSERT INTO hotels (name, location) VALUES (?, ?)').run('Skyline Suites', 'New York');
    
    db.prepare('INSERT INTO rooms (hotel_id, type, price) VALUES (?, ?, ?)').run(1, 'Deluxe Ocean View', 450);
    db.prepare('INSERT INTO rooms (hotel_id, type, price) VALUES (?, ?, ?)').run(1, 'Presidential Villa', 1200);
    db.prepare('INSERT INTO rooms (hotel_id, type, price) VALUES (?, ?, ?)').run(2, 'Executive Suite', 350);
    
    db.prepare('INSERT INTO guests (name, phone, email) VALUES (?, ?, ?)').run('John Doe', '+123456789', 'john@example.com');
    db.prepare('INSERT INTO staff (hotel_id, name, role, salary) VALUES (?, ?, ?, ?)').run(1, 'Alice Smith', 'Manager', 5000);
  }
}

export default db;
