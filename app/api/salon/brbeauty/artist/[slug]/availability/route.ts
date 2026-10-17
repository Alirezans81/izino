import { prisma } from "@/lib/prisma";
import { NextRequest } from "next/server";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> },
) {
  try {
    const { slug } = await params;

    const searchParams = request.nextUrl.searchParams;
    const serviceId = searchParams.get("serviceId");
    const dateString = searchParams.get("date");

    if (!serviceId || !dateString) {
      return Response.json(
        { message: "serviceId و date الزامی هستند." },
        { status: 400 },
      );
    }

    // Validate the requested Gregorian date (YYYY-MM-DD)
    if (!/^\d{4}-\d{2}-\d{2}$/.test(dateString)) {
      return Response.json(
        { message: "فرمت تاریخ معتبر نیست." },
        { status: 400 },
      );
    }

    const [year, month, day] = dateString.split("-").map(Number);
    const date = new Date(Date.UTC(year, month - 1, day));

    if (
      date.getUTCFullYear() !== year ||
      date.getUTCMonth() !== month - 1 ||
      date.getUTCDate() !== day
    ) {
      return Response.json(
        { message: "تاریخ واردشده معتبر نیست." },
        { status: 400 },
      );
    }

    const artist = await prisma.artist.findUnique({
      where: { slug },
      select: { id: true },
    });

    if (!artist) {
      return Response.json({ message: "آرتیست پیدا نشد." }, { status: 404 });
    }

    const service = await prisma.service.findFirst({
      where: {
        id: serviceId,
        artistId: artist.id,
      },
      select: {
        id: true,
        duration: true,
      },
    });

    if (!service) {
      return Response.json(
        { message: "خدمت برای این آرتیست پیدا نشد." },
        { status: 404 },
      );
    }

    if (service.duration <= 0) {
      return Response.json(
        { message: "مدت خدمت معتبر نیست." },
        { status: 400 },
      );
    }

    // Prisma/JavaScript: Sunday = 0, Saturday = 6
    // Convert to the schema's convention: Saturday = 0, Sunday = 1, ..., Friday = 6
    const dayOfWeek = (date.getUTCDay() + 1) % 7;

    const workingHour = await prisma.workingHour.findUnique({
      where: {
        artistId_dayOfWeek: {
          artistId: artist.id,
          dayOfWeek,
        },
      },
    });

    if (!workingHour) {
      return Response.json({ slots: [] });
    }

    const toMinutes = (time: string) => {
      const match = /^([01]\d|2[0-3]):([0-5]\d)$/.exec(time);
      if (!match) return null;
      return Number(match[1]) * 60 + Number(match[2]);
    };

    const startMinutes = toMinutes(workingHour.startTime);
    const endMinutes = toMinutes(workingHour.endTime);

    if (
      startMinutes === null ||
      endMinutes === null ||
      endMinutes <= startMinutes
    ) {
      return Response.json(
        { message: "ساعت کاری آرتیست معتبر نیست." },
        { status: 500 },
      );
    }

    const bookings = await prisma.booking.findMany({
      where: {
        artistId: artist.id,
        date,
        status: {
          not: "CANCELLED",
        },
      },
      include: {
        service: {
          select: {
            duration: true,
          },
        },
      },
    });

    const bookedIntervals = bookings.map((booking) => {
      const start = toMinutes(booking.startTime);

      return {
        start,
        end: start === null ? null : start + booking.service.duration,
      };
    });

    const slots: { startTime: string }[] = [];

    // Generate possible start times every 30 minutes.
    for (
      let time = startMinutes;
      time + service.duration <= endMinutes;
      time += 30
    ) {
      const end = time + service.duration;

      const overlaps = bookedIntervals.some((booking) => {
        if (booking.start === null || booking.end === null) return false;

        return time < booking.end && end > booking.start;
      });

      if (!overlaps) {
        const hours = String(Math.floor(time / 60)).padStart(2, "0");
        const minutes = String(time % 60).padStart(2, "0");

        slots.push({
          startTime: `${hours}:${minutes}`,
        });
      }
    }

    return Response.json({ slots });
  } catch (error) {
    console.error("Availability API error:", error);

    return Response.json(
      { message: "خطا در دریافت ساعت‌های آزاد." },
      { status: 500 },
    );
  }
}
