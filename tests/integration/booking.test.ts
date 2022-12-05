import app, { init } from "@/app";
import { prisma } from "@/config";
import faker from "@faker-js/faker";
import { TicketStatus } from "@prisma/client";
import httpStatus from "http-status";
import * as jwt from "jsonwebtoken";
import supertest from "supertest";
import {
  createBookingWithRoomId,
  createEnrollmentWithAddress,
  createHotel,
  createManyBookings,
  createPayment,
  createRoomWithHotelId,
  createTicket,
  createTicketTypeRemote,
  createTicketTypeWithHotel,
  createUser,
  findBooking,
} from "../factories";
import { cleanDb, generateValidToken } from "../helpers";

beforeAll(async () => {
  await init();
});

beforeEach(async () => {
  await cleanDb();
});

const server = supertest(app);

describe("GET /booking", () => {
  it("should respond with status 401 if no token is given", async () => {
    const response = await server.get("/booking");

    expect(response.status).toBe(httpStatus.UNAUTHORIZED);
  });

  it("should respond with status 401 if there is no session for given token", async () => {
    const userWithoutSession = await createUser();
    const token = jwt.sign({ userId: userWithoutSession.id }, process.env.JWT_SECRET);

    const response = await server.get("/booking").set("Authorization", `Bearer ${token}`);

    expect(response.status).toBe(httpStatus.UNAUTHORIZED);
  });

  it("should respond with status 401 if token is not valid", async () => {
    const token = faker.lorem.word();

    const response = await server.get("/booking").set("Authorization", `Bearer ${token}`);
    expect(response.status).toBe(httpStatus.UNAUTHORIZED);
  });

  describe("when token is valid", () => {
    it("should respond with status 404 when user has no booking", async () => {
      const user = await createUser();
      const token = await generateValidToken(user);
      const enrollment = await createEnrollmentWithAddress(user);
      const ticketType = await createTicketTypeWithHotel();
      const ticket = await createTicket(enrollment.id, ticketType.id, TicketStatus.PAID);
      await createPayment(ticket.id, ticketType.price);

      const response = await server.get("/booking").set("Authorization", `Bearer ${token}`);

      expect(response.status).toEqual(httpStatus.NOT_FOUND);
    });

    it("should respond with status 200 and send booking data", async () => {
      const user = await createUser();
      const token = await generateValidToken(user);
      const enrollment = await createEnrollmentWithAddress(user);
      const ticketType = await createTicketTypeWithHotel();
      const ticket = await createTicket(enrollment.id, ticketType.id, TicketStatus.PAID);
      await createPayment(ticket.id, ticketType.price);
      const hotel = await createHotel();
      const room = await createRoomWithHotelId(hotel.id);
      const booking = await createBookingWithRoomId(user.id, room.id);

      const response = await server.get("/booking").set("Authorization", `Bearer ${token}`);

      expect(response.status).toEqual(httpStatus.OK);
      expect(response.body).toEqual({
        id: booking.id,
        Room: {
          ...room,
          createdAt: room.createdAt.toISOString(),
          updatedAt: room.updatedAt.toISOString(),
        },
      });
    });
  });
});

