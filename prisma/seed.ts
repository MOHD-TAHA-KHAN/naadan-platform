import { PrismaClient, Role } from "@prisma/client"
import bcrypt from "bcryptjs"
import dotenv from "dotenv"
dotenv.config()


const prisma = new PrismaClient()

async function main() {
  console.log("🌱 Seeding Naadan database...")

  const adminEmail = "admin@naadan.com"
  const hashed = await bcrypt.hash("Test12345", 10)

  const admin = await prisma.user.upsert({
    where: { email: adminEmail },
    update: { name: "Naadan Admin", password: hashed, role: Role.ADMIN },
    create: { email: adminEmail, name: "Naadan Admin", password: hashed, role: Role.ADMIN },
  })
  console.log(`👤 Admin: ${admin.email}`)

  const categoriesData = [
    {
      name: "Signature Biryanis",
      items: [
        {
          name: "Thalassery Mutton Dum Biryani",
          description: "Cooked in clay pot, fragrant short-grain Kaima rice, Malabar spices, pickled shallots.",
          price: 540,
          imageUrl: "https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?auto=format&fit=crop&w=800&q=80",
        },
        {
          name: "Kerala Chicken Biryani",
          description: "Kaima rice layered with slow-cooked chicken in coconut-based masala and fried onions.",
          price: 420,
          imageUrl: "https://images.unsplash.com/photo-1589301760014-d929f3979dbc?auto=format&fit=crop&w=800&q=80",
        },
      ],
    },
    {
      name: "Slow-Cooked Curries",
      items: [
        {
          name: "Alleppey Kingfish Curry",
          description: "Fresh Kingfish cuts simmered in freshly extracted coconut milk, tangy raw mango and kudampuli.",
          price: 480,
          imageUrl: "https://images.unsplash.com/photo-1626082927389-6cd097cdc6ec?auto=format&fit=crop&w=800&q=80",
        },
        {
          name: "Nadan Mutton Curry",
          description: "Slow-braised mutton in a rich dark coconut-shallot masala with crushed black pepper.",
          price: 460,
          imageUrl: "https://images.unsplash.com/photo-1544025162-d76694265947?auto=format&fit=crop&w=800&q=80",
        },
      ],
    },
    {
      name: "Malabar Breads & Appams",
      items: [
        {
          name: "Flaky Layered Malabar Parotta",
          description: "Hand-stretched, beaten, coiled and griddled with pure ghee — pair of 2.",
          price: 95,
          imageUrl: "https://images.unsplash.com/photo-1601050690597-df0568f70950?auto=format&fit=crop&w=800&q=80",
        },
        {
          name: "Lacy Kerala Appam",
          description: "Fermented rice batter hoppers with crispy golden edges and soft spongy centres.",
          price: 80,
          imageUrl: "https://images.unsplash.com/photo-1610057099443-fde8c4d50f91?auto=format&fit=crop&w=800&q=80",
        },
      ],
    },
    {
      name: "Kerala Starters",
      items: [
        {
          name: "Nadan Kozhi Roast",
          description: "Caramelised shallots, curry leaves, crushed pepper — dark-roasted country chicken.",
          price: 380,
          imageUrl: "https://images.unsplash.com/photo-1569050467447-ce54b3bbc37d?auto=format&fit=crop&w=800&q=80",
        },
        {
          name: "Kerala Beef Fry",
          description: "Tender slow-cooked beef with roasted coconut, curry leaves and whole spices.",
          price: 360,
          imageUrl: "https://images.unsplash.com/photo-1606491956689-2ea866880c84?auto=format&fit=crop&w=800&q=80",
        },
      ],
    },
    {
      name: "Traditional Desserts",
      items: [
        {
          name: "Palada Payasam",
          description: "Slow-simmered rice ada in reduced milk sweetened with jaggery and cardamom.",
          price: 120,
          imageUrl: "https://images.unsplash.com/photo-1551024601-bec78aea704b?auto=format&fit=crop&w=800&q=80",
        },
        {
          name: "Unniyappam",
          description: "Deep-fried jaggery rice balls with banana, coconut bits and sesame.",
          price: 90,
          imageUrl: "https://images.unsplash.com/photo-1558961363-fa8fdf82db35?auto=format&fit=crop&w=800&q=80",
        },
      ],
    },
  ]

  for (const cat of categoriesData) {
    const category = await prisma.category.upsert({
      where: { name: cat.name },
      update: {},
      create: { name: cat.name },
    })
    console.log(`📁 ${category.name}`)

    for (const item of cat.items) {
      const existing = await prisma.menuItem.findFirst({
        where: { name: item.name, categoryId: category.id },
      })
      if (!existing) {
        await prisma.menuItem.create({
          data: { ...item, categoryId: category.id, available: true },
        })
      }
    }
  }

  // Inventory items
  const inventoryItems = [
    { name: "Rice (Kaima)", unit: "kg", current: 50, buffer: 20, supplier: "Wayanad Rice Mills" },
    { name: "Chicken (Country)", unit: "kg", current: 30, buffer: 15, supplier: "Local Farms" },
    { name: "Mutton", unit: "kg", current: 25, buffer: 10, supplier: "Premium Meat House" },
    { name: "Coconut Oil", unit: "litres", current: 40, buffer: 15, supplier: "Kozhikode Oils" },
    { name: "Shallots", unit: "kg", current: 20, buffer: 8, supplier: "Vegetable Market" },
    { name: "Curry Leaves", unit: "bunches", current: 15, buffer: 5, supplier: "Local Gardens" },
    { name: "Ginger", unit: "kg", current: 10, buffer: 4, supplier: "Spice Market" },
    { name: "Garlic", unit: "kg", current: 12, buffer: 5, supplier: "Spice Market" },
    { name: "Turmeric Powder", unit: "kg", current: 8, buffer: 3, supplier: "Spice Market" },
    { name: "Black Pepper", unit: "kg", current: 6, buffer: 2, supplier: "Wayanad Spices" },
  ]

  for (const item of inventoryItems) {
    await prisma.inventoryItem.upsert({
      where: { name: item.name },
      update: {
        unit: item.unit,
        current: item.current,
        buffer: item.buffer,
        supplier: item.supplier,
        status: item.current === 0 ? "OUT_OF_STOCK" : item.current < item.buffer ? "CRITICAL" : item.current < item.buffer * 1.5 ? "LOW_STOCK" : "IN_STOCK",
      },
      create: {
        ...item,
        status: item.current === 0 ? "OUT_OF_STOCK" : item.current < item.buffer ? "CRITICAL" : item.current < item.buffer * 1.5 ? "LOW_STOCK" : "IN_STOCK",
      },
    })
  }
  console.log("📦 Inventory items seeded")

  console.log("✅ Seed complete.")
}

main()
  .catch((e) => { console.error(e); process.exit(1) })
  .finally(() => prisma.$disconnect())
