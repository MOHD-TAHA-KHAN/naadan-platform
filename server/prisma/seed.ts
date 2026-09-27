import { PrismaClient, Role } from "@prisma/client"
import bcrypt from "bcryptjs"
import dotenv from "dotenv"
import fs from "fs"
import path from "path"

// Load .env from server folder or root folder
dotenv.config({ path: path.resolve(process.cwd(), ".env") })
dotenv.config({ path: path.resolve(process.cwd(), "..", ".env") })

const prisma = new PrismaClient()



// Helper to find the best matching image in a folder
function findBestImageMatch(categoryFolder: string, itemName: string): string | null {
  const dirPath = path.join(process.cwd(), "..", "client", "public", "Catalogue image", categoryFolder);
  
  if (itemName === "PAYASAM OF THE DAY") return "/Catalogue image/Payasam of the Day.png";

  if (!fs.existsSync(dirPath)) {
    console.warn(`⚠️ Folder missing: ${categoryFolder}`);
    return null;
  }

  const files = fs.readdirSync(dirPath).filter(f => f.match(/\.(jpg|jpeg|png)$/i));
  if (files.length === 0) return null;

  // Since your files are named perfectly (e.g., "Egg Roast Pothichoru.jpg"), try an exact match first
  const exactMatch = files.find(f => f.toLowerCase().includes(itemName.toLowerCase()));
  if (exactMatch) return `/Catalogue image/${categoryFolder}/${exactMatch}`;

  // Fallback to Fuzzy Match if exact match fails
  const itemWords = itemName.toLowerCase().replace(/[^a-z0-9]/g, ' ').split(' ').filter(w => w.length > 2);
  let bestMatch = files[0];
  let highestScore = 0;

  for (const file of files) {
    const fileWords = file.toLowerCase().replace(/[^a-z0-9]/g, ' ').split(' ').filter(w => w.length > 2);
    const score = itemWords.filter(word => fileWords.includes(word)).length;
    
    if (score > highestScore) {
      highestScore = score;
      bestMatch = file;
    }
  }

  return `/Catalogue image/${categoryFolder}/${bestMatch}`;
}

