import { prisma } from "@/lib/prisma";
import { sendBookingSms } from "@/lib/sms";
import { BookingStatus } from "@/prisma/generated/client";
import { NextRequest } from "next/server";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> },
) {
  try {
    const { slug } = await params;
    const body = await request.json();

    const { serviceId, date: dateString, time, customer } = body;

    const customerName = customer?.name?.trim();
    const customerPhone = customer?.phone?.trim();

    if (!serviceId || !dateString || !time || !customerName || !customerPhone) {
      return Response.json(
        { message: "لطفاً تمام اطلاعات رزرو را وارد کنید." },
        { status: 400 },
      );
    }

    if (customerName.length < 2 || customerName.length > 100) {
      return Response.json(
        { message: "نام واردشده معتبر نیست." },
        { status: 400 },
      );
    }

    if (!/^[+()\d۰-۹٠-٩\s-]{8,20}$/.test(customerPhone)) {
      return Response.json(
        { message: "شماره موبایل معتبر نیست." },
        { status: 400 },
      );
    }

    if (!/^\d{4}-\d{2}-\d{2}$/.test(dateString)) {
      return Response.json(
        { message: "فرمت تاریخ باید YYYY-MM-DD باشد." },
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

    if (!/^(?:[01]\d|2[0-3]):[0-5]\d$/.test(time)) {
      return Response.json(
        { message: "ساعت انتخاب‌شده معتبر نیست." },
        { status: 400 },
      );
    }

    const artist = await prisma.artist.findUnique({
      where: { slug },
      select: { id: true, phone: true },
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
        name: true,
        duration: true,
      },
    });

    if (!service) {
      return Response.json(
        { message: "خدمت انتخاب‌شده برای این آرتیست معتبر نیست." },
        { status: 400 },
      );
    }

    if (service.duration <= 0) {
      return Response.json(
        { message: "مدت خدمت معتبر نیست." },
        { status: 400 },
      );
    }

    // Schema convention: Saturday = 0, Sunday = 1, ..., Friday = 6
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
      return Response.json(
        { message: "این آرتیست در روز انتخاب‌شده ساعت کاری ندارد." },
        { status: 400 },
      );
    }

    const toMinutes = (value: string) => {
      const match = /^([01]\d|2[0-3]):([0-5]\d)$/.exec(value);

      if (!match) return null;

      return Number(match[1]) * 60 + Number(match[2]);
    };

    const startMinutes = toMinutes(time);
    const workStart = toMinutes(workingHour.startTime);
    const workEnd = toMinutes(workingHour.endTime);

    if (
      startMinutes === null ||
      workStart === null ||
      workEnd === null ||
      workEnd <= workStart
    ) {
      return Response.json(
        { message: "ساعت کاری یا ساعت انتخاب‌شده معتبر نیست." },
        { status: 500 },
      );
    }

    const endMinutes = startMinutes + service.duration;

    if (startMinutes < workStart || endMinutes > workEnd) {
      return Response.json(
        { message: "این زمان خارج از ساعت کاری آرتیست است." },
        { status: 400 },
      );
    }

    const existingBookings = await prisma.booking.findMany({
      where: {
        artistId: artist.id,
        date,
        status: {
          in: [BookingStatus.PENDING, BookingStatus.CONFIRMED],
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

    const hasConflict = existingBookings.some((booking) => {
      const bookingStart = toMinutes(booking.startTime);

      if (bookingStart === null) return true;

      const bookingEnd = bookingStart + booking.service.duration;

      return startMinutes < bookingEnd && endMinutes > bookingStart;
    });

    if (hasConflict) {
      return Response.json(
        {
          message:
            "این ساعت به‌تازگی رزرو شده است. لطفاً ساعت دیگری انتخاب کنید.",
        },
        { status: 409 },
      );
    }

    const booking = await prisma.booking.create({
      data: {
        customerName,
        customerPhone,
        date,
        startTime: time,
        status: BookingStatus.PENDING,
        artistId: artist.id,
        serviceId: service.id,
      },
    });

    try {
      const persianDate = new Intl.DateTimeFormat("fa-IR-u-ca-persian", {
        weekday: "long",
        day: "numeric",
        month: "numeric",
        year: "numeric",
        timeZone: "UTC",
      }).format(date);

      await sendBookingSms({
        phone: artist.phone ?? "",
        customerName: customer.name,
        serviceName: service.name,
        date: persianDate,
        time,
      });
    } catch (error) {
      console.error("SMS error:", error);
    }

    return Response.json(
      {
        message: "درخواست رزرو شما با موفقیت ثبت شد.",
        booking: {
          id: booking.id,
          date: dateString,
          startTime: booking.startTime,
          status: booking.status,
        },
      },
      { status: 201 },
    );
  } catch (error) {
    console.error("Booking API error:", error);

    return Response.json(
      { message: "خطا در ثبت رزرو. لطفاً دوباره تلاش کنید." },
      { status: 500 },
    );
  }
}
