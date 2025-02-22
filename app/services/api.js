import OpenAI from 'openai';

let openai = null;

const PROMPT_RULES_AND_FORMAT = `RESPONSE FORMAT REQUIREMENTS:
1. Response must be valid, complete JSON
2. No trailing commas in arrays or objects
3. All coordinates must be numbers, not strings
4. Keep scene descriptions concise
5. Use short but descriptive unit names
6. Limit the total response size
7. DO NOT include any text outside the JSON structure

IMPORTANT VISUALIZATION RULES:
1. ALL units must remain visible in ALL scenes
2. Each side should have MULTIPLE units of different types (e.g., both infantry and cavalry units)
3. When a scene focuses on specific units' actions, other units should still be shown (either in position or moving)
4. Keep all action within a reasonable view (use ±0.004 lat/lng from center point maximum)
5. Units should maintain relative positions unless specifically moving
6. Each army should split their forces into appropriate sub-units (e.g., left wing cavalry, center infantry, etc.)

Format the output as JSON with this structure:
{
  "historicalContext": "string",
  "battleInfo": {
    "date": "string",
    "location": {
      "name": "string",
      "coordinates": {
        "lat": number,
        "lng": number
      }
    },
    "armies": {
      [armyId: string]: {
        "name": "string (full name of the army/faction)",
        "total": number,
        "infantry": number,
        "cavalry": number,
        "color": "string (hex color code for visualization)",
        "commander": "string (name of commanding officer)"
      }
    }
  },
  "scenes": [
    {
      "id": number,
      "title": "string",
      "description": "string",
      "troops": [
        {
          "id": "string (unique identifier for this unit, e.g., 'roman_left_infantry')",
          "side": "string (matching an armyId from armies object)",
          "type": "string (unit type based on the historical context)",
          "name": "string (descriptive name of the unit, e.g., 'Left Wing Heavy Infantry')",
          "size": number,
          "status": "active|routed|defeated",
          "position": {
            "lat": number,
            "lng": number
          },
          "movement": {
            "to": {
              "lat": number,
              "lng": number
            },
            "type": "advance|retreat|flank|static"
          }
        }
      ]
    }
  ]
}

Unit Distribution Rules:
1. EACH army must be split into multiple units:
   - Infantry should be divided into at least 2-3 units (e.g., center, left wing, right wing)
   - Cavalry should be divided into at least 2 units (left and right wings)
   - Additional specialized units as historically appropriate
2. Unit sizes should reflect historical records:
   - Main infantry units: ~30-40% of total infantry
   - Wing infantry units: ~20-30% each
   - Cavalry wings: Split based on historical records
   - Specialized units: Historically accurate sizes

Positioning Rules:
1. Initial Deployment (Scene 1):
   - Center point is the battle location coordinates
   - Infantry units spaced ±0.002 lat/lng from center
   - Cavalry units on flanks (±0.003 lat/lng from center)
   - Maintain historical formation patterns
2. Subsequent Scenes:
   - ALL units must be present in EVERY scene
   - Update positions only for units actively moving
   - Static units keep their previous positions
   - Show simultaneous movements when historically accurate
3. Status Changes:
   - All units start as "active"
   - Update to "routed" when forced to retreat
   - Update to "defeated" when destroyed/captured
   - Status changes should affect specific units, not entire armies at once

Movement Types:
- "advance": Moving forward to engage
- "retreat": Falling back under pressure
- "flank": Moving to attack enemy flanks/rear
- "static": Holding position`;

// Initialize OpenAI only on the client side
if (typeof window !== 'undefined') {
  openai = new OpenAI({
    apiKey: process.env.NEXT_PUBLIC_OPENAI_API_KEY,
    dangerouslyAllowBrowser: true // Required for browser usage
  });
}

// Mock data for testing visualization
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

