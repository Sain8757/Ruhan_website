import { NextResponse } from "next/server";
import { GoogleGenAI } from "@google/genai";
import { prisma } from "@/lib/db";
import { auth } from "@/lib/auth";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || "dummy" });

export async function POST(req: Request) {
  try {
    const session = await auth();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { messages } = body;

    if (!messages || !Array.isArray(messages)) {
      return NextResponse.json({ error: "Invalid messages array" }, { status: 400 });
    }

    if (!process.env.GEMINI_API_KEY) {
      return NextResponse.json(
        { error: "Gemini API key is missing. Please add GEMINI_API_KEY to your .env file." },
        { status: 500 }
      );
    }

    // Fetch contextual data for the AI
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const [pendingServicesCount, todayCustomersCount, totalCustomers] = await Promise.all([
      prisma.service.count({
        where: { status: { in: ["PENDING", "SUBMITTED", "PROCESSING"] } },
      }),
      prisma.customer.count({
        where: { createdAt: { gte: today } },
      }),
      prisma.customer.count(),
    ]);

    const systemPrompt = `You are a helpful AI assistant for "RA Seva Point", a digital service point shop. 
You answer questions about the shop, help with tasks, and provide business ideas.
Always reply in a helpful, concise, and friendly manner. If asked in Hindi/Hinglish, reply in Hinglish.

Here is the current real-time data from the shop's database:
- Total Customers: ${totalCustomers}
- Customers Added Today: ${todayCustomersCount}
- Pending/Active Online Services: ${pendingServicesCount}

You can use this data to answer questions like "kitne pending kaam hain" or "aaj kitne customers aaye".
If they ask for ideas, provide creative and practical business growth ideas for a digital service center (like CSC center, PAN card, Passport, Ticket Booking, etc.).
`;

    // Convert OpenAI style messages to Gemini style
    const geminiMessages = messages.map((msg: any) => ({
      role: msg.role === "user" ? "user" : "model",
      parts: [{ text: msg.content }],
    }));

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: geminiMessages,
      config: {
        systemInstruction: systemPrompt,
        temperature: 0.7,
      },
    });

    return NextResponse.json({
      role: "assistant",
      content: response.text,
    });
  } catch (error: any) {
    console.error("AI Chat Error:", error);
    return NextResponse.json(
      { error: "Failed to generate AI response: " + error.message },
      { status: 500 }
    );
  }
}
