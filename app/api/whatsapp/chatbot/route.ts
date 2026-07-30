import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { GoogleGenAI } from "@google/genai";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { message, mobile } = body;

    if (!message || typeof message !== "string") {
      return NextResponse.json({ error: "Message is required" }, { status: 400 });
    }

    // Clean mobile number (keep last 10 digits)
    const cleanedMobile = mobile ? mobile.replace(/\D/g, "").slice(-10) : "";

    // 1. Database Context Extraction
    let customerContext = "No specific customer profile identified.";
    let servicesContext = "No active services found.";
    let invoicesContext = "No pending invoices found.";

    if (cleanedMobile) {
      const customer = await prisma.customer.findFirst({
        where: { mobile: { contains: cleanedMobile } },
        include: {
          services: {
            orderBy: { createdAt: "desc" },
            take: 5,
            include: { vendor: true },
          },
          invoices: {
            where: { paymentStatus: { in: ["UNPAID", "PARTIAL"] } },
            orderBy: { createdAt: "desc" },
            take: 3,
          },
        },
      });

      if (customer) {
        customerContext = `Customer Name: ${customer.name}, Mobile: ${customer.mobile}, Loyalty Points: ${customer.loyaltyPoints}`;

        if (customer.services.length > 0) {
          servicesContext = customer.services
            .map(
              (s, i) =>
                `Service #${i + 1}: ${s.serviceType} | Status: ${s.status} | Tracking ID: ${s.trackingId || "N/A"} | Fees: ₹${s.fees} | Payment Status: ${s.paymentStatus}${s.missingDocs ? ` | Missing Docs: ${s.missingDocs}` : ""}`
            )
            .join("\n");
        }

        if (customer.invoices.length > 0) {
          invoicesContext = customer.invoices
            .map(
              (inv) =>
                `Invoice #${inv.invoiceNumber}: Total ₹${inv.total}, Paid: ₹${inv.amountPaid}, Due: ₹${inv.total - inv.amountPaid} (${inv.paymentStatus})`
            )
            .join("\n");
        }
      }
    }

    // Also try matching by explicit Tracking ID if present in message (e.g. T001 or trackingId)
    const trackingIdMatch = message.match(/\b([A-Z0-9]{4,15})\b/i);
    let specificServiceContext = "";
    if (trackingIdMatch) {
      const matchedId = trackingIdMatch[1];
      const matchedService = await prisma.service.findFirst({
        where: {
          OR: [
            { trackingId: { equals: matchedId, mode: "insensitive" } },
            { id: { equals: matchedId } },
            { referenceNo: { equals: matchedId, mode: "insensitive" } },
          ],
        },
        include: { customer: true },
      });

      if (matchedService) {
        specificServiceContext = `Direct Matched Service:\n- Customer: ${matchedService.customer?.name || "N/A"}\n- Service Type: ${matchedService.serviceType}\n- Status: ${matchedService.status}\n- Tracking ID: ${matchedService.trackingId || "N/A"}\n- Fees: ₹${matchedService.fees} (${matchedService.paymentStatus})\n- Missing Docs: ${matchedService.missingDocs || "None"}\n- Updated At: ${matchedService.updatedAt.toLocaleDateString()}`;
      }
    }

    // Fetch Shop Categories for general document guidance
    const serviceCategories = await prisma.onlineServiceCategory.findMany({
      take: 10,
      include: { links: true },
    });

    const shopServicesGuide = serviceCategories
      .map((cat) => `- ${cat.title}: ${cat.links.map((l) => l.title).join(", ")}`)
      .join("\n");

    // 2. Build AI System Instructions
    const systemInstruction = `You are "RA Seva Assistant", the AI customer support executive for "RA Seva Point" (a premier Digital Service Center, CSC, Printing & Books Shop).

YOUR OBJECTIVES:
1. Provide fast, polite, and accurate assistance to customers on WhatsApp.
2. Respond naturally in the SAME language the customer uses (Hindi, Hinglish, or English).
3. If they ask about status, fees, or documents for their application, use the provided REAL-TIME DATABASE CONTEXT.
4. Format your output using clean WhatsApp markdown formatting:
   - Use *bold* for key terms, names, and status updates.
   - Use bullet points for lists.
   - Use helpful emojis (e.g. 📄, ⌛, ✅, 💳, 📌).
   - Keep paragraphs short and easy to read on mobile.
5. If you do not have enough info or the customer is not registered, guide them warmly to visit the shop or contact operator.

REAL-TIME DATABASE CONTEXT FOR THIS CUSTOMER:
[Customer Info]
${customerContext}

[Customer Active Services]
${servicesContext}

[Customer Pending Invoices/Dues]
${invoicesContext}

${specificServiceContext ? `[Specific Matched Service Search]\n${specificServiceContext}\n` : ""}

[Available Shop Services & Categories]
${shopServicesGuide || "Aadhaar Services, PAN Card, Income/Caste Certificates, Passport Photo, Ration Card, Ticket Booking, Book Sales, Xerox & Printouts."}

[Shop Info]
Shop Name: RA Seva Point
Services: Online Govt Applications, Printing, Photo Studio, Stationery & Books
`;

    // 3. Obtain Gemini API Key
    let apiKey = process.env.GEMINI_API_KEY;

    if (!apiKey) {
      const setting = await prisma.shopSettings.findUnique({ where: { key: "geminiApiKeys" } });
      if (setting?.value) {
        try {
          const keys = JSON.parse(setting.value);
          if (Array.isArray(keys) && keys.length > 0) {
            apiKey = keys[0];
          }
        } catch (e) {
          console.error("Error parsing geminiApiKeys from shopSettings", e);
        }
      }
    }

    if (!apiKey) {
      // Fallback response if no API key is available
      return NextResponse.json({
        success: true,
        reply: `Namaste! 🙏\n\n*RA Seva Point Customer Support*\n\nThank you for reaching out! We received your message: _"${message}"_\n\n${cleanedMobile ? `We found active records for your mobile (*${cleanedMobile}*).` : ""}\n\nPlease visit our shop or contact the operator directly for instant assistance.`,
        mode: "fallback",
      });
    }

    // 4. Generate Content via Gemini SDK
    const ai = new GoogleGenAI({ apiKey });

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: [
        {
          role: "user",
          parts: [{ text: message }],
        },
      ],
      config: {
        systemInstruction,
        temperature: 0.5,
      },
    });

    const replyText = response.text?.trim() || "Namaste! Thank you for contacting RA Seva Point. How may we assist you today?";

    return NextResponse.json({
      success: true,
      reply: replyText,
      mode: "ai",
    });
  } catch (error: any) {
    console.error("WhatsApp AI Chatbot Error:", error);
    return NextResponse.json(
      {
        error: "Failed to process message",
        details: error.message,
      },
      { status: 500 }
    );
  }
}