describe("POST /booking", () => {
  it("should respond with status 401 if no token is given", async () => {
    const response = await server.post("/booking");

    expect(response.status).toBe(httpStatus.UNAUTHORIZED);
  });

  it("should respond with status 401 if there is no session for given token", async () => {
    const userWithoutSession = await createUser();
    const token = jwt.sign({ userId: userWithoutSession.id }, process.env.JWT_SECRET);

    const response = await server.post("/booking").set("Authorization", `Bearer ${token}`);

    expect(response.status).toBe(httpStatus.UNAUTHORIZED);
  });

  it("should respond with status 401 if token is not valid", async () => {
    const token = faker.lorem.word();

    const response = await server.post("/booking").set("Authorization", `Bearer ${token}`);
    expect(response.status).toBe(httpStatus.UNAUTHORIZED);
  });
  describe("when token is valid", () => {
    it("should respond with status 403 when body is not given", async () => {
      const user = await createUser();
      const token = await generateValidToken(user);

      const response = await server.post("/booking").set("Authorization", `Bearer ${token}`);
      expect(response.status).toEqual(httpStatus.FORBIDDEN);
    });

    it("should respond with status 403 when body is invalid", async () => {
      const user = await createUser();
      const token = await generateValidToken(user);
      const body = { [faker.lorem.word()]: faker.lorem.word() };

      const response = await server.post("/booking").set("Authorization", `Bearer ${token}`).send(body);
      expect(response.status).toEqual(httpStatus.FORBIDDEN);
    });

    it("should respond with status 403 when user ticket is remote or is not paid", async () => {
      const user = await createUser();
      const token = await generateValidToken(user);
      const enrollment = await createEnrollmentWithAddress(user);
      const ticketType = await createTicketTypeRemote();
      const ticket = await createTicket(enrollment.id, ticketType.id, TicketStatus.RESERVED);
      await createPayment(ticket.id, ticketType.price);
      const createdHotel = await createHotel();
      const createdRoom = await createRoomWithHotelId(createdHotel.id);

      const response = await server
        .post("/booking")
        .set("Authorization", `Bearer ${token}`)
        .send({ roomId: createdRoom.id });

      expect(response.status).toEqual(httpStatus.FORBIDDEN);
    });

    it("should respond with status 404 when user has no enrollment", async () => {
      const user = await createUser();
      const token = await generateValidToken(user);
      const body = { roomId: 2 };
      const response = await server.post("/booking").set("Authorization", `Bearer ${token}`).send(body);
      expect(response.status).toEqual(httpStatus.NOT_FOUND);
    });

    it("should respond with status 404 when user has no ticket", async () => {
      const user = await createUser();
      const token = await generateValidToken(user);
      await createEnrollmentWithAddress(user);
      const body = { roomId: 2 };

      const response = await server.post("/booking").set("Authorization", `Bearer ${token}`).send(body);
      expect(response.status).toEqual(httpStatus.NOT_FOUND);
    });

    it("should respond with status 404 when room doesnt exist", async () => {
      const user = await createUser();
      const token = await generateValidToken(user);
      const enrollment = await createEnrollmentWithAddress(user);
      const ticketType = await createTicketTypeWithHotel();
      const ticket = await createTicket(enrollment.id, ticketType.id, TicketStatus.PAID);
      await createPayment(ticket.id, ticketType.price);
      const body = { roomId: 2 };

      const response = await server.post("/booking").set("Authorization", `Bearer ${token}`).send(body);
      expect(response.status).toEqual(httpStatus.NOT_FOUND);
    });

    it("should respond with status 403 when invalid roomId", async () => {
      const user = await createUser();
      const token = await generateValidToken(user);
      const body = { roomId: -1 };

      const response = await server.post("/booking").set("Authorization", `Bearer ${token}`).send(body);
      expect(response.status).toEqual(httpStatus.FORBIDDEN);
    });

    it("should respond with status 403 when user has a previous booking", async () => {
      const user = await createUser();
      const token = await generateValidToken(user);
      const enrollment = await createEnrollmentWithAddress(user);
      const ticketType = await createTicketTypeWithHotel();
      const ticket = await createTicket(enrollment.id, ticketType.id, TicketStatus.PAID);
      await createPayment(ticket.id, ticketType.price);
      const hotel = await createHotel();
      const room = await createRoomWithHotelId(hotel.id);
      await createBookingWithRoomId(user.id, room.id);
      const body = { roomId: room.id };

      const response = await server.post("/booking").set("Authorization", `Bearer ${token}`).send(body);
      expect(response.status).toEqual(httpStatus.FORBIDDEN);
    });

    it("should respond with status 403 when room is full", async () => {
      const user = await createUser();
      const token = await generateValidToken(user);
      const enrollment = await createEnrollmentWithAddress(user);
      const ticketType = await createTicketTypeWithHotel();
      const ticket = await createTicket(enrollment.id, ticketType.id, TicketStatus.PAID);
      await createPayment(ticket.id, ticketType.price);
      const hotel = await createHotel();
      const room = await createRoomWithHotelId(hotel.id);
      await createManyBookings(room.id);
      const body = { roomId: room.id };

      const response = await server.post("/booking").set("Authorization", `Bearer ${token}`).send(body);
      expect(response.status).toEqual(httpStatus.FORBIDDEN);
    });

    it("should respond with status 404 for invalid room id - invalid partition, non-positive", async () => {
      const user = await createUser();
      const token = await generateValidToken(user);
      const enrollment = await createEnrollmentWithAddress(user);
      const ticketType = await createTicketTypeRemote();
      const ticket = await createTicket(enrollment.id, ticketType.id, TicketStatus.PAID);
      await createPayment(ticket.id, ticketType.price);

      const response = await server.post("/booking").set("Authorization", `Bearer ${token}`).send({ roomId: 0 });

      expect(response.status).toEqual(httpStatus.NOT_FOUND);
    });
    it("should respond with status 200 with booking id when valid roomId", async () => {
      const user = await createUser();
      const token = await generateValidToken(user);
      const enrollment = await createEnrollmentWithAddress(user);
      const ticketType = await createTicketTypeWithHotel();
      const ticket = await createTicket(enrollment.id, ticketType.id, TicketStatus.PAID);
      await createPayment(ticket.id, ticketType.price);
      const hotel = await createHotel();
      const room = await createRoomWithHotelId(hotel.id);
      const body = { roomId: room.id };
      const booking = await findBooking(user.id, room.id);
      const response = await server.post("/booking").set("Authorization", `Bearer ${token}`).send(body);

      expect(response.status).toEqual(httpStatus.OK);
      expect(response.body).toEqual({
        id: booking.id,
      });
    });
  });
});

