import { NextResponse } from "next/server";

// 1. GET: Webhook Verification for Meta WhatsApp Cloud API / Twilio
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const mode = searchParams.get("hub.mode");
  const token = searchParams.get("hub.verify_token");
  const challenge = searchParams.get("hub.challenge");

  const VERIFY_TOKEN = process.env.WHATSAPP_VERIFY_TOKEN || "ra_seva_point_whatsapp_token";

  if (mode && token) {
    if (mode === "subscribe" && token === VERIFY_TOKEN) {
      console.log("[WhatsApp Webhook] Verified successfully!");
      return new Response(challenge, { status: 200 });
    } else {
      return NextResponse.json({ error: "Verification token mismatch" }, { status: 403 });
    }
  }

  return NextResponse.json({ status: "WhatsApp Webhook Listener Active" });
}

// 2. POST: Handle Incoming WhatsApp Message Event
export async function POST(request: Request) {
  try {
    const body = await request.json();

    // Universal Extractor for Meta Graph API / UltraMsg / Baileys payloads
    let senderMobile = "";
    let messageText = "";

    // Meta WhatsApp Cloud API Payload Structure
    if (body?.entry?.[0]?.changes?.[0]?.value?.messages?.[0]) {
      const msgObj = body.entry[0].changes[0].value.messages[0];
      senderMobile = msgObj.from || "";
      if (msgObj.type === "text") {
        messageText = msgObj.text?.body || "";
      } else {
        messageText = `[Received ${msgObj.type} media]`;
      }
    } 
    // Generic / Custom Webhook Payload
    else if (body.mobile || body.from || body.phone) {
      senderMobile = body.mobile || body.from || body.phone || "";
      messageText = body.message || body.text || body.body || "";
    }

    if (!messageText) {
      return NextResponse.json({ status: "ignored", reason: "No text payload" });
    }

    // Call internal AI chatbot processor
    const baseUrl = process.env.NEXTAUTH_URL || "http://localhost:3000";
    const aiResponse = await fetch(`${baseUrl}/api/whatsapp/chatbot`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        message: messageText,
        mobile: senderMobile,
      }),
    });

    const aiData = await aiResponse.json();

    return NextResponse.json({
      status: "success",
      received: {
        from: senderMobile,
        message: messageText,
      },
      aiReply: aiData.reply,
    });
  } catch (error: any) {
    console.error("[WhatsApp Webhook Error]:", error);
    return NextResponse.json(
      { error: "Internal Server Error", details: error.message },
      { status: 500 }
    );
  }
}
