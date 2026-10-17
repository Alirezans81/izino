import { prisma } from "@/lib/prisma";

async function main() {
  const artist = await prisma.artist.findUnique({
    where: { slug: "bahar" },
  });

  if (!artist) {
    throw new Error("Artist not found");
  }

  const services = [
    {
      name: "رنگ و هایلایت",
      description: "رنگ مو و هایلایت",
      duration: 120,
      price: 1500000,
    },
    {
      name: "کراتین",
      description: "احیا و صافی مو",
      duration: 180,
      price: 2500000,
    },
    {
      name: "فر دائم",
      description: "فر دائم مو",
      duration: 150,
      price: 1800000,
    },
  ];

  for (const service of services) {
    const created = await prisma.service.create({
      data: {
        ...service,
        artistId: artist.id,
      },
    });

    console.log("Service created:", created.name);
  }
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
