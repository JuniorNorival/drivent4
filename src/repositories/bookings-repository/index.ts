import { prisma } from "@/config";
import { Booking } from "@prisma/client";

async function findBookingByUserId(userId: number) {
  return prisma.booking.findFirst({ where: { userId }, include: { Room: true } });
}

async function findBookingById(bookingId: number) {
  return prisma.booking.findFirst({ where: { id: bookingId } });
}

const bookingRepository = {
  findBookingById,
  findBookingByUserId,
};

export default bookingRepository;
