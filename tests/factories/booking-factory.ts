import { prisma } from "@/config";
import { createUser } from "./users-factory";

export async function createBookingWithRoomId(userId: number, roomId: number) {
  return prisma.booking.create({
    data: {
      userId,
      roomId,
    },
    include: {
      Room: true,
    },
  });
}

export async function createManyBookings(roomId: number) {
  const user = await createUser();
  return prisma.booking.createMany({
    data: [
      { userId: user.id, roomId },
      { userId: user.id, roomId },
      { userId: user.id, roomId },
    ],
  });
}

export async function findBooking(userId: number, roomId: number) {
  return await prisma.booking.findFirst({
    where: {
      userId: userId,
      roomId: roomId,
    },
  });
}
