import OpenAI from 'openai';
import axios from 'axios';

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
4. Units should maintain relative positions unless specifically moving
5. Each army should split their forces into appropriate sub-units (e.g., left wing cavalry, center infantry, etc.)
6. Scenes MUST show complete battle progression from start to finish:
   - Scene 1: Initial deployment/setup
   - Scene 2: Opening moves/first engagements
   - Scene 3: Major turning point or decisive action
   - Scene 4: Battle conclusion and outcome

Coordinate Spacing Rules:
1. Use relative coordinates to create clear unit separation:
   - Base coordinate spread should be 0.008 degrees (roughly 800m-1km)
   - Units within same army: minimum 0.002 degree separation
   - Opposing armies: minimum 0.004 degree initial separation
   - Flanking movements: up to 0.006 degree deviation from center
2. For battles with larger armies or wider frontage:
   - Scale coordinate spread proportionally to army sizes
   - Maximum spread of 0.016 degrees for very large battles
3. For smaller skirmishes or concentrated battles:
   - Reduce coordinate spread to 0.004-0.006 degrees
   - Maintain minimum 0.001 degree unit separation

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

// Add coordinate normalization helper
const normalizeCoordinates = (data) => {
  // Find the center point and spread of all unit positions
  let minLat = Infinity, maxLat = -Infinity;
  let minLng = Infinity, maxLng = -Infinity;
  let totalUnits = 0;

  data.scenes.forEach(scene => {
    scene.troops.forEach(troop => {
      minLat = Math.min(minLat, troop.position.lat, troop.movement.to.lat);
      maxLat = Math.max(maxLat, troop.position.lat, troop.movement.to.lat);
      minLng = Math.min(minLng, troop.position.lng, troop.movement.to.lng);
      maxLng = Math.max(maxLng, troop.position.lng, troop.movement.to.lng);
      totalUnits = Math.max(totalUnits, scene.troops.length);
    });
  });

  // Calculate desired spread based on number of units
  const baseSpread = 0.008; // ~800m-1km
  const spread = Math.min(0.016, Math.max(0.004, baseSpread * Math.sqrt(totalUnits / 10)));
  
  // Current spread
  const currentLatSpread = maxLat - minLat;
  const currentLngSpread = maxLng - minLng;
  
  // Calculate scaling factors
  const latScale = spread / (currentLatSpread || 1);
  const lngScale = spread / (currentLngSpread || 1);
  
  // Center point
  const centerLat = (minLat + maxLat) / 2;
  const centerLng = (minLng + maxLng) / 2;

  // Normalize all coordinates
  data.scenes = data.scenes.map(scene => ({
    ...scene,
    troops: scene.troops.map(troop => ({
      ...troop,
      position: {
        lat: centerLat + (troop.position.lat - centerLat) * latScale,
        lng: centerLng + (troop.position.lng - centerLng) * lngScale
      },
      movement: {
        ...troop.movement,
        to: {
          lat: centerLat + (troop.movement.to.lat - centerLat) * latScale,
          lng: centerLng + (troop.movement.to.lng - centerLng) * lngScale
        }
      }
    }))
  }));

  return data;
};

