import { inArray } from "drizzle-orm";
import { env } from "../config/env.js";
import { hashPassword } from "../utils/password.js";
import { db, pool } from "./index.js";
import { customers, products, users } from "./schema/index.js";

// Development-only credentials, documented in the README
const ADMIN_EMAIL = "admin@example.com";
const ADMIN_PASSWORD = "admin123";

const seedProducts = [
  { productCode: "PRD001", name: "Mechanical Keyboard", price: 750_000n, stock: 25 },
  { productCode: "PRD002", name: "Wireless Mouse", price: 185_000n, stock: 40 },
  { productCode: "PRD003", name: "27-inch Monitor", price: 2_850_000n, stock: 10 },
  { productCode: "PRD004", name: "USB-C Hub 7-in-1", price: 325_000n, stock: 30 },
  { productCode: "PRD005", name: "Laptop Stand", price: 210_000n, stock: 35 },
  { productCode: "PRD006", name: "Noise Cancelling Headphones", price: 1_450_000n, stock: 12 },
  { productCode: "PRD007", name: "Webcam 1080p", price: 495_000n, stock: 20 },
  { productCode: "PRD008", name: "External SSD 1TB", price: 1_299_000n, stock: 15 },
  { productCode: "PRD009", name: "Mouse Pad XL", price: 95_000n, stock: 50 },
  { productCode: "PRD010", name: "Bluetooth Speaker", price: 560_000n, stock: 18 },
  { productCode: "PRD011", name: "HDMI Cable 2m", price: 65_000n, stock: 60 },
  { productCode: "PRD012", name: "Ergonomic Office Chair", price: 3_200_000n, stock: 5 },
  { productCode: "PRD013", name: "Desk Lamp LED", price: 175_000n, stock: 22 },
  { productCode: "PRD014", name: "Portable Charger 20000mAh", price: 289_000n, stock: 3 },
  { productCode: "PRD015", name: "Graphics Tablet", price: 980_000n, stock: 0 },
];

const seedCustomers = [
  { name: "Budi Santoso", email: "budi.santoso@example.com", phone: "081234567801", address: "Jl. Merdeka No. 10, Jakarta Pusat" },
  { name: "Siti Rahmawati", email: "siti.rahmawati@example.com", phone: "081234567802", address: "Jl. Asia Afrika No. 25, Bandung" },
  { name: "Andi Wijaya", email: "andi.wijaya@example.com", phone: "081234567803", address: "Jl. Pemuda No. 5, Surabaya" },
  { name: "Dewi Lestari", email: "dewi.lestari@example.com", phone: "081234567804", address: "Jl. Malioboro No. 12, Yogyakarta" },
  { name: "Rizky Pratama", email: "rizky.pratama@example.com", phone: "081234567805", address: "Jl. Gajah Mada No. 8, Semarang" },
  { name: "Nur Aisyah", email: "nur.aisyah@example.com", phone: "081234567806", address: "Jl. Sudirman No. 40, Medan" },
  { name: "Agus Setiawan", email: "agus.setiawan@example.com", phone: "081234567807", address: "Jl. Diponegoro No. 3, Denpasar" },
  { name: "Maya Putri", email: "maya.putri@example.com", phone: "081234567808", address: "Jl. Pahlawan No. 17, Malang" },
  { name: "Fajar Hidayat", email: "fajar.hidayat@example.com", phone: null, address: "Jl. Ahmad Yani No. 21, Makassar" },
  { name: "Rina Kurniawati", email: "rina.kurniawati@example.com", phone: "081234567810", address: null },
];

async function seed() {
  if (env.NODE_ENV === "production") {
    throw new Error("Seeder must not run in production");
  }

  const adminPasswordHash = await hashPassword(ADMIN_PASSWORD);

  await db.transaction(async (tx) => {
    const insertedAdmins = await tx
      .insert(users)
      .values({ name: "Administrator", email: ADMIN_EMAIL, password: adminPasswordHash })
      .onConflictDoNothing({ target: users.email })
      .returning({ id: users.id });

    const insertedProducts = await tx
      .insert(products)
      .values(seedProducts)
      .onConflictDoNothing({ target: products.productCode })
      .returning({ id: products.id });

    // Customers have no unique column, so skip the ones already seeded by email
    const seedEmails = seedCustomers.map((customer) => customer.email);
    const existingCustomers = await tx
      .select({ email: customers.email })
      .from(customers)
      .where(inArray(customers.email, seedEmails));
    const existingEmails = new Set(existingCustomers.map((customer) => customer.email));
    const newCustomers = seedCustomers.filter((customer) => !existingEmails.has(customer.email));

    if (newCustomers.length > 0) {
      await tx.insert(customers).values(newCustomers);
    }

    console.log(`Users inserted: ${insertedAdmins.length}`);
    console.log(`Products inserted: ${insertedProducts.length}`);
    console.log(`Customers inserted: ${newCustomers.length}`);
  });
}

try {
  await seed();
  console.log("Seeding completed");
} catch (error) {
  console.error("Seeding failed:", error);
  process.exitCode = 1;
} finally {
  await pool.end();
}
