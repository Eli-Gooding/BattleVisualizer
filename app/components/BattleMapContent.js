'use client';

import React, { useEffect, useRef } from 'react';
import L from 'leaflet';
import * as d3 from 'd3';
import 'leaflet/dist/leaflet.css';

function BattleMapContent({ battleData, currentScene }) {
  const mapRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const svgLayerRef = useRef(null);

  // Initialize map
  useEffect(() => {
    if (!mapInstanceRef.current && mapRef.current && battleData) {
      const { lat, lng } = battleData.battleInfo.location.coordinates;
      
      // Initialize the map centered on battle location
      mapInstanceRef.current = L.map(mapRef.current).setView([lat, lng], 15);

      // Add OpenStreetMap tiles
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© OpenStreetMap contributors'
      }).addTo(mapInstanceRef.current);

      // Create SVG layer for D3
      const svg = d3.select(mapInstanceRef.current.getPanes().overlayPane)
        .append('svg')
        .attr('width', '100%')
        .attr('height', '100%');
      
      svgLayerRef.current = svg.append('g')
        .attr('class', 'leaflet-zoom-hide');

      // Handle zoom events
      mapInstanceRef.current.on('zoom', () => {
        updateTroopPositions();
      });
    }

    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, [battleData]);

  // Update troop positions
  const updateTroopPositions = () => {
    if (!battleData || !mapInstanceRef.current || !svgLayerRef.current) return;

    const scene = battleData.scenes[currentScene];
    if (!scene || !scene.troops) return;

    const svg = svgLayerRef.current;
    svg.selectAll('*').remove();

    // Create groups for each side
    const romanGroup = svg.append('g').attr('class', 'roman-troops');
    const carthaginianGroup = svg.append('g').attr('class', 'carthaginian-troops');

    scene.troops.forEach(troop => {
      const group = troop.side === 'roman' ? romanGroup : carthaginianGroup;
      const point = mapInstanceRef.current.latLngToLayerPoint([
        troop.position.lat,
        troop.position.lng
      ]);

      // Calculate size of unit representation based on troop size
      const radius = Math.sqrt(troop.size / 1000) * 5;

      // Create unit representation
      const unit = group.append('g')
        .attr('transform', `translate(${point.x},${point.y})`);

      // Add main circle
      unit.append('circle')
        .attr('r', radius)
        .attr('fill', troop.side === 'roman' ? '#e63946' : '#1d3557')
        .attr('opacity', 0.7)
        .attr('stroke', '#fff')
        .attr('stroke-width', 1);

      // Add type indicator
      if (troop.type === 'cavalry') {
        unit.append('circle')
          .attr('r', radius / 3)
          .attr('fill', '#fff')
          .attr('opacity', 0.9);
      }

      // If there's movement, add an arrow
      if (troop.movement && troop.movement.type !== 'static') {
        const targetPoint = mapInstanceRef.current.latLngToLayerPoint([
          troop.movement.to.lat,
          troop.movement.to.lng
        ]);

        // Draw movement arrow
        svg.append('line')
          .attr('x1', point.x)
          .attr('y1', point.y)
          .attr('x2', targetPoint.x)
          .attr('y2', targetPoint.y)
          .attr('stroke', troop.movement.type === 'retreat' ? '#ff0000' : '#00ff00')
          .attr('stroke-width', 2)
          .attr('opacity', 0.5)
          .attr('marker-end', 'url(#arrow)');
      }
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
  };

  // Update visualization when scene changes
  useEffect(() => {
    updateTroopPositions();
  }, [battleData, currentScene]);

  return (
    <div className="w-full h-96 bg-gray-700 rounded relative">
      <div ref={mapRef} className="w-full h-full" />
      {battleData && battleData.scenes[currentScene] && (
        <div className="absolute top-0 left-0 bg-black bg-opacity-50 text-white p-2 m-2 rounded">
          <h3 className="text-lg font-bold">{battleData.scenes[currentScene].title}</h3>
          <p className="text-sm">{battleData.scenes[currentScene].description}</p>
        </div>
      )}
    </div>
  );
}

export default BattleMapContent; 