// Add position validation helper
const validateAndCorrectPositions = (data) => {
  data.scenes.forEach(scene => {
    // Group troops by side
    const troopsBySide = {};
    scene.troops.forEach(troop => {
      if (!troopsBySide[troop.side]) {
        troopsBySide[troop.side] = [];
      }
      troopsBySide[troop.side].push(troop);
    });

    // Process each side's troops
    Object.values(troopsBySide).forEach(sidesTroops => {
      // Find center units
      const centerUnits = sidesTroops.filter(troop => 
        troop.name.toLowerCase().includes('center') || 
        troop.id.toLowerCase().includes('center')
      );

      if (centerUnits.length > 0) {
        const centerUnit = centerUnits[0];
        const centerLng = centerUnit.position.lng;

        // Adjust other units relative to center
        sidesTroops.forEach(troop => {
          const name = troop.name.toLowerCase();
          const id = troop.id.toLowerCase();

          // Skip center units
          if (name.includes('center') || id.includes('center')) return;

          const isLeft = name.includes('left') || id.includes('left');
          const isRight = name.includes('right') || id.includes('right');

          if (isLeft && troop.position.lng >= centerLng) {
            // Move left unit to the left of center
            const offset = Math.abs(troop.position.lng - centerLng) + 0.002;
            troop.position.lng = centerLng - offset;
            troop.movement.to.lng = troop.movement.type === 'static' ? 
              troop.position.lng : 
              centerLng - (Math.abs(troop.movement.to.lng - centerLng) + 0.002);
          } else if (isRight && troop.position.lng <= centerLng) {
            // Move right unit to the right of center
            const offset = Math.abs(troop.position.lng - centerLng) + 0.002;
            troop.position.lng = centerLng + offset;
            troop.movement.to.lng = troop.movement.type === 'static' ? 
              troop.position.lng : 
              centerLng + (Math.abs(troop.movement.to.lng - centerLng) + 0.002);
          }
        });
      }

      // Handle cavalry positioning
      const infantryUnits = sidesTroops.filter(troop => 
        troop.type.toLowerCase().includes('infantry')
      );
      const cavalryUnits = sidesTroops.filter(troop => 
        troop.type.toLowerCase().includes('cavalry')
      );

      if (infantryUnits.length > 0 && cavalryUnits.length > 0) {
        const infantryCenter = infantryUnits.reduce((sum, unit) => sum + unit.position.lng, 0) / infantryUnits.length;
        
        cavalryUnits.forEach(cavalry => {
          const name = cavalry.name.toLowerCase();
          const id = cavalry.id.toLowerCase();
          
          if (name.includes('left') || id.includes('left')) {
            // Ensure left cavalry is further left than infantry
            const leftmostInfantry = Math.min(...infantryUnits.map(u => u.position.lng));
            if (cavalry.position.lng >= leftmostInfantry) {
              cavalry.position.lng = leftmostInfantry - 0.003;
              if (cavalry.movement.type === 'static') {
                cavalry.movement.to.lng = cavalry.position.lng;
              }
            }
          } else if (name.includes('right') || id.includes('right')) {
            // Ensure right cavalry is further right than infantry
            const rightmostInfantry = Math.max(...infantryUnits.map(u => u.position.lng));
            if (cavalry.position.lng <= rightmostInfantry) {
              cavalry.position.lng = rightmostInfantry + 0.003;
              if (cavalry.movement.type === 'static') {
                cavalry.movement.to.lng = cavalry.position.lng;
              }
            }
          }
        });
      }
    });
  });

  return data;
};

