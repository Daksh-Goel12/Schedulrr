// "use server";

// import { db } from "@/lib/prisma";
// import { auth, clerkClient } from "@clerk/nextjs/server";
// import { google } from "googleapis";

// export async function getUserMeetings(type = "upcoming") {
//   const { userId } = auth();
//   if (!userId) {
//     throw new Error("Unauthorized");
//   }

//   const user = await db.user.findUnique({
//     where: { clerkUserId: userId },
//   });

//   if (!user) {
//     throw new Error("User not found");
//   }

//   const now = new Date();

//   const meetings = await db.booking.findMany({
//     where: {
//       userId: user.id,
//       startTime: type === "upcoming" ? { gte: now } : { lt: now },
//     },
//     include: {
//       event: {
//         include: {
//           user: {
//             select: {
//               name: true,
//               email: true,
//             },
//           },
//         },
//       },
//     },
//     orderBy: {
//       startTime: type === "upcoming" ? "asc" : "desc",
//     },
//   });

//   return meetings;
// }

// export async function cancelMeeting(meetingId) {
//   const { userId } = auth();
//   if (!userId) {
//     throw new Error("Unauthorized");
//   }

//   const user = await db.user.findUnique({
//     where: { clerkUserId: userId },
//   });

//   if (!user) {
//     throw new Error("User not found");
//   }

//   const meeting = await db.booking.findUnique({
//     where: { id: meetingId },
//     include: { event: true, user: true },
//   });

//   if (!meeting || meeting.userId !== user.id) {
//     throw new Error("Meeting not found or unauthorized");
//   }

//   // Cancel the meeting in Google Calendar
//   const { data } = await clerkClient.users.getUserOauthAccessToken(
//     meeting.user.clerkUserId,
//     "oauth_google"
//   );

//   const token = data[0]?.token;

//   const oauth2Client = new google.auth.OAuth2();
//   oauth2Client.setCredentials({ access_token: token });

//   const calendar = google.calendar({ version: "v3", auth: oauth2Client });

//   try {
    
//     await calendar.events.delete({
//       calendarId: "primary",
//       eventId: meeting.googleEventId,
//     });
//   } catch (error) {
//     console.error("Failed to delete event from Google Calendar:", error);
//   }

//   // Send cancellation email before deleting the meeting
//   await sendCancellationEmail(meeting, meeting.event);

//   // Delete the meeting from the database
//   await db.booking.delete({
//     where: { id: meetingId },
//   });

//   return { success: true };
// }


"use server";

import { db } from "@/lib/prisma";
import { auth, clerkClient } from "@clerk/nextjs/server";
import { google } from "googleapis";
import { Resend } from "resend";

// Initialize Resend (make sure to install resend package and set RESEND_API_KEY in .env)
const resend = new Resend(process.env.RESEND_API_KEY);

// Email template for booking confirmation
async function sendBookingConfirmationEmail(booking, event) {
  try {
    const response = await resend.emails.send({
      from: "daksh.goel.43@gmail.com",
      to: booking.user.email,
      subject: `Booking Confirmed: ${event.title}`,
      html: `
        <h1>Booking Confirmation</h1>
        <p>Hello ${booking.user.name},</p>
        <p>Your meeting has been successfully booked:</p>
        <ul>
          <li><strong>Event:</strong> ${event.title}</li>
          <li><strong>Date:</strong> ${new Date(booking.startTime).toLocaleString()}</li>
          <li><strong>Host:</strong> ${event.user.name}</li>
        </ul>
        <p>Looking forward to seeing you!</p>
      `
    });

    // Log the Resend API response for debugging
    console.log("Email sending response:", response);

    // Check if email was sent successfully
    if (response.error) {
      throw new Error(`Email sending failed: ${response.error}`);
    }
  } catch (error) {
    console.error("Detailed error in sending booking confirmation email:", {
      message: error.message,
      stack: error.stack,
      response: error.response ? JSON.stringify(error.response) : 'No response'
    });
    
    // You might want to add additional error handling here
    // For example, retry logic or notification to admin
  }
}

