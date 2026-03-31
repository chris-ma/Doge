import nodemailer from 'nodemailer'

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: parseInt(process.env.SMTP_PORT || '587'),
  secure: false,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
})

interface BookingItem {
  seat: {
    label: string
    type: string
  }
  price: number
}

interface BookingData {
  id: string
  customerName: string
  customerEmail: string
  customerPhone?: string | null
  totalAmount: number
  items: BookingItem[]
}

interface SessionData {
  name: string
  date: Date
  startTime: string
  endTime?: string | null
}

interface VenueData {
  name: string
  address?: string | null
  logoUrl?: string | null
  primaryColor: string
}

export async function sendBookingConfirmation(
  booking: BookingData,
  session: SessionData,
  venue: VenueData
) {
  const formattedDate = new Date(session.date).toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })

  const seatsList = booking.items
    .map(
      (item) =>
        `<tr>
          <td style="padding: 8px 12px; border-bottom: 1px solid #e5e7eb;">${item.seat.label} (${item.seat.type})</td>
          <td style="padding: 8px 12px; border-bottom: 1px solid #e5e7eb; text-align: right;">$${item.price.toFixed(2)}</td>
        </tr>`
    )
    .join('')

  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
    </head>
    <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background: #f9fafb; margin: 0; padding: 0;">
      <div style="max-width: 600px; margin: 0 auto; padding: 40px 20px;">
        <!-- Header -->
        <div style="background: ${venue.primaryColor}; border-radius: 12px 12px 0 0; padding: 32px; text-align: center;">
          ${venue.logoUrl ? `<img src="${venue.logoUrl}" alt="${venue.name}" style="height: 48px; margin-bottom: 16px;">` : ''}
          <h1 style="color: white; margin: 0; font-size: 24px; font-weight: 700;">${venue.name}</h1>
          <p style="color: rgba(255,255,255,0.85); margin: 8px 0 0; font-size: 14px;">Booking Confirmation</p>
        </div>

        <!-- Body -->
        <div style="background: white; border-radius: 0 0 12px 12px; padding: 32px; box-shadow: 0 2px 8px rgba(0,0,0,0.08);">
          <div style="background: #f0fdf4; border: 1px solid #bbf7d0; border-radius: 8px; padding: 16px; margin-bottom: 24px; text-align: center;">
            <p style="color: #16a34a; font-weight: 600; margin: 0; font-size: 16px;">&#10003; Your booking is confirmed!</p>
          </div>

          <p style="color: #374151; font-size: 16px;">Hi <strong>${booking.customerName}</strong>,</p>
          <p style="color: #6b7280; line-height: 1.6;">Thank you for your booking. Here are your booking details:</p>

          <!-- Booking ID -->
          <div style="background: #f9fafb; border-radius: 8px; padding: 16px; margin: 24px 0;">
            <p style="margin: 0; color: #6b7280; font-size: 12px; text-transform: uppercase; letter-spacing: 0.05em;">Booking Reference</p>
            <p style="margin: 4px 0 0; color: #111827; font-size: 18px; font-weight: 700; font-family: monospace;">#${booking.id.slice(-8).toUpperCase()}</p>
          </div>

          <!-- Event Details -->
          <h2 style="color: #111827; font-size: 18px; margin: 24px 0 16px;">Event Details</h2>
          <table style="width: 100%; border-collapse: collapse;">
            <tr>
              <td style="padding: 8px 0; color: #6b7280; font-size: 14px; width: 120px;">Event</td>
              <td style="padding: 8px 0; color: #111827; font-weight: 600;">${session.name}</td>
            </tr>
            <tr>
              <td style="padding: 8px 0; color: #6b7280; font-size: 14px;">Date</td>
              <td style="padding: 8px 0; color: #111827;">${formattedDate}</td>
            </tr>
            <tr>
              <td style="padding: 8px 0; color: #6b7280; font-size: 14px;">Time</td>
              <td style="padding: 8px 0; color: #111827;">${session.startTime}${session.endTime ? ` - ${session.endTime}` : ''}</td>
            </tr>
            ${venue.address ? `
            <tr>
              <td style="padding: 8px 0; color: #6b7280; font-size: 14px;">Venue</td>
              <td style="padding: 8px 0; color: #111827;">${venue.address}</td>
            </tr>
            ` : ''}
          </table>

          <!-- Seats -->
          <h2 style="color: #111827; font-size: 18px; margin: 24px 0 16px;">Your Seats</h2>
          <table style="width: 100%; border-collapse: collapse; border: 1px solid #e5e7eb; border-radius: 8px; overflow: hidden;">
            <thead>
              <tr style="background: #f9fafb;">
                <th style="padding: 10px 12px; text-align: left; color: #6b7280; font-size: 12px; text-transform: uppercase; letter-spacing: 0.05em;">Seat</th>
                <th style="padding: 10px 12px; text-align: right; color: #6b7280; font-size: 12px; text-transform: uppercase; letter-spacing: 0.05em;">Price</th>
              </tr>
            </thead>
            <tbody>
              ${seatsList}
            </tbody>
            <tfoot>
              <tr style="background: #f9fafb;">
                <td style="padding: 12px; font-weight: 700; color: #111827;">Total</td>
                <td style="padding: 12px; font-weight: 700; color: #111827; text-align: right;">$${booking.totalAmount.toFixed(2)}</td>
              </tr>
            </tfoot>
          </table>

          <p style="color: #6b7280; font-size: 14px; margin-top: 32px; padding-top: 24px; border-top: 1px solid #e5e7eb;">
            If you have any questions, please contact us. We look forward to seeing you!
          </p>
        </div>

        <p style="text-align: center; color: #9ca3af; font-size: 12px; margin-top: 24px;">
          © ${new Date().getFullYear()} ${venue.name}. All rights reserved.
        </p>
      </div>
    </body>
    </html>
  `

  try {
    await transporter.sendMail({
      from: `"${venue.name}" <${process.env.SMTP_FROM}>`,
      to: booking.customerEmail,
      subject: `Booking Confirmed - ${session.name}`,
      html,
    })
    console.log('Confirmation email sent to', booking.customerEmail)
  } catch (error) {
    console.error('Failed to send confirmation email:', error)
    // Don't throw - email failure shouldn't break the booking flow
  }
}
