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

  console.log("✅ Seed complete.")
}

main()
  .catch((e) => { console.error(e); process.exit(1) })
  .finally(() => prisma.$disconnect())
