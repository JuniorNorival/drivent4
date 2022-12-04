import httpStatus from "http-status";
import bookingService from "@/services/bookings-service";
import { Response } from "express";
import { AuthenticatedRequest } from "@/middlewares";
import { forbiddenError } from "@/errors";

export async function getBookingByUser(req: AuthenticatedRequest, res: Response) {
  const { userId } = req;

  try {
    const userBooking = await bookingService.getUserBooking(userId);
    return res.status(httpStatus.OK).send(userBooking);
  } catch (error) {
    res.status(httpStatus.NOT_FOUND).send(error.message);
  }
}

export async function postBooking(req: AuthenticatedRequest, res: Response) {
  const { userId } = req;
  const roomId = Number(req.body.roomId);

  try {
    if (!roomId || isNaN(roomId) || roomId <= 0) {
      throw forbiddenError();
    }

    const newBooking = await bookingService.createNewBooking(userId, roomId);

    res.status(httpStatus.OK).send({ id: newBooking.id });
  } catch (error) {
    if (error.name === "ForbiddenError") {
      return res.status(httpStatus.FORBIDDEN).send(error.message);
    }
    return res.status(httpStatus.NOT_FOUND).send(error.message);
  }
}

export async function updateBooking(req: AuthenticatedRequest, res: Response) {
  const { userId } = req;
  const roomId = Number(req.body.roomId);
  const bookingId = Number(req.params.bookingId);

  try {
    if (!roomId || isNaN(roomId) || roomId <= 0 || !bookingId || isNaN(bookingId) || bookingId <= 0) {
      throw forbiddenError();
    }
    const booking = await bookingService.updateBooking(bookingId, roomId, userId);
    res.status(httpStatus.OK).send({ id: booking.id });
  } catch (error) {
    if (error.name === "ForbiddenError") {
      return res.status(httpStatus.FORBIDDEN).send(error.message);
    }
    return res.status(httpStatus.NOT_FOUND).send(error.message);
  }
}
