import "dotenv/config"

interface VoiceCallOptions {
  toPhone: string
  orderId: string
  customerName?: string
  reason?: string
}

interface VoiceCallResult {
  success: boolean
  callSid?: string
  mocked?: boolean
  error?: string
}

/**
 * Service to initiate an automated outbound voice call to the customer
 * using Twilio's Voice API when an order is auto-rejected or cancelled.
 */
export async function triggerCustomerVoiceCall({
  toPhone,
  orderId,
  customerName = "Customer",
  reason = "Kitchen preparation window timed out",
}: VoiceCallOptions): Promise<VoiceCallResult> {
  const accountSid = process.env.TWILIO_ACCOUNT_SID
  const authToken = process.env.TWILIO_AUTH_TOKEN
  const fromPhone = process.env.TWILIO_PHONE_NUMBER || "+15005550006" // Twilio test number default

  // Clean and format phone number for international E.164 standard
  let formattedPhone = toPhone.trim().replace(/[\s\-()]/g, "")
  if (!formattedPhone.startsWith("+")) {
    if (formattedPhone.length === 10) {
      formattedPhone = `+91${formattedPhone}`
    } else if (formattedPhone.startsWith("0")) {
      formattedPhone = `+91${formattedPhone.slice(1)}`
    } else {
      formattedPhone = `+${formattedPhone}`
    }
  }

  const shortId = orderId.slice(-6).toUpperCase()

  // Generate dynamic TwiML instructions for Twilio's text-to-speech engine
  const twiml = `
    <Response>
      <Pause length="1"/>
      <Say voice="alice" language="en-IN">
        Hello ${customerName}. This is an automated notification from Naadan Cloud Kitchen Nagpur.
        We regret to inform you that your order number ${shortId.split("").join(" ")} could not be accepted by our kitchen within the 5-minute preparation window.
        Your order has been automatically cancelled and any amount charged will be refunded to your source account immediately.
        We sincerely apologize for any inconvenience caused. Thank you for choosing Naadan.
      </Say>
    </Response>
  `.trim()

  // If Twilio credentials are not configured in environment, simulate and log gracefully
  if (!accountSid || !authToken) {
    console.log(`[TwilioVoiceService] Mock Voice Call Dispatched:
      To: ${formattedPhone}
      Order ID: #${shortId}
      Reason: ${reason}
      TwiML: ${twiml.replace(/\s+/g, " ")}
    `)
    return {
      success: true,
      mocked: true,
      callSid: `CA_mock_${Date.now()}`,
    }
  }

  try {
    const url = `https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Calls.json`
    const params = new URLSearchParams()
    params.append("To", formattedPhone)
    params.append("From", fromPhone)
    params.append("Twiml", twiml)

    const authHeader = `Basic ${Buffer.from(`${accountSid}:${authToken}`).toString("base64")}`

    const response = await fetch(url, {
      method: "POST",
      headers: {
        Authorization: authHeader,
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: params.toString(),
    })

    if (!response.ok) {
      const errText = await response.text()
      console.error("[TwilioVoiceService] Twilio API call failed:", response.status, errText)
      return { success: false, error: `Twilio call failed: ${errText}` }
    }

    const data = (await response.json()) as { sid?: string }
    console.log(`[TwilioVoiceService] Voice call successfully queued. Call SID: ${data.sid}`)
    return { success: true, callSid: data.sid }
  } catch (error: any) {
    console.error("[TwilioVoiceService] Exception initiating voice call:", error)
    return { success: false, error: error.message || "Failed to trigger voice call" }
  }
}
