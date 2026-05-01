import { Resend } from "resend"

const resendApiKey = process.env.RESEND_EMAIL_API_KEY ?? ""
const resend = new Resend(resendApiKey || "re_mock_key_if_not_set")
const fromAddress = process.env.RESEND_FROM_EMAIL ?? "Venue Compass <onboarding@resend.dev>"

export const getSiteUrl = () => {
  if (process.env.NEXT_PUBLIC_SITE_URL) return process.env.NEXT_PUBLIC_SITE_URL
  return process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : "http://localhost:3000"
}

export async function sendApprovalEmail({
    to,
    venueName,
    bookingId,
    amount
}: {
    to: string,
    venueName: string,
    bookingId: string,
    amount: number
}) {
    const checkoutUrl = `${getSiteUrl()}/checkout/${bookingId}`

    if (!resendApiKey) {
      return { id: "mock_id" }
    }

    try {
        const data = await resend.emails.send({
          from: fromAddress,
            to,
            subject: `Your booking for ${venueName} has been approved!`,
            html: `
        <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
          <h2>Good news!</h2>
          <p>Your booking request for <strong>${venueName}</strong> has been approved by the owner.</p>
          <p>The total amount due is $${amount} USD.</p>
          
          <div style="margin: 30px 0;">
            <a href="${checkoutUrl}" style="background-color: #7c3aed; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold; display: inline-block;">
              Complete Payment Now
            </a>
          </div>
          
          <p style="color: #666; font-size: 14px;">
            You can also complete your payment by logging into your dashboard and viewing your bookings.
          </p>
        </div>
      `,
        })
        if ('error' in data && data.error) {
          console.error('[sendApprovalEmail]  Resend API error:', data.error)
          return data
        }
        return data
    } catch (error) {
        console.error("[sendApprovalEmail]  Failed to send email:", error)
        if (error instanceof Error) {
          console.error("[sendApprovalEmail] Error message:", error.message)
          console.error("[sendApprovalEmail] Error stack:", error.stack)
        }
        return { error: error instanceof Error ? error : new Error(String(error)) } as any
    }
}  