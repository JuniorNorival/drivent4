import { Router } from "express";
import { getBookingByUser, postBooking, updateBooking } from "@/controllers";
import { authenticateToken } from "@/middlewares";

const bookingRouter = Router();

bookingRouter
  .all("/", authenticateToken)
  .get("/", getBookingByUser)
  .post("/", postBooking)
  .put("/:bookingId", updateBooking);

export { bookingRouter };
