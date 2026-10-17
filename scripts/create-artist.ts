import { prisma } from "@/lib/prisma";

async function main() {
  const artist = await prisma.artist.create({
    data: {
      name: "بهار رستمی",
      slug: "bahar",
      phone: "09150000000",
    },
  });

  console.log("Artist created:", artist);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
