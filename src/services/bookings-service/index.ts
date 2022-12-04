import { notFoundError, forbiddenError } from "@/errors";
import bookingRepository from "@/repositories/bookings-repository";
import enrollmentRepository from "@/repositories/enrollment-repository";
import hotelRepository from "@/repositories/hotel-repository";
import ticketRepository from "@/repositories/ticket-repository";

async function checkTicketAndEnrollment(userId: number) {
  const enrollment = await enrollmentRepository.findWithAddressByUserId(userId);

  if (!enrollment) throw notFoundError();

  const ticket = await ticketRepository.findTickeWithTypeById(enrollment.id);

  if (!ticket || ticket.status === "RESERVED" || ticket.TicketType.isRemote || !ticket.TicketType.includesHotel) {
    throw notFoundError();
  }
}

async function checkBooking(roomId: number) {
  const room = await hotelRepository.findRoomByRoomId(roomId);

  if (!room) throw notFoundError();

  const bookings = await bookingRepository.findBookingByRoomId(roomId);

  if (bookings.length >= room.capacity) throw notFoundError();
}
async function getUserBooking(userId: number) {
  checkTicketAndEnrollment(userId);
  const userBooking = await bookingRepository.findBookingByUserId(userId);

  if (!userBooking) throw forbiddenError();

  return userBooking;
}

async function createNewBooking(userId: number, roomId: number) {
  await checkTicketAndEnrollment(userId);
  await checkBooking(roomId);

  const userBooking = await bookingRepository.findBookingByUserId(userId);
  if (userBooking) throw forbiddenError();
  const newBooking = await bookingRepository.createNewBooking(userId, roomId);

  return newBooking;
}

const bookingService = {
  getUserBooking,
  createNewBooking,
};

export default bookingService;
