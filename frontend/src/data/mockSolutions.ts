import type { OptimizationRequest, OptimizationResponse } from '../types/routing'

export const MOCK_REQUEST: OptimizationRequest = {
  sources: [
    { id: 'dc-mason', lat: '39.3601', lon: '-84.3101' },
    { id: 'dc-florence', lat: '38.9989', lon: '-84.6266' },
  ],
  destinations: [
    { id: 'downtown-cincy', lat: '39.1013', lon: '-84.5151' },
    { id: 'dayton', lat: '39.7589', lon: '-84.1916' },
    { id: 'columbus', lat: '39.9612', lon: '-82.9988' },
    { id: 'lexington', lat: '38.0406', lon: '-84.5037' },
    { id: 'louisville', lat: '38.2527', lon: '-85.7585' },
    { id: 'indianapolis', lat: '39.7684', lon: '-86.1581' },
  ],
  containers: [
    { container_id: 'C01', source_id: 'dc-mason', destination_id: 'downtown-cincy', size: 3, temperature: 'AM' },
    { container_id: 'C02', source_id: 'dc-mason', destination_id: 'downtown-cincy', size: 2, temperature: 'RE' },
    { container_id: 'C03', source_id: 'dc-mason', destination_id: 'dayton', size: 4, temperature: 'AM' },
    { container_id: 'C04', source_id: 'dc-mason', destination_id: 'dayton', size: 2, temperature: 'RE' },
    { container_id: 'C05', source_id: 'dc-mason', destination_id: 'columbus', size: 3, temperature: 'AM' },
    { container_id: 'C06', source_id: 'dc-mason', destination_id: 'columbus', size: 2, temperature: 'RE' },
    { container_id: 'C07', source_id: 'dc-florence', destination_id: 'lexington', size: 5, temperature: 'AM' },
    { container_id: 'C08', source_id: 'dc-florence', destination_id: 'lexington', size: 3, temperature: 'RE' },
    { container_id: 'C09', source_id: 'dc-florence', destination_id: 'louisville', size: 4, temperature: 'AM' },
    { container_id: 'C10', source_id: 'dc-florence', destination_id: 'louisville', size: 2, temperature: 'RE' },
    { container_id: 'C11', source_id: 'dc-florence', destination_id: 'indianapolis', size: 3, temperature: 'AM' },
    { container_id: 'C12', source_id: 'dc-florence', destination_id: 'indianapolis', size: 4, temperature: 'RE' },
  ],
  truck_size: { AM: 10, RE: 5 },
}

// Three alternative solutions — same inputs, different truck assignments
export const MOCK_SOLUTIONS: OptimizationResponse[] = [
  // Solution 1: each truck visits 1-2 stops
  {
    trucks: [
      { id: 'T1', source_id: 'dc-mason', destination_ids: ['downtown-cincy'], container_ids: ['C01', 'C02'] },
      { id: 'T2', source_id: 'dc-mason', destination_ids: ['dayton'], container_ids: ['C03', 'C04'] },
      { id: 'T3', source_id: 'dc-mason', destination_ids: ['columbus'], container_ids: ['C05', 'C06'] },
      { id: 'T4', source_id: 'dc-mason', destination_ids: ['downtown-cincy', 'dayton'], container_ids: ['C01b', 'C03b'] },
      { id: 'T5', source_id: 'dc-florence', destination_ids: ['lexington'], container_ids: ['C07', 'C08'] },
      { id: 'T6', source_id: 'dc-florence', destination_ids: ['louisville'], container_ids: ['C09', 'C10'] },
      { id: 'T7', source_id: 'dc-florence', destination_ids: ['indianapolis'], container_ids: ['C11', 'C12'] },
      { id: 'T8', source_id: 'dc-florence', destination_ids: ['lexington', 'louisville'], container_ids: ['C07b', 'C09b'] },
    ],
  },
  // Solution 2: different groupings
  {
    trucks: [
      { id: 'T1', source_id: 'dc-mason', destination_ids: ['downtown-cincy', 'columbus'], container_ids: ['C01', 'C05'] },
      { id: 'T2', source_id: 'dc-mason', destination_ids: ['dayton', 'columbus'], container_ids: ['C03', 'C06'] },
      { id: 'T3', source_id: 'dc-mason', destination_ids: ['downtown-cincy'], container_ids: ['C02', 'C04'] },
      { id: 'T4', source_id: 'dc-mason', destination_ids: ['dayton'], container_ids: ['C01c', 'C03c'] },
      { id: 'T5', source_id: 'dc-florence', destination_ids: ['lexington', 'louisville'], container_ids: ['C07', 'C09'] },
      { id: 'T6', source_id: 'dc-florence', destination_ids: ['indianapolis'], container_ids: ['C11', 'C12'] },
      { id: 'T7', source_id: 'dc-florence', destination_ids: ['louisville', 'indianapolis'], container_ids: ['C10', 'C11b'] },
      { id: 'T8', source_id: 'dc-florence', destination_ids: ['lexington'], container_ids: ['C08', 'C07c'] },
    ],
  },
  // Solution 3: some trucks with 3 stops
  {
    trucks: [
      { id: 'T1', source_id: 'dc-mason', destination_ids: ['downtown-cincy', 'dayton', 'columbus'], container_ids: ['C01', 'C03', 'C05'] },
      { id: 'T2', source_id: 'dc-mason', destination_ids: ['columbus'], container_ids: ['C06', 'C05b'] },
      { id: 'T3', source_id: 'dc-mason', destination_ids: ['dayton'], container_ids: ['C04'] },
      { id: 'T4', source_id: 'dc-mason', destination_ids: ['downtown-cincy'], container_ids: ['C02'] },
      { id: 'T5', source_id: 'dc-florence', destination_ids: ['lexington', 'louisville', 'indianapolis'], container_ids: ['C07', 'C09', 'C11'] },
      { id: 'T6', source_id: 'dc-florence', destination_ids: ['louisville'], container_ids: ['C10'] },
      { id: 'T7', source_id: 'dc-florence', destination_ids: ['indianapolis'], container_ids: ['C12'] },
      { id: 'T8', source_id: 'dc-florence', destination_ids: ['lexington'], container_ids: ['C08'] },
    ],
  },
]
