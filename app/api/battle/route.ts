import { NextResponse } from 'next/server';
import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY // Use server-side env variable (not NEXT_PUBLIC_)
});

// Mock data for testing
const MOCK_RESPONSE = {
  historicalContext: "The Battle of Cannae was a major battle of the Second Punic War that took place on August 2, 216 BC in Apulia, southeastern Italy. It is regarded as one of the greatest tactical feats in military history and one of the worst defeats suffered by the Roman Republic.",
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
        infantry: 80000,
        cavalry: 6400
      },
      carthaginian: {
        total: 50000,
        infantry: 40000,
        cavalry: 10000
      }
    }
  },
  scenes: [
    {
      id: 1,
      title: "Initial Deployment",
      description: "Romans positioned infantry in dense formation at center with cavalry on flanks. Carthaginians formed a crescent formation with African heavy infantry at the rear corners.",
      troops: [
        {
          id: "roman_inf_center",
          side: "roman",
          type: "infantry",
          size: 80000,
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
          size: 3200,
          position: {
            lat: 41.3067,
            lng: 16.1300
          },
          movement: {
            to: {
              lat: 41.3067,
              lng: 16.1300
            },
            type: "static"
          }
        },
        {
          id: "roman_cav_right",
          side: "roman",
          type: "cavalry",
          size: 3200,
          position: {
            lat: 41.3047,
            lng: 16.1344
          },
          movement: {
            to: {
              lat: 41.3047,
              lng: 16.1344
            },
            type: "static"
          }
        },
        {
          id: "carthage_center",
          side: "carthaginian",
          type: "infantry",
          size: 20000,
          position: {
            lat: 41.3087,
            lng: 16.1322
          },
          movement: {
            to: {
              lat: 41.3087,
              lng: 16.1322
            },
            type: "static"
          }
        },
        {
          id: "carthage_cav_left",
          side: "carthaginian",
          type: "cavalry",
          size: 5000,
          position: {
            lat: 41.3097,
            lng: 16.1300
          },
          movement: {
            to: {
              lat: 41.3097,
              lng: 16.1300
            },
            type: "static"
          }
        },
        {
          id: "carthage_cav_right",
          side: "carthaginian",
          type: "cavalry",
          size: 5000,
          position: {
            lat: 41.3077,
            lng: 16.1344
          },
          movement: {
            to: {
              lat: 41.3077,
              lng: 16.1344
            },
            type: "static"
          }
        }
      ]
    },
    {
      id: 2,
      title: "Cavalry Engagement",
      description: "Carthaginian cavalry engaged and defeated Roman cavalry on both flanks. Roman infantry advanced against Carthaginian center.",
      troops: [
        {
          id: "roman_inf_center",
          side: "roman",
          type: "infantry",
          size: 80000,
          position: {
            lat: 41.3067,
            lng: 16.1322
          },
          movement: {
            to: {
              lat: 41.3077,
              lng: 16.1322
            },
            type: "advance"
          }
        },
        {
          id: "roman_cav_left",
          side: "roman",
          type: "cavalry",
          size: 3200,
          position: {
            lat: 41.3067,
            lng: 16.1300
          },
          movement: {
            to: {
              lat: 41.3077,
              lng: 16.1290
            },
            type: "retreat"
          }
        },
        {
          id: "roman_cav_right",
          side: "roman",
          type: "cavalry",
          size: 3200,
          position: {
            lat: 41.3047,
            lng: 16.1344
          },
          movement: {
            to: {
              lat: 41.3037,
              lng: 16.1354
            },
            type: "retreat"
          }
        },
        {
          id: "carthage_center",
          side: "carthaginian",
          type: "infantry",
          size: 20000,
          position: {
            lat: 41.3087,
            lng: 16.1322
          },
          movement: {
            to: {
              lat: 41.3077,
              lng: 16.1322
            },
            type: "retreat"
          }
        },
        {
          id: "carthage_cav_left",
          side: "carthaginian",
          type: "cavalry",
          size: 5000,
          position: {
            lat: 41.3097,
            lng: 16.1300
          },
          movement: {
            to: {
              lat: 41.3077,
              lng: 16.1290
            },
            type: "advance"
          }
        },
        {
          id: "carthage_cav_right",
          side: "carthaginian",
          type: "cavalry",
          size: 5000,
          position: {
            lat: 41.3077,
            lng: 16.1344
          },
          movement: {
            to: {
              lat: 41.3037,
              lng: 16.1354
            },
            type: "advance"
          }
        }
      ]
    },
    {
      id: 3,
      title: "The Double Envelopment",
      description: "Carthaginian center withdrew while wings held, forming a pocket. African infantry advanced from rear corners, completing the encirclement of Roman army.",
      troops: [
        {
          id: "roman_inf_center",
          side: "roman",
          type: "infantry",
          size: 80000,
          position: {
            lat: 41.3077,
            lng: 16.1322
          },
          movement: {
            to: {
              lat: 41.3077,
              lng: 16.1322
            },
            type: "static"
          }
        },
        {
          id: "carthage_center",
          side: "carthaginian",
          type: "infantry",
          size: 20000,
          position: {
            lat: 41.3077,
            lng: 16.1322
          },
          movement: {
            to: {
              lat: 41.3087,
              lng: 16.1322
            },
            type: "retreat"
          }
        },
        {
          id: "carthage_inf_left",
          side: "carthaginian",
          type: "infantry",
          size: 10000,
          position: {
            lat: 41.3077,
            lng: 16.1290
          },
          movement: {
            to: {
              lat: 41.3077,
              lng: 16.1310
            },
            type: "advance"
          }
        },
        {
          id: "carthage_inf_right",
          side: "carthaginian",
          type: "infantry",
          size: 10000,
          position: {
            lat: 41.3077,
            lng: 16.1354
          },
          movement: {
            to: {
              lat: 41.3077,
              lng: 16.1334
            },
            type: "advance"
          }
        },
        {
          id: "carthage_cav_combined",
          side: "carthaginian",
          type: "cavalry",
          size: 10000,
          position: {
            lat: 41.3057,
            lng: 16.1322
          },
          movement: {
            to: {
              lat: 41.3077,
              lng: 16.1322
            },
            type: "advance"
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