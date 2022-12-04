import httpStatus from "http-status";
import bookingService from "@/services/bookings-service";
import { Response } from "express";
import { AuthenticatedRequest } from "@/middlewares";

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
    const newBooking = await bookingService.createNewBooking(userId, roomId);

    res.status(httpStatus.OK).send(newBooking);
  } catch (error) {
    if (error.name === "ForbiddenError") {
      return res.status(httpStatus.FORBIDDEN).send(error.message);
    }
    return res.status(httpStatus.NOT_FOUND).send(error.message);
  }
}