// Email template for cancellation notification
async function sendCancellationEmail(booking, event) {
  try {
    const response = await resend.emails.send({
      from: "your-booking-system@yourdomain.com",
      to: booking.user.email,
      subject: `Meeting Canceled: ${event.title}`,
      html: `
        <h1>Meeting Cancellation</h1>
        <p>Hello ${booking.user.name},</p>
        <p>Your meeting has been canceled:</p>
        <ul>
          <li><strong>Event:</strong> ${event.title}</li>
          <li><strong>Date:</strong> ${new Date(booking.startTime).toLocaleString()}</li>
          <li><strong>Host:</strong> ${event.user.name}</li>
        </ul>
        <p>If this was a mistake, please contact the host.</p>
      `
    });

    // Log the Resend API response for debugging
    console.log("Email cancellation response:", response);

    // Check if email was sent successfully
    if (response.error) {
      throw new Error(`Email cancellation failed: ${response.error}`);
    }
  } catch (error) {
    console.error("Detailed error in sending cancellation email:", {
      message: error.message,
      stack: error.stack,
      response: error.response ? JSON.stringify(error.response) : 'No response'
    });
    
    // You might want to add additional error handling here
    // For example, retry logic or notification to admin
  }
}

// Modify the booking function to include email notification
export async function bookMeeting(eventId) {
  const { userId } = auth();
  if (!userId) {
    throw new Error("Unauthorized");
  }

  const user = await db.user.findUnique({
    where: { clerkUserId: userId },
  });

  if (!user) {
    throw new Error("User not found");
  }

  const event = await db.event.findUnique({
    where: { id: eventId },
    include: { user: true }
  });

  if (!event) {
    throw new Error("Event not found");
  }

  // Create Google Calendar event
  const { data } = await clerkClient.users.getUserOauthAccessToken(
    event.user.clerkUserId,
    "oauth_google"
  );

  const token = data[0]?.token;

  const oauth2Client = new google.auth.OAuth2();
  oauth2Client.setCredentials({ access_token: token });

  const calendar = google.calendar({ version: "v3", auth: oauth2Client });

  // Create Google Calendar event
  const googleEvent = await calendar.events.insert({
    calendarId: "primary",
    requestBody: {
      summary: event.title,
      description: event.description,
      start: { dateTime: event.startTime.toISOString() },
      end: { dateTime: new Date(event.startTime.getTime() + event.duration * 60000).toISOString() },
      attendees: [
        { email: user.email },
        { email: event.user.email }
      ]
    }
  });

  // Create booking in database
  const booking = await db.booking.create({
    data: {
      eventId: event.id,
      userId: user.id,
      startTime: event.startTime,
      googleEventId: googleEvent.data.id
    },
    include: {
      user: true,
      event: {
        include: { user: true }
      }
    }
  });

  // Send confirmation email
  await sendBookingConfirmationEmail(booking, event);

  return booking;
}

export async function cancelMeeting(meetingId) {
  const { userId } = auth();
  if (!userId) {
    throw new Error("Unauthorized");
  }

  const user = await db.user.findUnique({
    where: { clerkUserId: userId },
  });

  if (!user) {
    throw new Error("User not found");
  }

  const meeting = await db.booking.findUnique({
    where: { id: meetingId },
    include: { 
      event: true, 
      user: true 
    },
  });

  if (!meeting || meeting.userId !== user.id) {
    throw new Error("Meeting not found or unauthorized");
  }

  // Cancel the meeting in Google Calendar
  const { data } = await clerkClient.users.getUserOauthAccessToken(
    meeting.user.clerkUserId,
    "oauth_google"
  );

  const token = data[0]?.token;

  const oauth2Client = new google.auth.OAuth2();
  oauth2Client.setCredentials({ access_token: token });

  const calendar = google.calendar({ version: "v3", auth: oauth2Client });

  try {
    await calendar.events.delete({
      calendarId: "primary",
      eventId: meeting.googleEventId,
    });
  } catch (error) {
    console.error("Failed to delete event from Google Calendar:", error);
  }

  // Send cancellation email before deleting the meeting
  await sendCancellationEmail(meeting, meeting.event);

  // Delete the meeting from the database
  await db.booking.delete({
    where: { id: meetingId },
  });

  return { success: true };
}

export async function getUserMeetings(type = "upcoming") {
  const { userId } = auth();
  if (!userId) {
    throw new Error("Unauthorized");
  }

  const user = await db.user.findUnique({
    where: { clerkUserId: userId },
  });

  if (!user) {
    throw new Error("User not found");
  }

  const now = new Date();

  const meetings = await db.booking.findMany({
    where: {
      userId: user.id,
      startTime: type === "upcoming" ? { gte: now } : { lt: now },
    },
    include: {
      event: {
        include: {
          user: {
            select: {
              name: true,
              email: true,
            },
          },
        },
      },
    },
    orderBy: {
      startTime: type === "upcoming" ? "asc" : "desc",
    },
  });

  return meetings;
}