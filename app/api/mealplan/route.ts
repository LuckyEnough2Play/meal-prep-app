import { NextRequest, NextResponse } from "next/server";
import OpenAI from "openai";
import { formatMealPlanPrompt } from "../../../utils/mealPlanPrompt";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function POST(request: NextRequest) {
  try {
    const profile = await request.json();
    const prompt = formatMealPlanPrompt(profile);
    const completion = await openai.chat.completions.create({
      model: "gpt-4",
      messages: [{ role: "user", content: prompt }],
    });
    const text = completion.choices[0].message?.content || "{}";
    const data = JSON.parse(text);
    return NextResponse.json(data);
  } catch (err: any) {
    console.error("API route error:", err);
    return NextResponse.json(
      { error: err.message || "Failed to generate meal plan" },
      { status: 500 }
    );
  }
}
