import { Router } from "express";
import { getBookingByUser, postBooking } from "@/controllers";
import { authenticateToken } from "@/middlewares";

const bookingRouter = Router();

bookingRouter.all("/", authenticateToken).get("/", getBookingByUser).post("/", postBooking);

export { bookingRouter };
