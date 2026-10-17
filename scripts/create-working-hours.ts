import { prisma } from "@/lib/prisma";

async function main() {
  const artist = await prisma.artist.findUnique({
    where: { slug: "bahar" },
  });

  if (!artist) {
    throw new Error("Artist not found");
  }

  const workingHours = [
    { dayOfWeek: 0, startTime: "09:00", endTime: "18:00" },
    { dayOfWeek: 1, startTime: "09:00", endTime: "18:00" },
    { dayOfWeek: 2, startTime: "09:00", endTime: "18:00" },
    { dayOfWeek: 3, startTime: "09:00", endTime: "18:00" },
    { dayOfWeek: 4, startTime: "09:00", endTime: "18:00" },
  ];

  for (const hours of workingHours) {
    await prisma.workingHour.upsert({
      where: {
        artistId_dayOfWeek: {
          artistId: artist.id,
          dayOfWeek: hours.dayOfWeek,
        },
      },
      update: {
        startTime: hours.startTime,
        endTime: hours.endTime,
      },
      create: {
        ...hours,
        artistId: artist.id,
      },
    });
  }

  console.log("Working hours saved");
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
