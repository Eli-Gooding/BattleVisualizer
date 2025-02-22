'use client';

import React, { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import * as d3 from 'd3';
import 'leaflet/dist/leaflet.css';

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
          lastSeenInScene: 0
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
        return { unit: null, troop, endPoint: null };
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

      // Create unit representation
      const unit = group.append('g')
        .attr('transform', `translate(${startPoint.x},${startPoint.y})`)
        // Set initial opacity based on status
        .style('opacity', previousState ? (previousState.status === 'routed' ? 1 : previousState.status === 'defeated' ? 0.3 : 0.7) : 0.7);

      // Add main circle with status-based styling
      const mainCircle = unit.append('circle')
        .attr('r', radius)
        .attr('fill', army.color)
        .attr('stroke', '#fff')
        .attr('stroke-width', 1)
        .attr('pointer-events', 'all');

      // Add type-specific indicators to units
      switch(troop.type) {
        case 'cavalry':
          unit.append('circle')
            .attr('r', radius / 3)
            .attr('fill', '#fff')
            .attr('opacity', previousState?.status === 'defeated' ? 0.3 : 0.9);
          break;
        case 'artillery':
          unit.append('rect')
            .attr('x', -radius/3)
            .attr('y', -radius/3)
            .attr('width', radius*2/3)
            .attr('height', radius*2/3)
            .attr('fill', '#fff')
            .attr('opacity', previousState?.status === 'defeated' ? 0.3 : 0.9);
          break;
        case 'naval':
          unit.append('path')
            .attr('d', `M${-radius/2},${-radius/2} L${radius/2},${radius/2} M${-radius/2},${radius/2} L${radius/2},${-radius/2}`)
            .attr('stroke', '#fff')
            .attr('stroke-width', 2)
            .attr('opacity', previousState?.status === 'defeated' ? 0.3 : 0.9);
          break;
        // Add more unit type visualizations as needed
      }

      // Add hover tooltip
      const tooltip = unit.append('g')
        .attr('class', 'tooltip')
        .style('opacity', 0)
        .attr('transform', `translate(${radius + 10}, -${radius})`);

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

      mainCircle
        .on('mouseover', () => {
          tooltip.style('opacity', 1);
        })
        .on('mouseout', () => {
          tooltip.style('opacity', 0);
        });

      return { unit, troop, endPoint };
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
      await Promise.all(troopElements.map(({ unit, troop, endPoint }) => {
        // Skip if unit is null (routed from previous scene)
        if (!unit) return Promise.resolve();

        if (troop.status === 'defeated') {
          return new Promise(resolve => {
            unit.transition()
              .delay(500)
              .duration(2000)
              .style('opacity', 0.1)
              .end()
              .then(resolve);
          });
        } else if (troop.status === 'routed') {
          return new Promise(resolve => {
            unit.transition()
              .delay(500)
              .duration(2000)
              .attr('transform', `translate(${endPoint.x},${endPoint.y})`)
              .style('opacity', 0)
              .end()
              .then(() => {
                // Update the unit's position and status properly
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
            unit.transition()
              .delay(500)
              .duration(2000)
              .attr('transform', `translate(${endPoint.x},${endPoint.y})`)
              .end()
              .then(() => {
                // Update the unit's position maintaining the same structure
                setUnitStates(prev => ({
                  ...prev,
                  [troop.id]: {
                    position: troop.movement.to,
                    status: troop.status,
                    lastSeenInScene: currentScene
                  }
                }));
                resolve();
              });
          });
        }
        return Promise.resolve();
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

        // Base circle for all unit types
        unitGroup.append('circle')
          .attr('r', 10)
          .attr('fill', army.color)
          .attr('opacity', 0.7)
          .attr('stroke', '#fff');

        // Add type-specific indicators
        switch(unitType) {
          case 'cavalry':
            unitGroup.append('circle')
              .attr('r', 3)
              .attr('fill', '#fff')
              .attr('opacity', 0.9);
            break;
          case 'artillery':
            unitGroup.append('rect')
              .attr('x', -3)
              .attr('y', -3)
              .attr('width', 6)
              .attr('height', 6)
              .attr('fill', '#fff')
              .attr('opacity', 0.9);
            break;
          case 'naval':
            unitGroup.append('path')
              .attr('d', 'M-3,-3 L3,3 M-3,3 L3,-3')
              .attr('stroke', '#fff')
              .attr('stroke-width', 2)
              .attr('opacity', 0.9);
            break;
          // Add more unit type indicators as needed
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