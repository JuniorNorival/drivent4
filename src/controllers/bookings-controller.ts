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
