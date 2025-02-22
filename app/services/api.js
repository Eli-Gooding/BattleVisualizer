import OpenAI from 'openai';

let openai = null;

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
      const response = await fetch('/api/battle', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ battleName }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to fetch battle data');
      }

      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Error fetching battle data:', error);
      throw error;
    }
  }
};

export default api; 