async function main() {
  console.log("🌱 Seeding Naadan database with dynamic images...")

  const adminEmail = "admin@naadan.com"
  const hashed = await bcrypt.hash("Test12345", 10)

  await prisma.user.upsert({
    where: { email: adminEmail },
    update: { name: "Naadan Admin", password: hashed, role: Role.ADMIN },
    create: { email: adminEmail, name: "Naadan Admin", password: hashed, role: Role.ADMIN },
  })

  const categoriesData = [
    {
      name: "Naadan Special Rolls",
      items: [
        { name: "Naadan Chicken Roll", price: 119 },
        { name: "Naadan Egg Roll", price: 99 },
      ]
    },
    {
      name: "Kizhi Specials",
      items: [
        { name: "NAADAN Special Chicken Kizhi Parotta", price: 299 },
        { name: "Chicken Kizhi Parotha", price: 239 },
        { name: "Thattukada Chicken Pothi Parotta", price: 259 },
        { name: "Pepper Chicken Kizhi Parotta", price: 289 },
        { name: "Egg Roast Kizhi Parotta", price: 259 },
        { name: "Paneer Roast Kizhi Parotta", price: 269 },
        { name: "Chicken Roast Kizhi Dosa", price: 259 },
        { name: "Egg Roast Kizhi Dosa", price: 249 },
      ]
    },
    {
      name: "Kerala Meals",
      items: [
        { name: "Kerala Chicken Feast", price: 459 },
        { name: "Kerala Fish Feast", price: 459 },
        { name: "Kerala Egg Feast", price: 429 },
        { name: "Kerala Veg Feast", price: 429 },
      ]
    },
    {
      name: "Mini meals",
      items: [
        { name: "Kerala Chicken Mini Meal", price: 299 },
        { name: "Kerala Fish Mini Meal", price: 299 },
        { name: "Kerala Egg Mini Meal", price: 279 },
        { name: "Kerala Veg Mini Meal", price: 279 },
      ]
    },
    {
      name: "Pothichoru",
      items: [
        { name: "Chicken Fry Pothichoru", price: 319 },
        { name: "Fish Fry Pothichoru", price: 319 },
        { name: "Egg Roast Pothichoru", price: 299 },
        { name: "Veg Pothichoru", price: 299 },
      ]
    },
    {
      name: "Chatti Specials",
      items: [
        { name: "Chicken Chatti Choru", price: 449 },
        { name: "Fish Chatti Dosa", price: 449 },
        { name: "Chicken & Fish Chatti Dosa", price: 489 },
      ]
    },
    {
      name: "Malabar Parotta Combo's",
      items: [
        { name: "Chicken Chukka & Malabar Parotta", price: 249 },
        { name: "Kerala Fish Curry & Malabar Parotta", price: 249 },
        { name: "Egg Roast & Malabar Parotta", price: 239 },
      ]
    },
    {
      name: "Ghee Garlic Dosa Combo's",
      items: [
        { name: "Ghee Garlic Dosa & Chicken Roast", price: 249 },
        { name: "Ghee Garlic Dosa & Kerala Fish Curry", price: 249 },
      ]
    },
    {
      name: "Ghee Rice Combo's",
      items: [
        { name: "Ghee Rice & Naadan Chicken Curry", price: 299 },
        { name: "Ghee Rice & Chicken Chukka", price: 299 },
      ]
    },
    {
      name: "Tiffin Meal",
      items: [
        { name: "Kerala Chicken Tiffin Box", price: 279 },
        { name: "Kerala Egg Tiffin Box", price: 249 },
      ]
    },
    {
      name: "Kanji Meals",
      items: [
        { name: "Chicken Fry Kanji Meal", price: 349 },
        { name: "Kerala Kanji Meal", price: 299 },
      ]
    },
    {
      name: "Starters",
      items: [
        { name: "Thattukada Chicken Fry (Half)", price: 249 },
        { name: "Thattukada Chicken Fry (Full)", price: 499 },
        { name: "Chicken 65 (Half)", price: 249 },
        { name: "Chicken 65 (Full)", price: 499 },
        { name: "Garlic Chicken Fry (Full)", price: 499 },
        { name: "Kerala Fish Fry (Full)", price: 499 },
        { name: "Promfret Fry", price: 349 },
      ]
    },
    {
      name: "Kerala Curries & Classics",
      items: [
        { name: "Naadan Chicken Curry (Full)", price: 399 },
        { name: "Chicken Chettinad (Full)", price: 399 },
        { name: "Chicken Ghee Roast (Full)", price: 399 },
        { name: "Chicken Kondattam (Full)", price: 399 },
        { name: "Kerala Fish Curry (Full)", price: 399 },
        { name: "Paneer Chukka (Full)", price: 369 },
        { name: "Kerala Vegetable Stew (Full)", price: 399 },
      ]
    },
    {
      name: "Family Packs",
      items: [
        { name: "Chicken Curry Family Pack", price: 499 },
        { name: "Kerala Fish Curry Family Pack", price: 529 },
        { name: "Kerala Egg Curry Family Pack", price: 449 },
      ]
    },
    {
      name: "Rice & Breads",
      items: [
        { name: "Kerala Ghee Rice", price: 129 },
        { name: "Kerala Matta Rice", price: 99 },
        { name: "Steamed Rice", price: 79 },
        { name: "Malabar Parotta", price: 29 },
        { name: "Plain Dosa", price: 25 },
        { name: "Roasted Chapati", price: 16 },
        { name: "PAYASAM OF THE DAY", price: 99 },
        { name: "ADA PRADHAMAN", price: 99 },
      ]
    }
  ]

  // Clear dependent tables first to prevent foreign key errors
await prisma.review.deleteMany()
await prisma.orderItem.deleteMany()
await prisma.order.deleteMany()
await prisma.cartItem.deleteMany()
await prisma.menuItem.deleteMany()
await prisma.category.deleteMany()
  
  for (const cat of categoriesData) {
    const category = await prisma.category.create({ data: { name: cat.name } })
    
    for (const item of cat.items) {
      const resolvedImage = findBestImageMatch(cat.name, item.name);

      await prisma.menuItem.create({
        data: {
          name: item.name,
          price: item.price,
          imageUrl: resolvedImage,
          available: true,
          categoryId: category.id,
        },
      })
    }
  }
  
  console.log("🍽️ Menu items successfully seeded with local images!")
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })