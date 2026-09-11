export type RoadHazardLevel = 'low' | 'moderate' | 'high' | 'severe';

export interface SectorStatus {
  sectorName: string;
  distanceMarker: string;
  surfaceCondition: string;
  statusText: string;
  speedLimitKmh: number;
  isOpen: boolean;
}

export interface RoadCondition {
  id: 'open' | 'rain' | 'landslide' | 'blocked';
  title: string;
  shortLabel: string;
  surface: string;
  hazardLevel: RoadHazardLevel;
  delayMinutes: number;
  delayText: string;
  speedKmh: number;
  statusBadge: string;
  badgeClass: string;
  color: string;
  advisory: string;
  affectedSector: string;
  impactText: string;
  sectors: SectorStatus[];
}

export const ROAD_CONDITIONS: Record<string, RoadCondition> = {
  open: {
    id: 'open',
    title: 'Open • Dry Road Surface',
    shortLabel: 'Open / Dry Surface',
    surface: 'Optimal Dry Asphalt • Full Tire Grip',
    hazardLevel: 'low',
    delayMinutes: 0,
    delayText: '0m Delay (On Schedule)',
    speedKmh: 58,
    statusBadge: 'ON SCHEDULE',
    badgeClass: 'badge-emerald',
    color: '#10b981',
    advisory: 'Prithvi Highway (NH04) & Nagdhunga Tunnel fully open. Zero weather hazards detected along the Trishuli corridor.',
    affectedSector: 'All 4 Highway Sectors Clear & Flowing',
    impactText: 'No delay incurred. Express electric linehaul cruising at optimal 58 km/h speed.',
    sectors: [
      {
        sectorName: 'Nagdhunga Tunnel & Bypass',
        distanceMarker: 'KM 18',
        surfaceCondition: 'Dry Concrete • Excellent Traction',
        statusText: 'Tunnel Clear • 100% Free Flow',
        speedLimitKmh: 60,
        isOpen: true,
      },
      {
        sectorName: 'Naubise — Malekhu Sector',
        distanceMarker: 'KM 72',
        surfaceCondition: 'Dry Asphalt • Smooth',
        statusText: 'Patrol Active • Normal Flow',
        speedLimitKmh: 58,
        isOpen: true,
      },
      {
        sectorName: 'Malekhu — Mugling Gorge',
        distanceMarker: 'KM 110',
        surfaceCondition: 'Dry River Canyon Tarmac',
        statusText: 'Corridor Clear • No Slip Detected',
        speedLimitKmh: 52,
        isOpen: true,
      },
      {
        sectorName: 'Damauli — Pokhara Gateway',
        distanceMarker: 'KM 200',
        surfaceCondition: 'Dry Wide Highway Tarmac',
        statusText: 'Smooth Flow into Gandaki Hub',
        speedLimitKmh: 55,
        isOpen: true,
      },
    ],
  },

  rain: {
    id: 'rain',
    title: 'Monsoon Rain & Wet Curves',
    shortLabel: 'Monsoon Rain (+45m)',
    surface: 'Wet Tarmac • Reduced Traction & River Mist',
    hazardLevel: 'moderate',
    delayMinutes: 45,
    delayText: '+45m Delay',
    speedKmh: 38,
    statusBadge: '+45M DELAY',
    badgeClass: 'badge-amber',
    color: '#f59e0b',
    advisory: 'Precipitation active along Trishuli River valley. Dense fog patches between Kurintar and Mugling. Speed regulated to 38 km/h for freight stability.',
    affectedSector: 'Malekhu — Mugling Sector (Wet Surface Caution)',
    impactText: '+45 minutes delay added to arrival time due to wet road surface and reduced descent speed.',
    sectors: [
      {
        sectorName: 'Nagdhunga Tunnel & Bypass',
        distanceMarker: 'KM 18',
        surfaceCondition: 'Tunnel Dry / Outer Approach Wet',
        statusText: 'Flowing • Caution on Descent',
        speedLimitKmh: 45,
        isOpen: true,
      },
      {
        sectorName: 'Naubise — Malekhu Sector',
        distanceMarker: 'KM 72',
        surfaceCondition: 'Wet Asphalt • High Spray',
        statusText: 'Reduced Linehaul Speed (40 km/h)',
        speedLimitKmh: 40,
        isOpen: true,
      },
      {
        sectorName: 'Malekhu — Mugling Gorge',
        distanceMarker: 'KM 110',
        surfaceCondition: 'Heavy Rain • Wet River Curves',
        statusText: 'Slow Moving • Watch for Slips',
        speedLimitKmh: 32,
        isOpen: true,
      },
      {
        sectorName: 'Damauli — Pokhara Gateway',
        distanceMarker: 'KM 200',
        surfaceCondition: 'Damp Asphalt • Light Fog',
        statusText: 'Moderate Flow into Gandaki Hub',
        speedLimitKmh: 45,
        isOpen: true,
      },
    ],
  },

  landslide: {
    id: 'landslide',
    title: 'Landslide Clearance • One-Way Queue',
    shortLabel: 'Landslide Queue (+2.5h)',
    surface: 'Debris Cleared • Single-Lane Alternating Pass',
    hazardLevel: 'high',
    delayMinutes: 150,
    delayText: '+2h 30m Delay',
    speedKmh: 14,
    statusBadge: '+2.5H DELAY',
    badgeClass: 'badge-orange',
    color: '#ff6600',
    advisory: 'Minor slope slip near Mugling-Kurintar (KM 108). Nepal Armed Police & DoR maintaining alternating single-lane linehaul traffic queue.',
    affectedSector: 'Mugling Gorge (KM 108) • Alternating Single Lane',
    impactText: '+2 hours 30 minutes delay incurred due to alternating bottleneck queue at Mugling gorge.',
    sectors: [
      {
        sectorName: 'Nagdhunga Tunnel & Bypass',
        distanceMarker: 'KM 18',
        surfaceCondition: 'Dry Concrete Tunnel',
        statusText: 'Holding Queue Regulated (35 km/h)',
        speedLimitKmh: 35,
        isOpen: true,
      },
      {
        sectorName: 'Naubise — Malekhu Sector',
        distanceMarker: 'KM 72',
        surfaceCondition: 'Dry Asphalt • Slow Moving',
        statusText: 'Heavy Freight Lineup (25 km/h)',
        speedLimitKmh: 25,
        isOpen: true,
      },
      {
        sectorName: 'Malekhu — Mugling Gorge',
        distanceMarker: 'KM 110',
        surfaceCondition: '⚠️ Mud & Debris Cleared • Single Lane',
        statusText: 'Alternating Single Lane (10 km/h)',
        speedLimitKmh: 12,
        isOpen: true,
      },
      {
        sectorName: 'Damauli — Pokhara Gateway',
        distanceMarker: 'KM 200',
        surfaceCondition: 'Dry Highway Tarmac',
        statusText: 'Hub Staging Staged for Arrival',
        speedLimitKmh: 50,
        isOpen: true,
      },
    ],
  },

  blocked: {
    id: 'blocked',
    title: 'Highway Blocked • Major Rockfall & Debris',
    shortLabel: 'Highway Blocked (+5.0h)',
    surface: 'Road Blocked • Heavy DoR Excavation Active',
    hazardLevel: 'severe',
    delayMinutes: 300,
    delayText: '+5h 00m Delay',
    speedKmh: 0,
    statusBadge: '+5.0H SEVERE DELAY',
    badgeClass: 'badge-red',
    color: '#ef4444',
    advisory: 'Major hillside slip near Krishnabhir / Jogimara. DoR heavy excavators deployed. Linehaul freight units staged safely at Malekhu holding depot.',
    affectedSector: 'Krishnabhir / Jogimara Sector • Temporarily Halted',
    impactText: '+5 hours delay added. Fleet safely parked at Malekhu holding bay awaiting DoR highway clearance.',
    sectors: [
      {
        sectorName: 'Nagdhunga Tunnel & Bypass',
        distanceMarker: 'KM 18',
        surfaceCondition: 'Dry Concrete Tunnel',
        statusText: 'Traffic Inward Temporarily Paused',
        speedLimitKmh: 0,
        isOpen: false,
      },
      {
        sectorName: 'Naubise — Malekhu Sector',
        distanceMarker: 'KM 72',
        surfaceCondition: 'Holding Depot Area',
        statusText: 'Fleet Staged Safely at Malekhu Bay',
        speedLimitKmh: 0,
        isOpen: false,
      },
      {
        sectorName: 'Malekhu — Mugling Gorge',
        distanceMarker: 'KM 110',
        surfaceCondition: '⛔ Rockfall Obstruction (KM 104)',
        statusText: 'DoR Heavy Excavators Active',
        speedLimitKmh: 0,
        isOpen: false,
      },
      {
        sectorName: 'Damauli — Pokhara Gateway',
        distanceMarker: 'KM 200',
        surfaceCondition: 'Dry Tarmac (Waiting)',
        statusText: 'Awaiting Highway Resumption',
        speedLimitKmh: 0,
        isOpen: false,
      },
    ],
  },
};