// The test report content is stored as a constant
const CANNAE_REPORT = `# Battle of Cannae Report

## Key Points
- **Date:** August 2, 216 BC
- **Location:** Near Cannae, Apulia, Italy
- **Context:** Second Punic War between Rome and Carthage
- **Outcome:** Hannibal's decisive victory using double envelopment
- **Casualties:** Rome: 55,000–70,000; Carthage: 5,700–8,000

## Historical Context
The Battle of Cannae, fought on August 2, 216 BC, was a critical engagement in the Second Punic War (218–201 BC), a conflict ignited by Carthage's expansion in Spain. Hannibal Barca, after crossing the Alps in 218 BC with his army and elephants, had already defeated Roman forces at Trebia (218 BC) and Lake Trasimene (217 BC). Frustrated by Rome's attrition strategy under Fabius Maximus, the Romans raised an unprecedented army of ~86,400 men under consuls Lucius Aemilius Paullus and Gaius Terentius Varro to confront Hannibal, who had seized the Roman supply depot at Cannae.

## Battle Details
- **Date and Location:** August 2, 216 BC, near Cannae, Apulia, Italy (approx. 41°18′23″N, 16°7′57″E)
- **Armies Involved:**
  - **Rome:** ~86,400 men
    - Roman infantry: 24,000
    - Roman cavalry: 1,800
    - Allied infantry: 42,000
    - Allied cavalry: 4,200
  - **Carthage:** ~50,000 men
    - African infantry: 12,000
    - African cavalry: 4,000
    - Spanish/Gallic infantry: 32,000
    - Spanish/Gallic cavalry: 6,000–7,000

### Sequence of Events
| **Phase**            | **Description**                                                                 |
|-----------------------|---------------------------------------------------------------------------------|
| Initial Engagement   | Roman infantry advances, pushing Carthaginian center back in a controlled retreat. |
| Cavalry Engagements  | Carthaginian heavy cavalry routs Roman cavalry; Numidians pin allied cavalry. |
| Encirclement         | African infantry and cavalry encircle Romans, closing the trap.                |
| Massacre             | Encircled Romans are systematically destroyed.                                 |

### Troop Movements
| **Stage**            | **Description**                                                                                       |
|-----------------------|-----------------------------------------------------------------------------------------------|
| Initial Deployment   | Romans: Infantry (-100, 100) to (100, 150), Heavy Cav (-100, 150) to (-150, 200), Light Cav (100, 150) to (150, 200). Carthage: Center (-80, -50) to (80, 0), African Flanks (-80, 0) to (-120, 50) & (80, 0) to (120, 50), Heavy Cav (120, 0) to (150, 50), Numidian Cav (-120, 0) to (-150, 50). |
| Roman Advance        | Infantry moves from y=100 to y=0; Carthaginian center retreats to y=-20.                     |
| Cavalry Engagements  | Heavy Cav moves from x=120 to x=-100 to x=100 at y=120; Numidians engage at Roman right.    |
| Encirclement         | African infantry closes in; Heavy Cav attacks from rear.                                     |
| Massacre             | Encircled Roman forces diminish rapidly.                                                    |`;

