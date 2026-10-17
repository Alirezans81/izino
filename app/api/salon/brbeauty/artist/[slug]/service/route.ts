import { prisma } from "@/lib/prisma";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ slug: string }> },
) {
  const { slug } = await params;

  const services = await prisma.service.findMany({
    where: {
      artist: {
        slug,
      },
    },
  });

  return Response.json(services);
}