const api = {
  getBattleData: async (battleName) => {
    try {
      // Step 1: Search for the battle page using opensearch
      const searchQuery = battleName.trim().replace(/^(the\s+)?(battle\s+of\s+)/i, '');
      const encodedSearchQuery = encodeURIComponent(searchQuery);
      let battleReport;

      try {
        // First, search for potential matches
        const searchResponse = await axios.get(`https://en.wikipedia.org/w/api.php`, {
          params: {
            action: 'opensearch',
            search: encodedSearchQuery,
            namespace: 0, // Main namespace only
            limit: 5, // Get top 5 results
            format: 'json',
            origin: '*'
          }
        });

        const [_, titles, descriptions, urls] = searchResponse.data;
        
        // Find the most relevant battle result
        let battleTitle = null;
        for (let i = 0; i < titles.length; i++) {
          const title = titles[i].toLowerCase();
          const desc = descriptions[i].toLowerCase();
          // Check if it's likely a battle page
          if (
            title.includes('battle') || 
            desc.includes('battle') || 
            desc.includes('military') ||
            desc.includes('fought') ||
            desc.includes('conflict')
          ) {
            battleTitle = titles[i];
            break;
          }
        }

        if (!battleTitle) {
          // Try with "Battle of" prefix
          const retryResponse = await axios.get(`https://en.wikipedia.org/w/api.php`, {
            params: {
              action: 'opensearch',
              search: `Battle of ${encodedSearchQuery}`,
              namespace: 0,
              limit: 5,
              format: 'json',
              origin: '*'
            }
          });

          const [_, retryTitles, retryDescriptions] = retryResponse.data;
          for (let i = 0; i < retryTitles.length; i++) {
            const title = retryTitles[i].toLowerCase();
            const desc = retryDescriptions[i].toLowerCase();
            if (
              title.includes('battle') || 
              desc.includes('battle') || 
              desc.includes('military') ||
              desc.includes('fought') ||
              desc.includes('conflict')
            ) {
              battleTitle = retryTitles[i];
              break;
            }
          }
        }

        if (!battleTitle) {
          throw new Error(`No battle found matching: ${battleName}`);
        }

        // Now fetch the content for the found battle
        const contentResponse = await axios.get(`https://en.wikipedia.org/w/api.php`, {
          params: {
            action: 'query',
            prop: 'extracts',
            exintro: true,
            explaintext: true,
            titles: battleTitle,
            format: 'json',
            origin: '*'
          }
        });

        const pages = contentResponse.data.query.pages;
        const pageId = Object.keys(pages)[0];
        
        if (pageId === '-1' || !pages[pageId].extract) {
          throw new Error('Failed to fetch battle content');
        }

        battleReport = pages[pageId].extract;

        if (!battleReport || battleReport.trim().length === 0) {
          throw new Error('Wikipedia page found but no content extracted');
        }

        console.log(`Found battle: ${battleTitle}`);

      } catch (wikiError) {
        console.error('Wikipedia API error:', wikiError);
        throw new Error(`Failed to fetch battle information: ${wikiError.message}`);
      }

      // Step 2: First OpenAI call - Battle info and first 2 scenes
      const firstCall = await openai.chat.completions.create({
        model: "gpt-4",
        messages: [
          {
            role: "system",
            content: `You are a military history expert. Given a Wikipedia page extract for a battle, extract key information and structure it for visualization. For this first call, provide ONLY the historical context, battle info, and the first 2 scenes.

${PROMPT_RULES_AND_FORMAT}

IMPORTANT: Include ONLY scenes 1 and 2. The remaining scenes will be requested in a second call. Aim for 3-4 total scenes.`
          },
          {
            role: "user",
            content: battleReport
          }
        ],
        temperature: 0.5,
        max_tokens: 4000
      });

      let firstPartData;
      try {
        firstPartData = JSON.parse(firstCall.choices[0].message.content);
        console.log('First OpenAI Response:', firstPartData);
      } catch (parseError) {
        console.error('Failed to parse first OpenAI response:', parseError);
        console.error('Raw response:', firstCall.choices[0].message.content);
        throw new Error('Failed to parse battle data from first OpenAI response');
      }

      // Step 3: Second OpenAI call - Remaining scenes (3 and 4)
      const secondCall = await openai.chat.completions.create({
        model: "gpt-4",
        messages: [
          {
            role: "system",
            content: `You are a military history expert. Given a Wikipedia page extract and initial battle data, provide the remaining scenes (3 and 4) maintaining consistency with the previous scenes.

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
1. Use the EXACT SAME unit IDs as in the previous scenes
2. Maintain army names and unit types exactly as shown
3. Start with Scene 3 (id: 3)
4. Provide up to Scene 4 (id: 4) to reach 3-4 total scenes
5. Show ALL units in EVERY scene
6. Position units relative to each other based on their tactical roles and movements
7. Ensure movements and status changes follow logically from the previous scenes
8. Return ONLY an array of new scenes`
          },
          {
            role: "user",
            content: battleReport
          }
        ],
        temperature: 0.5,
        max_tokens: 4000
      });

      let remainingScenes;
      try {
        remainingScenes = JSON.parse(secondCall.choices[0].message.content);
        console.log('Second OpenAI Response:', remainingScenes);
      } catch (parseError) {
        console.error('Failed to parse second OpenAI response:', parseError);
        console.error('Raw response:', secondCall.choices[0].message.content);
        throw new Error('Failed to parse remaining scenes from second OpenAI response');
      }

      // Combine the responses
      firstPartData.scenes = [...firstPartData.scenes, ...remainingScenes];

      // After normalizing coordinates but before validation
      firstPartData = normalizeCoordinates(firstPartData);
      firstPartData = validateAndCorrectPositions(firstPartData);

      // Validate scene progression
      const sceneTypes = ['initial deployment', 'opening moves', 'turning point', 'conclusion'];
      const scenes = firstPartData.scenes;
      
      if (scenes.length < 4) {
        throw new Error('Invalid scene progression: need 4 scenes to show complete battle');
      }

      // Verify scene progression
      if (!scenes[0].title.toLowerCase().includes('initial') && 
          !scenes[0].description.toLowerCase().includes('initial')) {
        console.warn('First scene may not show initial deployment');
      }

      if (!scenes[scenes.length - 1].title.toLowerCase().includes('conclusion') && 
          !scenes[scenes.length - 1].description.toLowerCase().includes('conclusion') &&
          !scenes[scenes.length - 1].description.toLowerCase().includes('outcome')) {
        console.warn('Final scene may not show battle conclusion');
      }

      // Step 4: Validation
      if (!firstPartData.scenes || !Array.isArray(firstPartData.scenes)) {
        throw new Error('Invalid data structure: missing scenes array');
      }

      if (!firstPartData.battleInfo?.armies || typeof firstPartData.battleInfo.armies !== 'object') {
        throw new Error('Invalid data structure: missing or invalid armies object');
      }

      const armyIds = Object.keys(firstPartData.battleInfo.armies);
      if (armyIds.length < 2) {
        throw new Error('Invalid data structure: at least two armies are required');
      }

      armyIds.forEach(armyId => {
        const army = firstPartData.battleInfo.armies[armyId];
        if (!army.name || !army.color || !army.commander) {
          throw new Error(`Invalid army data for ${armyId}: missing required fields`);
        }
      });

      firstPartData.scenes.forEach((scene, index) => {
        if (!scene.troops || !Array.isArray(scene.troops)) {
          throw new Error(`Invalid scene ${index + 1}: missing troops array`);
        }
        scene.troops.forEach((troop, troopIndex) => {
          if (!armyIds.includes(troop.side)) {
            throw new Error(`Scene ${index + 1}, Troop ${troopIndex + 1}: Invalid army reference "${troop.side}"`);
          }
          if (!troop.status || !['active', 'routed', 'defeated'].includes(troop.status)) {
            console.warn(`Scene ${index + 1}, Troop ${troopIndex + 1}: Invalid status. Setting to "active".`);
            troop.status = 'active';
          }
        });
      });

      // After all validations pass and before returning the data
      console.log('Generating audio for battle content...');
      
      // Generate audio for historical context
      const contextAudioUrl = await api.generateNarrationAudio(firstPartData.historicalContext);
      
      // Generate audio for each scene
      const sceneAudioUrls = await Promise.all(
        firstPartData.scenes.map(async (scene) => {
          return api.generateNarrationAudio(scene.description);
        })
      );

      // Add audio URLs to the response
      firstPartData.audio = {
        contextAudio: contextAudioUrl,
        sceneAudios: sceneAudioUrls
      };

      return firstPartData;

    } catch (error) {
      console.error('Error fetching battle data:', error);
      throw error;
    }
  },

  generateNarrationAudio: async (text) => {
    try {
      console.log('Generating narration for text:', text.substring(0, 100) + '...');
      
      if (!openai) {
        throw new Error('OpenAI client not initialized');
      }

      if (!text || typeof text !== 'string') {
        throw new Error('Invalid text input for narration');
      }

      // Trim and clean the text
      const cleanText = text.trim().replace(/\s+/g, ' ');
      
      if (cleanText.length === 0) {
        throw new Error('Empty text input for narration');
      }

      console.log('Making TTS API call...');
      const response = await openai.audio.speech.create({
        model: "tts-1",
        voice: "onyx", // Deep, authoritative voice perfect for historical narration
        input: cleanText,
        response_format: "mp3",
      });

      console.log('TTS API call successful, converting to blob...');
      const audioBlob = await response.blob();
      const audioUrl = URL.createObjectURL(audioBlob);
      console.log('Audio URL created:', audioUrl);

      return audioUrl;
    } catch (error) {
      console.error('Error in generateNarrationAudio:', error);
      throw error;
    }
  },

  generateBattleNarration: async (battleData) => {
    try {
      console.log('Starting battle narration generation...');
      
      if (!battleData?.historicalContext || !battleData?.scenes) {
        throw new Error('Invalid battle data for narration');
      }

      // Generate audio for historical context
      console.log('Generating historical context audio...');
      const contextAudio = await api.generateNarrationAudio(battleData.historicalContext);

      // Generate audio for each scene
      console.log('Generating scene audio...');
      const sceneAudios = await Promise.all(
        battleData.scenes.map(async (scene, index) => {
          console.log(`Generating audio for scene ${index + 1}...`);
          return api.generateNarrationAudio(scene.description);
        })
      );

      console.log('All audio generated successfully');
      return {
        contextAudio,
        sceneAudios
      };
    } catch (error) {
      console.error('Error in generateBattleNarration:', error);
      throw error;
    }
  }
};

export default api;