const api = {
  getBattleData: async (battleName) => {
    try {
      // Read the battle report based on the battle name
      const response = await fetch(`/api/battle`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ battleName }),
      });

      if (!response.ok) {
        throw new Error('Failed to fetch battle data');
      }

      const reportData = await response.json();
      
      // First call: Get battle info and first 2 scenes
      const firstCall = await openai.chat.completions.create({
        model: "gpt-4",
        messages: [
          {
            role: "system",
            content: `You are a military history expert. Given a battle report, extract key information and structure it for visualization. For this first call, provide ONLY the battle info and first 2 scenes.

${PROMPT_RULES_AND_FORMAT}

IMPORTANT: For this first call, include ONLY scenes 1 and 2. The remaining scenes will be requested in a second call.`
          },
          {
            role: "user",
            content: reportData.report
          }
        ],
        temperature: 0.5,
        max_tokens: 4000
      });

      // Parse first response
      console.log('First OpenAI Response:', firstCall.choices[0].message.content);
      let firstPartData = JSON.parse(firstCall.choices[0].message.content);

      // Second call: Get remaining scenes
      const secondCall = await openai.chat.completions.create({
        model: "gpt-4",
        messages: [
          {
            role: "system",
            content: `You are a military history expert. Given a battle report and its initial scenes, provide the remaining scenes (3 and 4) maintaining consistency with the previous scenes.

The battle data so far:
${JSON.stringify(firstPartData, null, 2)}

Format your response as a JSON array of ONLY the remaining scenes, following this structure:
[
  {
    "id": number,
    "title": "string",
    "description": "string",
    "troops": [
      {
        "id": "string",
        "side": "string",
        "type": "string",
        "name": "string",
        "size": number,
        "status": "active|routed|defeated",
        "position": {"lat": number, "lng": number},
        "movement": {
          "to": {"lat": number, "lng": number},
          "type": "advance|retreat|flank|static"
        }
      }
    ]
  }
]

IMPORTANT: 
1. Use the EXACT SAME unit IDs as shown in the previous scenes
2. Maintain army names and unit types exactly as shown
3. Start with Scene 3 (id: 3)
4. Show ALL units in EVERY scene
5. Keep coordinates within ±0.004 of the battle center (${firstPartData.battleInfo.location.coordinates.lat}, ${firstPartData.battleInfo.location.coordinates.lng})
6. Ensure movements and status changes follow logically from the previous scenes
7. Return ONLY an array of new scenes - do not include any other fields`
          },
          {
            role: "user",
            content: reportData.report
          }
        ],
        temperature: 0.5,
        max_tokens: 4000
      });

      // Parse second response
      console.log('Second OpenAI Response:', secondCall.choices[0].message.content);
      let remainingScenes = JSON.parse(secondCall.choices[0].message.content);

      // Combine the responses
      firstPartData.scenes = [...firstPartData.scenes, ...remainingScenes];

      // Validate the combined data structure
      if (!firstPartData.scenes || !Array.isArray(firstPartData.scenes)) {
        throw new Error('Invalid data structure: missing scenes array');
      }

      // Validate armies object
      if (!firstPartData.battleInfo?.armies || typeof firstPartData.battleInfo.armies !== 'object') {
        throw new Error('Invalid data structure: missing or invalid armies object');
      }

      const armyIds = Object.keys(firstPartData.battleInfo.armies);
      if (armyIds.length < 2) {
        throw new Error('Invalid data structure: at least two armies are required');
      }

      // Ensure each army has required fields
      armyIds.forEach(armyId => {
        const army = firstPartData.battleInfo.armies[armyId];
        if (!army.name || !army.color || !army.commander) {
          throw new Error(`Invalid army data for ${armyId}: missing required fields`);
        }
      });

      // Ensure each scene has the required fields
      firstPartData.scenes.forEach((scene, index) => {
        if (!scene.troops || !Array.isArray(scene.troops)) {
          throw new Error(`Invalid scene ${index + 1}: missing troops array`);
        }
        
        // Ensure each troop has required fields and valid army reference
        scene.troops.forEach((troop, troopIndex) => {
          if (!armyIds.includes(troop.side)) {
            throw new Error(`Scene ${index + 1}, Troop ${troopIndex + 1}: Invalid army reference "${troop.side}"`);
          }
          
          if (!troop.status || !['active', 'routed', 'defeated'].includes(troop.status)) {
            console.warn(`Scene ${index + 1}, Troop ${troopIndex + 1}: Missing or invalid status. Setting to "active".`);
            troop.status = 'active';
          }
        });
      });

      return firstPartData;

    } catch (error) {
      console.error('Error fetching battle data:', error);
      throw error;
    }
  }
};

export default api; 