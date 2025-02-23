'use client';

import React, { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import * as d3 from 'd3';

function BattleMapContent({ battleData, currentScene }) {
  const mapRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const svgLayerRef = useRef(null);
  const [isAnimating, setIsAnimating] = useState(false);
  const [unitStates, setUnitStates] = useState({});

  // Reset unit states when battle data changes or when returning to first scene
  useEffect(() => {
    if (currentScene === 0 || !battleData) {
      setUnitStates({});
    }
  }, [battleData, currentScene]);

  // Initialize map
  useEffect(() => {
    if (!mapInstanceRef.current && mapRef.current && battleData) {
      const { lat, lng } = battleData.battleInfo.location.coordinates;
      
      // Initialize the map centered on battle location with controls disabled
      mapInstanceRef.current = L.map(mapRef.current, {
        dragging: false,
        touchZoom: false,
        doubleClickZoom: false,
        scrollWheelZoom: false,
        boxZoom: false,
        keyboard: false,
        zoomControl: false
      }).setView([lat, lng], 15);

      // Add OpenStreetMap tiles
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© OpenStreetMap contributors'
      }).addTo(mapInstanceRef.current);

      // Create SVG layer for D3
      const svg = d3.select(mapRef.current)
        .append('svg')
        .style('position', 'absolute')
        .style('top', '0')
        .style('left', '0')
        .style('z-index', '1000')
        .attr('width', '100%')
        .attr('height', '100%')
        .attr('pointer-events', 'none');
      
      svgLayerRef.current = svg.append('g')
        .attr('class', 'leaflet-zoom-hide');
    }

    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, [battleData]);

  // Update troop positions with animations
  const updateTroopPositions = async (animate = false) => {
    if (!battleData || !mapInstanceRef.current || !svgLayerRef.current) return;
    setIsAnimating(true);

    const scene = battleData.scenes[currentScene];
    if (!scene || !scene.troops) return;

    // First, update unit states for the current scene
    const newUnitStates = {};  // Start fresh each scene
    scene.troops.forEach(troop => {
      // If this is the first scene, initialize the unit
      if (currentScene === 0) {
        newUnitStates[troop.id] = {
          position: troop.position,
          status: troop.status,
          lastSeenInScene: 0,
          facingAngle: 0 // Set initial facing angle to 0 degrees (east)
        };
      } else {
        // Update unit state for this scene
        newUnitStates[troop.id] = {
          position: troop.movement?.to || troop.position,
          status: troop.status,
          lastSeenInScene: currentScene
        };
      }
    });

    // Update state and wait for it to complete
    await new Promise(resolve => {
      setUnitStates(newUnitStates);
      // Use a setTimeout to ensure state has updated
      setTimeout(resolve, 0);
    });

    const svg = svgLayerRef.current;
    svg.selectAll('*').remove();

    // Create groups for each army
    const armyGroups = {};
    Object.keys(battleData.battleInfo.armies).forEach(armyId => {
      armyGroups[armyId] = svg.append('g').attr('class', `${armyId}-troops`);
    });

    // Add arrow marker definition
    const defs = svg.append('defs');
    defs.append('marker')
      .attr('id', 'arrow')
      .attr('viewBox', '0 -5 10 10')
      .attr('refX', 8)
      .attr('refY', 0)
      .attr('markerWidth', 6)
      .attr('markerHeight', 6)
      .attr('orient', 'auto')
      .append('path')
      .attr('d', 'M0,-5L10,0L0,5')
      .attr('fill', '#666');

    // First, draw all movement arrows
    const arrows = [];
    scene.troops.forEach(troop => {
      // Only draw arrows for troops that exist and are active in this scene
      if (troop.movement && troop.movement.type !== 'static' && troop.status !== 'defeated') {
        const previousState = unitStates[troop.id];
        const startPos = currentScene === 0 ? 
          troop.position : 
          (previousState?.position || troop.position);

        const startPoint = mapInstanceRef.current.latLngToLayerPoint([
          startPos.lat,
          startPos.lng
        ]);
        const endPoint = mapInstanceRef.current.latLngToLayerPoint([
          troop.movement.to.lat,
          troop.movement.to.lng
        ]);

        const arrow = svg.append('line')
          .attr('x1', startPoint.x)
          .attr('y1', startPoint.y)
          .attr('x2', startPoint.x)
          .attr('y2', startPoint.y)
          .attr('stroke', troop.movement.type === 'retreat' ? '#ff0000' : '#00ff00')
          .attr('stroke-width', 2)
          .attr('opacity', 0)
          .attr('marker-end', 'url(#arrow)');

        arrows.push({
          element: arrow,
          endX: endPoint.x,
          endY: endPoint.y
        });
      }
    });

    // Draw troops at their current positions
    const troopElements = scene.troops.map(troop => {
      const previousState = unitStates[troop.id];
      
      // Skip drawing if:
      // 1. Unit was routed in a previous scene
      // 2. Unit was defeated in a previous scene
      if (previousState && previousState.lastSeenInScene < currentScene &&
          (previousState.status === 'routed' || previousState.status === 'defeated')) {
        return { unit: null, troop, positions: null };
      }

      const army = battleData.battleInfo.armies[troop.side];
      const group = armyGroups[troop.side];
      const currentPos = currentScene === 0 ? 
        troop.position : 
        (previousState?.position || troop.position);

      const startPoint = mapInstanceRef.current.latLngToLayerPoint([
        currentPos.lat,
        currentPos.lng
      ]);
      const endPoint = troop.movement && troop.movement.type !== 'static' 
        ? mapInstanceRef.current.latLngToLayerPoint([
            troop.movement.to.lat,
            troop.movement.to.lng
          ])
        : startPoint;

      // Calculate size of unit representation based on troop size
      const radius = Math.sqrt(troop.size / 1000) * 5;
      // Calculate rectangle dimensions based on unit type and size
      const unitDimensions = {
        width: troop.type === 'infantry' ? radius * 3 : radius * 2, // Long side is now width
        height: troop.type === 'infantry' ? radius : radius * 1.5  // Short side is now height
      };

      // For miscellaneous unit types (not infantry/cavalry/artillery), adjust dimensions
      if (!['infantry', 'cavalry', 'artillery'].includes(troop.type)) {
        unitDimensions.width = radius * 2.5;  // Medium length
        unitDimensions.height = radius * 1.2; // Slightly taller than standard
      }

      // Calculate unit facing angle
      const calculateFacingAngle = (start, end, defaultAngle = 0) => {
        if (start && end && (start.lat !== end.lat || start.lng !== end.lng)) {
          // Calculate angle based on movement direction
          const dx = end.lng - start.lng;
          const dy = end.lat - start.lat;
          // Add 90 degrees to make the long side perpendicular to movement
          return (Math.atan2(dy, dx) * 180 / Math.PI) + 90;
        }
        return defaultAngle; // Default to previous angle or 0 (east-facing)
      };

      // Get initial facing angle based on movement or previous state
      const initialAngle = calculateFacingAngle(
        currentPos,
        troop.movement?.type !== 'static' ? troop.movement.to : null,
        previousState?.facingAngle || 90 // Default to 90 degrees if no previous state (facing north)
      );

      // Create unit representation with rotation
      const unit = group.append('g')
        .attr('transform', `translate(${startPoint.x},${startPoint.y}) rotate(${initialAngle})`)
        .style('opacity', previousState ? (previousState.status === 'routed' ? 1 : previousState.status === 'defeated' ? 0.3 : 0.7) : 0.7);

      // Store initial position and angle for animations
      const positions = {
        start: startPoint,
        end: endPoint,
        startAngle: initialAngle,
        endAngle: calculateFacingAngle(
          troop.position,
          troop.movement?.type !== 'static' ? troop.movement.to : null,
          initialAngle
        )
      };

      // Function to create a sub-unit (now with rotation consideration)
      const createSubUnit = (offsetX = 0, offsetY = 0, subUnitWidth = unitDimensions.width, subUnitHeight = unitDimensions.height) => {
        const subUnit = unit.append('g')
          .attr('transform', `translate(${offsetX},${offsetY})`);

        // Main rectangle for the sub-unit - width is the long side and should be horizontal
        const rect = subUnit.append('rect')
          .attr('x', -subUnitWidth / 2)
          .attr('y', -subUnitHeight / 2)
          .attr('width', subUnitWidth)
          .attr('height', subUnitHeight)
          .attr('fill', army.color)
          .attr('stroke', '#fff')
          .attr('stroke-width', 1)
          .attr('pointer-events', 'all');

        // Add direction indicator (small triangle at the front)
        subUnit.append('path')
          .attr('d', `M${subUnitWidth/2},0 L${subUnitWidth/2 + subUnitHeight/4},${subUnitHeight/4} L${subUnitWidth/2 + subUnitHeight/4},${-subUnitHeight/4} Z`)
          .attr('fill', '#fff')
          .attr('opacity', 0.7);

        // Add hover events to the rectangle
        rect.on('mouseover', () => {
          tooltip.style('opacity', 1);
        })
        .on('mouseout', () => {
          tooltip.style('opacity', 0);
        });

        return subUnit;
      };

      // Create sub-units based on unit type and name
      if (troop.type === 'infantry') {
        // Single rectangular formation for infantry
        createSubUnit();
      } else if (troop.type === 'cavalry') {
        const name = troop.name.toLowerCase();
        const id = troop.id.toLowerCase();
        
        if (name.includes('left') || id.includes('left')) {
          // Create two smaller cavalry units for left flank
          createSubUnit(-unitDimensions.height * 0.6, 0, unitDimensions.width, unitDimensions.height * 0.4);
          createSubUnit(unitDimensions.height * 0.6, 0, unitDimensions.width, unitDimensions.height * 0.4);
        } else if (name.includes('right') || id.includes('right')) {
          // Create two smaller cavalry units for right flank
          createSubUnit(-unitDimensions.height * 0.6, 0, unitDimensions.width, unitDimensions.height * 0.4);
          createSubUnit(unitDimensions.height * 0.6, 0, unitDimensions.width, unitDimensions.height * 0.4);
        } else {
          // Single unit for other cavalry
          createSubUnit();
        }
      } else if (troop.type === 'artillery') {
        // More square formation for artillery
        createSubUnit(0, 0, unitDimensions.width, unitDimensions.height);
      } else {
        // Default representation for other unit types (archers, skirmishers, etc.)
        createSubUnit();
      }

      // Add type-specific indicators
      switch(troop.type) {
        case 'cavalry':
          // Add small dots in the center of each cavalry sub-unit
          if (troop.name.toLowerCase().includes('left') || troop.id.toLowerCase().includes('left')) {
            unit.append('circle')
              .attr('cx', -unitDimensions.height * 0.6)
              .attr('r', 2)
              .attr('fill', '#fff');
            unit.append('circle')
              .attr('cx', unitDimensions.height * 0.6)
              .attr('r', 2)
              .attr('fill', '#fff');
          } else if (troop.name.toLowerCase().includes('right') || troop.id.toLowerCase().includes('right')) {
            unit.append('circle')
              .attr('cx', -unitDimensions.height * 0.6)
              .attr('r', 2)
              .attr('fill', '#fff');
            unit.append('circle')
              .attr('cx', unitDimensions.height * 0.6)
              .attr('r', 2)
              .attr('fill', '#fff');
          } else {
            unit.append('circle')
              .attr('r', 2)
              .attr('fill', '#fff');
          }
          break;
        case 'artillery':
          // Add cross marker for artillery
          unit.append('path')
            .attr('d', `M-${unitDimensions.height/4},0 L${unitDimensions.height/4},0 M0,-${unitDimensions.width/2} L0,${unitDimensions.width/2}`)
            .attr('stroke', '#fff')
            .attr('stroke-width', 2);
          break;
        default:
          // Add a distinctive marker for other unit types (diamond shape)
          unit.append('path')
            .attr('d', `M0,-${unitDimensions.height/3} L${unitDimensions.height/3},0 L0,${unitDimensions.height/3} L-${unitDimensions.height/3},0 Z`)
            .attr('fill', '#fff')
            .attr('opacity', 0.7);
          break;
      }

      // Add hover tooltip
      const tooltip = unit.append('g')
        .attr('class', 'tooltip')
        .style('opacity', 0)
        .attr('transform', `translate(${unitDimensions.width + 10}, -${unitDimensions.height})`);

      tooltip.append('rect')
        .attr('rx', 5)
        .attr('ry', 5)
        .attr('width', 250)
        .attr('height', 120)
        .attr('fill', 'black')
        .attr('opacity', 0.8);

      tooltip.append('text')
        .attr('x', 10)
        .attr('y', 20)
        .attr('fill', 'white')
        .text(`${troop.name}`);

      tooltip.append('text')
        .attr('x', 10)
        .attr('y', 40)
        .attr('fill', 'white')
        .text(`Army: ${army.name}`);

      tooltip.append('text')
        .attr('x', 10)
        .attr('y', 60)
        .attr('fill', 'white')
        .text(`Type: ${troop.type.charAt(0).toUpperCase() + troop.type.slice(1)}`);

      tooltip.append('text')
        .attr('x', 10)
        .attr('y', 80)
        .attr('fill', 'white')
        .text(`Size: ${troop.size.toLocaleString()} troops`);

      tooltip.append('text')
        .attr('x', 10)
        .attr('y', 100)
        .attr('fill', previousState?.status === 'active' ? '#4ade80' : previousState?.status === 'routed' ? '#fbbf24' : '#ef4444')
        .text(`Status: ${previousState?.status === 'active' ? 'Active' : previousState?.status === 'routed' ? 'Routed' : 'Defeated'}`);

      return { unit, troop, positions };
    });

    if (animate) {
      // First animate the arrows appearing
      await Promise.all(arrows.map(arrow => {
        return new Promise(resolve => {
          arrow.element
            .transition()
            .duration(500)
            .attr('opacity', 0.5)
            .transition()
            .duration(1000)
            .attr('x2', arrow.endX)
            .attr('y2', arrow.endY)
            .end()
            .then(resolve);
        });
      }));

      // Then animate the troops
      await Promise.all(troopElements.map(({ unit, troop, positions }) => {
        // Skip if unit is null (routed from previous scene)
        if (!unit) return Promise.resolve();

        if (troop.status === 'defeated') {
          return new Promise(resolve => {
            unit.transition()
              .delay(500)
              .duration(2000)
              .style('opacity', 0.1)
              .end()
              .then(() => {
                // Update the unit's state
                setUnitStates(prev => ({
                  ...prev,
                  [troop.id]: {
                    position: troop.position,
                    status: 'defeated',
                    lastSeenInScene: currentScene
                  }
                }));
                resolve();
              });
          });
        } else if (troop.status === 'routed') {
          return new Promise(resolve => {
            unit.transition()
              .delay(500)
              .duration(2000)
              .attr('transform', `translate(${positions.end.x},${positions.end.y})`)
              .style('opacity', 0)
              .end()
              .then(() => {
                // Update the unit's position and status
                setUnitStates(prev => ({
                  ...prev,
                  [troop.id]: {
                    position: troop.movement.to,
                    status: 'routed',
                    lastSeenInScene: currentScene
                  }
                }));
                resolve();
              });
          });
        } else if (troop.movement && troop.movement.type !== 'static') {
          return new Promise(resolve => {
            // First, ensure the unit is at its starting position and angle
            unit.attr('transform', `translate(${positions.start.x},${positions.start.y}) rotate(${positions.startAngle})`);
            
            // Then animate to the new position and angle
            unit.transition()
              .delay(500)
              .duration(2000)
              .attrTween('transform', () => {
                return (t) => {
                  // Interpolate both position and rotation
                  const x = positions.start.x + (positions.end.x - positions.start.x) * t;
                  const y = positions.start.y + (positions.end.y - positions.start.y) * t;
                  const angle = positions.startAngle + (positions.endAngle - positions.startAngle) * t;
                  return `translate(${x},${y}) rotate(${angle})`;
                };
              })
              .end()
              .then(() => {
                setUnitStates(prev => ({
                  ...prev,
                  [troop.id]: {
                    position: troop.movement.to,
                    status: troop.status,
                    lastSeenInScene: currentScene,
                    facingAngle: positions.endAngle // Store the facing angle in unit state
                  }
                }));
                resolve();
              });
          });
        } else {
          // For static units, ensure they stay in their current position
          return new Promise(resolve => {
            unit.attr('transform', `translate(${positions.start.x},${positions.start.y})`);
            setUnitStates(prev => ({
              ...prev,
              [troop.id]: {
                position: troop.position,
                status: troop.status,
                lastSeenInScene: currentScene
              }
            }));
            resolve();
          });
        }
      }));
    }

    setIsAnimating(false);

    // Add dynamic legend
    const legend = svg.append('g')
      .attr('class', 'legend')
      .attr('transform', 'translate(20, 20)');

    // Calculate legend height based on number of armies and unit types
    const legendItemHeight = 30;
    const armyCount = Object.keys(battleData.battleInfo.armies).length;
    
    // Get unique unit types across all scenes
    const unitTypes = new Set();
    battleData.scenes.forEach(scene => {
      scene.troops.forEach(troop => {
        unitTypes.add(troop.type);
      });
    });
    
    const legendHeight = (armyCount * unitTypes.size + 1) * legendItemHeight + 20;

    // Background for legend
    legend.append('rect')
      .attr('width', 250)
      .attr('height', legendHeight)
      .attr('fill', 'black')
      .attr('opacity', 0.8)
      .attr('rx', 5)
      .attr('ry', 5);

    // Legend title
    legend.append('text')
      .attr('x', 10)
      .attr('y', 30)
      .attr('fill', 'white')
      .attr('font-weight', 'bold')
      .text('Army Units');

    // Add entries for each army and unit type
    let yOffset = 60;
    Object.entries(battleData.battleInfo.armies).forEach(([armyId, army]) => {
      unitTypes.forEach(unitType => {
        // Unit symbol
        const unitGroup = legend.append('g')
          .attr('transform', `translate(20, ${yOffset})`);

        // Base shape for all unit types
        unitGroup.append('rect')
          .attr('x', -10)
          .attr('y', -5)
          .attr('width', 20)
          .attr('height', 10)
          .attr('fill', army.color)
          .attr('opacity', 0.7)
          .attr('stroke', '#fff');

        // Add type-specific indicators
        switch(unitType) {
          case 'cavalry':
            unitGroup.append('circle')
              .attr('r', 2)
              .attr('fill', '#fff')
              .attr('opacity', 0.9);
            break;
          case 'artillery':
            unitGroup.append('path')
              .attr('d', 'M-5,0 L5,0 M0,-5 L0,5')
              .attr('stroke', '#fff')
              .attr('stroke-width', 2);
            break;
        }

        legend.append('text')
          .attr('x', 40)
          .attr('y', yOffset + 5)
          .attr('fill', 'white')
          .text(`${army.name} ${unitType.charAt(0).toUpperCase() + unitType.slice(1)}`);

        yOffset += legendItemHeight;
      });
    });
  };

  // Update visualization when scene changes
  useEffect(() => {
    updateTroopPositions(true);
  }, [battleData, currentScene]);

  return (
    <div className="w-full h-[75vh] bg-gray-700 rounded relative">
      <div ref={mapRef} className="w-full h-full" />
      {battleData && battleData.scenes[currentScene] && (
        <div className="absolute top-0 left-0 bg-black bg-opacity-50 text-white p-4 m-4 rounded max-w-[40%]">
          <h3 className="text-xl font-bold mb-2">{battleData.scenes[currentScene].title}</h3>
          <p className="text-base leading-relaxed">{battleData.scenes[currentScene].description}</p>
        </div>
      )}
      {isAnimating && (
        <div className="absolute bottom-4 right-4 bg-black bg-opacity-50 text-white px-3 py-1 rounded">
          Animating...
        </div>
      )}
    </div>
  );
}

export default BattleMapContent; 