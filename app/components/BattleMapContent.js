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

    // Create groups for each side
    const romanGroup = svg.append('g').attr('class', 'roman-troops');
    const carthaginianGroup = svg.append('g').attr('class', 'carthaginian-troops');

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

      const group = troop.side === 'roman' ? romanGroup : carthaginianGroup;
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
        .attr('fill', troop.side === 'roman' ? '#e63946' : '#1d3557')
        .attr('stroke', '#fff')
        .attr('stroke-width', 1)
        .attr('pointer-events', 'all');

      // Add type indicator
      if (troop.type === 'cavalry') {
        unit.append('circle')
          .attr('r', radius / 3)
          .attr('fill', '#fff')
          .attr('opacity', previousState?.status === 'defeated' ? 0.3 : 0.9);
      }

      // Add hover tooltip
      const tooltip = unit.append('g')
        .attr('class', 'tooltip')
        .style('opacity', 0)
        .attr('transform', `translate(${radius + 10}, -${radius})`);

      tooltip.append('rect')
        .attr('rx', 5)
        .attr('ry', 5)
        .attr('width', 200)
        .attr('height', 100)
        .attr('fill', 'black')
        .attr('opacity', 0.8);

      tooltip.append('text')
        .attr('x', 10)
        .attr('y', 20)
        .attr('fill', 'white')
        .text(`Army: ${troop.side.charAt(0).toUpperCase() + troop.side.slice(1)}`);

      tooltip.append('text')
        .attr('x', 10)
        .attr('y', 40)
        .attr('fill', 'white')
        .text(`Type: ${troop.type.charAt(0).toUpperCase() + troop.type.slice(1)}`);

      tooltip.append('text')
        .attr('x', 10)
        .attr('y', 60)
        .attr('fill', 'white')
        .text(`Size: ${troop.size.toLocaleString()} troops`);

      // Get the current status (either from previous state or current troop)
      const currentStatus = previousState?.status || troop.status;
      
      tooltip.append('text')
        .attr('x', 10)
        .attr('y', 80)
        .attr('fill', currentStatus === 'active' ? '#4ade80' : currentStatus === 'routed' ? '#fbbf24' : '#ef4444')
        .text(`Status: ${currentStatus.charAt(0).toUpperCase() + currentStatus.slice(1)}`);

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

    // Add legend
    const legend = svg.append('g')
      .attr('class', 'legend')
      .attr('transform', 'translate(20, 20)');

    // Background for legend
    legend.append('rect')
      .attr('width', 180)
      .attr('height', 160)
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
      .text('Legend');

    // Roman infantry
    legend.append('circle')
      .attr('cx', 20)
      .attr('cy', 50)
      .attr('r', 10)
      .attr('fill', '#e63946')
      .attr('opacity', 0.7)
      .attr('stroke', '#fff');

    legend.append('text')
      .attr('x', 40)
      .attr('y', 55)
      .attr('fill', 'white')
      .text('Roman Infantry');

    // Roman cavalry
    const romanCav = legend.append('g')
      .attr('transform', 'translate(20, 80)');

    romanCav.append('circle')
      .attr('r', 10)
      .attr('fill', '#e63946')
      .attr('opacity', 0.7)
      .attr('stroke', '#fff');

    romanCav.append('circle')
      .attr('r', 3)
      .attr('fill', '#fff')
      .attr('opacity', 0.9);

    legend.append('text')
      .attr('x', 40)
      .attr('y', 85)
      .attr('fill', 'white')
      .text('Roman Cavalry');

    // Carthaginian infantry
    legend.append('circle')
      .attr('cx', 20)
      .attr('cy', 110)
      .attr('r', 10)
      .attr('fill', '#1d3557')
      .attr('opacity', 0.7)
      .attr('stroke', '#fff');

    legend.append('text')
      .attr('x', 40)
      .attr('y', 115)
      .attr('fill', 'white')
      .text('Carthaginian Infantry');

    // Carthaginian cavalry
    const carthCav = legend.append('g')
      .attr('transform', 'translate(20, 140)');

    carthCav.append('circle')
      .attr('r', 10)
      .attr('fill', '#1d3557')
      .attr('opacity', 0.7)
      .attr('stroke', '#fff');

    carthCav.append('circle')
      .attr('r', 3)
      .attr('fill', '#fff')
      .attr('opacity', 0.9);

    legend.append('text')
      .attr('x', 40)
      .attr('y', 145)
      .attr('fill', 'white')
      .text('Carthaginian Cavalry');
  };

  // Update visualization when scene changes
  useEffect(() => {
    updateTroopPositions(true);
  }, [battleData, currentScene]);

  return (
    <div className="w-full h-[75vh] bg-gray-700 rounded relative">
      <div ref={mapRef} className="w-full h-full" />
      {battleData && battleData.scenes[currentScene] && (
        <div className="absolute top-0 left-0 bg-black bg-opacity-50 text-white p-2 m-2 rounded">
          <h3 className="text-lg font-bold">{battleData.scenes[currentScene].title}</h3>
          <p className="text-sm">{battleData.scenes[currentScene].description}</p>
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