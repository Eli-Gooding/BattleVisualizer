import { NextResponse } from 'next/server';
import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY // Use server-side env variable (not NEXT_PUBLIC_)
});

// Mock data for testing
const MOCK_RESPONSE = {
  historicalContext: "The Battle of Cannae was a major battle of the Second Punic War that took place on August 2, 216 BC in Apulia, southeastern Italy.",
  battleInfo: {
    date: "August 2, 216 BC",
    location: {
      name: "Cannae, Apulia, Italy",
      coordinates: {
        lat: 41.3057,
        lng: 16.1322
      }
    },
    armies: {
      roman: {
        total: 86400,
        infantry: 66000,
        cavalry: 6000
      },
      carthaginian: {
        total: 50000,
        infantry: 44000,
        cavalry: 6000
      }
    }
  },
  scenes: [
    {
      id: 1,
      title: "Initial Deployment",
      description: "Romans positioned infantry in center with cavalry on flanks. Carthaginians formed a crescent formation.",
      troops: [
        {
          id: "roman_inf_center",
          side: "roman",
          type: "infantry",
          size: 66000,
          position: {
            lat: 41.3057,
            lng: 16.1322
          },
          movement: {
            to: {
              lat: 41.3057,
              lng: 16.1322
            },
            type: "static"
          }
        },
        {
          id: "roman_cav_left",
          side: "roman",
          type: "cavalry",
          size: 3000,
          position: {
            lat: 41.3057,
            lng: 16.1300
          },
          movement: {
            to: {
              lat: 41.3057,
              lng: 16.1300
            },
            type: "static"
          }
        }
      ]
    }
  ]
};

export async function POST(request: Request) {
  try {
    const { battleName } = await request.json();

    if (!battleName) {
      return NextResponse.json(
        { error: 'Battle name is required' },
        { status: 400 }
      );
    }

    if (battleName.toLowerCase().includes('cannae')) {
      // For initial testing, return mock data
      return NextResponse.json(MOCK_RESPONSE);

      // Once ready for OpenAI integration, uncomment this:
      /*
      const completion = await openai.chat.completions.create({
        model: "gpt-4",
        messages: [
          {
            role: "system",
            content: `You are a military history expert. Given a battle report, break it down into sequential scenes that can be visualized...`
          },
          {
            role: "user",
            content: `Process this battle report: ${battleName}`
          }
        ],
        response_format: { type: "json_object" }
      });

      const processedData = JSON.parse(completion.choices[0].message.content);
      return NextResponse.json(processedData);
      */
    }

    return NextResponse.json(
      { error: 'Battle not found. Please try searching for "Battle of Cannae".' },
      { status: 404 }
    );
  } catch (error) {
    console.error('Error processing battle data:', error);
    return NextResponse.json(
      { error: 'Failed to process battle data' },
      { status: 500 }
    );
  }
} 