export function getRoadCondition(id: string): RoadCondition {
  return ROAD_CONDITIONS[id] || ROAD_CONDITIONS.open;
}

export function getShipmentRoadCondition(shipmentId: string): RoadCondition {
  if (typeof window === 'undefined') return ROAD_CONDITIONS.open;
  try {
    const savedId = localStorage.getItem(`double7_road_cond_${shipmentId}`);
    if (savedId && ROAD_CONDITIONS[savedId]) {
      return ROAD_CONDITIONS[savedId];
    }
  } catch {
    // ignore
  }
  return ROAD_CONDITIONS.open;
}

export function setShipmentRoadCondition(shipmentId: string, conditionId: string): RoadCondition {
  const cond = ROAD_CONDITIONS[conditionId] || ROAD_CONDITIONS.open;
  if (typeof window !== 'undefined') {
    try {
      localStorage.setItem(`double7_road_cond_${shipmentId}`, cond.id);
      window.dispatchEvent(
        new CustomEvent('road-condition-updated', {
          detail: { shipmentId, condition: cond },
        })
      );
    } catch {
      // ignore
    }
  }
  return cond;
}

/**
 * Recalculates estimated arrival time by adding delay minutes to the scheduled time
 */
export function calculateDelayedTime(
  baseArrivalText: string,
  delayMinutes: number,
  condition: RoadCondition
): {
  arrivalString: string;
  badgeText: string;
  badgeClass: string;
  isDelayed: boolean;
} {
  if (delayMinutes <= 0) {
    return {
      arrivalString: baseArrivalText.includes('17:00')
        ? 'Today by 17:00 NPT (Guaranteed 24H SLA)'
        : baseArrivalText,
      badgeText: 'ON SCHEDULE',
      badgeClass: 'badge-emerald',
      isDelayed: false,
    };
  }

  // Parse baseline hour:minute from base string (defaults to 17:00)
  let baseHour = 17;
  let baseMinute = 0;
  const match = baseArrivalText.match(/(\d{1,2}):(\d{2})/);
  if (match) {
    baseHour = parseInt(match[1], 10);
    baseMinute = parseInt(match[2], 10);
  }

  const totalMin = baseHour * 60 + baseMinute + delayMinutes;
  const newHour = Math.floor(totalMin / 60) % 24;
  const newMinute = totalMin % 60;
  const formattedTime = `${String(newHour).padStart(2, '0')}:${String(newMinute).padStart(2, '0')}`;

  const delayFormatted =
    delayMinutes >= 60
      ? `${Math.floor(delayMinutes / 60)}h ${delayMinutes % 60 ? (delayMinutes % 60) + 'm ' : ''}Delay`
      : `${delayMinutes}m Delay`;

  let badgeText = condition.statusBadge;
  let badgeClass = condition.badgeClass;

  return {
    arrivalString: `Today by ${formattedTime} NPT (${delayFormatted} • ${condition.shortLabel})`,
    badgeText,
    badgeClass,
    isDelayed: true,
  };
}

/**
 * Adjusts intermediate waypoint timestamps (e.g. "Est. Today ~15:45 NPT")
 */
export function adjustWaypointTime(baseTimeStr: string, delayMinutes: number): string {
  if (delayMinutes <= 0) return baseTimeStr;
  const match = baseTimeStr.match(/(\d{1,2}):(\d{2})/);
  if (!match) return baseTimeStr;

  const hour = parseInt(match[1], 10);
  const min = parseInt(match[2], 10);
  const totalMin = hour * 60 + min + delayMinutes;
  const newHour = Math.floor(totalMin / 60) % 24;
  const newMin = totalMin % 60;
  const newTime = `${String(newHour).padStart(2, '0')}:${String(newMin).padStart(2, '0')}`;

  return baseTimeStr.replace(/(\d{1,2}):(\d{2})/, newTime);
}