describe("PUT /booking/:bookingId", () => {
  it("should respond with status 401 if no token is given", async () => {
    const response = await server.put("/booking/2");

    expect(response.status).toBe(httpStatus.UNAUTHORIZED);
  });

  it("should respond with status 401 if there is no session for given token", async () => {
    const userWithoutSession = await createUser();
    const token = jwt.sign({ userId: userWithoutSession.id }, process.env.JWT_SECRET);

    const response = await server.put("/booking/2").set("Authorization", `Bearer ${token}`);

    expect(response.status).toBe(httpStatus.UNAUTHORIZED);
  });

  it("should respond with status 401 if token is not valid", async () => {
    const token = faker.lorem.word();

    const response = await server.put("/booking/2").set("Authorization", `Bearer ${token}`);
    expect(response.status).toBe(httpStatus.UNAUTHORIZED);
  });

  describe("when token is valid", () => {
    it("should respond with status 403 when body is not given", async () => {
      const user = await createUser();
      const token = await generateValidToken(user);

      const response = await server.post("/booking/2").set("Authorization", `Bearer ${token}`);
      expect(response.status).toEqual(httpStatus.FORBIDDEN);
    });

    it("should respond with status 403 when body is invalid", async () => {
      const user = await createUser();
      const token = await generateValidToken(user);
      const body = { [faker.lorem.word()]: faker.lorem.word() };

      const response = await server.post("/booking/2").set("Authorization", `Bearer ${token}`).send(body);
      expect(response.status).toEqual(httpStatus.FORBIDDEN);
    });

    it("should respond with status 403 when param is invalid", async () => {
      const user = await createUser();
      const token = await generateValidToken(user);
      const invalidParam = faker.lorem.word();
      const body = { [faker.lorem.word()]: faker.lorem.word() };

      const response = await server.post(`/booking/${invalidParam}`).set("Authorization", `Bearer ${token}`).send(body);
      expect(response.status).toEqual(httpStatus.FORBIDDEN);
    });

    it("should respond with status 403 for invalid room id - invalid partition, non-positive", async () => {
      const user = await createUser();
      const token = await generateValidToken(user);
      const enrollment = await createEnrollmentWithAddress(user);
      const ticketType = await createTicketTypeWithHotel();
      const ticket = await createTicket(enrollment.id, ticketType.id, TicketStatus.PAID);
      await createPayment(ticket.id, ticketType.price);

      const response = await server.put("/booking/2").set("Authorization", `Bearer ${token}`).send({ roomId: 0 });

      expect(response.status).toEqual(httpStatus.FORBIDDEN);
    });
    it("should respond with status 403 when room is full", async () => {
      const user = await createUser();
      const token = await generateValidToken(user);
      const enrollment = await createEnrollmentWithAddress(user);
      const ticketType = await createTicketTypeWithHotel();
      const ticket = await createTicket(enrollment.id, ticketType.id, TicketStatus.PAID);
      await createPayment(ticket.id, ticketType.price);
      const hotel = await createHotel();
      const room = await createRoomWithHotelId(hotel.id);
      await createManyBookings(room.id);
      const body = { roomId: room.id };

      const response = await server.post("/booking/2").set("Authorization", `Bearer ${token}`).send(body);
      expect(response.status).toEqual(httpStatus.FORBIDDEN);
    });

    it("should respond with status 403 when invalid roomId is given", async () => {
      const user = await createUser();
      const token = await generateValidToken(user);
      const body = { roomId: -1 };

      const response = await server.put("/booking/1").set("Authorization", `Bearer ${token}`).send(body);

      expect(response.status).toEqual(httpStatus.FORBIDDEN);
    });

    it("should respond with status 403 when invalid bookingId is given", async () => {
      const user = await createUser();
      const token = await generateValidToken(user);
      const body = { roomId: 1 };

      const response = await server.put("/booking/-1").set("Authorization", `Bearer ${token}`).send(body);

      expect(response.status).toEqual(httpStatus.FORBIDDEN);
    });

    it("should respond with status 200 with booking id when valid roomId and bookingId", async () => {
      const user = await createUser();
      const token = await generateValidToken(user);
      const hotel = await createHotel();
      const room = await createRoomWithHotelId(hotel.id);
      const userBooking = await createBookingWithRoomId(user.id, room.id);
      const newRoom = await createRoomWithHotelId(hotel.id);
      const body = { roomId: newRoom.id };

      const response = await server
        .put(`/booking/${userBooking.id}`)
        .set("Authorization", `Bearer ${token}`)
        .send(body);

      const booking = await prisma.booking.findUnique({
        where: {
          id: userBooking.id,
        },
      });

      expect(response.status).toEqual(httpStatus.OK);
      expect(booking.roomId).toEqual(newRoom.id);
    });
  });
});
