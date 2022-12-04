import { prisma } from "@/config";

async function findBookingByUserId(userId: number) {
  return prisma.booking.findFirst({ where: { userId }, select: { Room: true, id: true } });
}

async function findBookingById(bookingId: number) {
  return prisma.booking.findFirst({ where: { id: bookingId } });
}
async function findBookingByRoomId(roomId: number) {
  return prisma.booking.findMany({ where: { roomId } });
}
async function createNewBooking(userId: number, roomId: number) {
  return prisma.booking.create({ data: { userId, roomId } });
}

const bookingRepository = {
  findBookingById,
  findBookingByUserId,
  findBookingByRoomId,
  createNewBooking,
};

export default bookingRepository;
