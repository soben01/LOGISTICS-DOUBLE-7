# DOUBLE 7 LOGISTICS

> **Next-Generation Intelligent Freight, Cross-Border E-Commerce & Global Supply Chain Network**

Founded by **Soben** ([@soben01](https://github.com/soben01)).

---

## Overview

**DOUBLE 7 LOGISTICS** is an enterprise-grade, high-velocity freight and supply chain platform engineered to withstand extreme peak-surge volumes (such as the global 11.11 / Singles' Day shopping festival). Combining chartered Boeing 777F cargo aircraft, automated AGV robotic fulfillment hubs, and sub-second telemetry, the platform provides seamless door-to-door transparency across air, ocean, and ground freight.

---

## Core System Modules

1. **Public Marketing Portal (`/`)**:
   - Hero section with instant consignment lookup and 1-click sample tracking.
   - Interactive Dimensional Weight & Instant Freight Rate Estimator.
   - Live network telemetry (99.8% on-time delivery, 18-minute hub sort turnaround).
   - Visual showcase of air freight charters, automated fulfillment, and container vessels.

2. **Real-Time Consignment Tracking Center (`/track`)**:
   - Multi-stage milestone timeline with timestamps and geolocation updates.
   - Live transport vehicle telemetry (flight/vessel code, AWB, temperature, airspeed).
   - Digital Proof of Delivery (POD) viewer with recipient electronic signature.
   - Shareable tracking links and subscription alerts.

3. **Cargo Booking Wizard (`/book`)**:
   - 5-step guided flow: Shipper details, Consignee address, Cargo specifications, Service Tier, and Value-Added Protections (Insurance & SAF Carbon Offset).
   - Instant Airway Bill (AWB) generation with barcode, QR code, and automatic synchronization to the tracking database.

4. **Logistics Operations Control Tower (`/operations`)**:
   - Internal command center for operations managers.
   - Live throughput and capacity monitors across global mega-hubs (Shenzhen, Singapore, Frankfurt, Los Angeles).
   - Consignment manifest table with real-time status switcher and checkpoint note updates.

5. **Rates & Freight Tariffs (`/rates`)**:
   - Interactive CBM / Volumetric weight calculator.
   - Published international air express and ocean container rate matrix.

6. **About Us & Founder Vision (`/about`)**:
   - Origin story of Double 7 Logistics, engineering principles, and spotlight on Founder **Soben**.

7. **Support & Customs Guide (`/support`)**:
   - Interactive 24/7 Dispatch Bot simulator.
   - Searchable FAQ accordion covering customs pre-clearance, dangerous goods (DGR), and SLA guarantees.

---

## Tech Stack

- **Framework**: Next.js 16 (App Router)
- **UI & Architecture**: React 19, TypeScript 5
- **Styling**: Tailored Vanilla CSS Design System with CSS variables, glassmorphism, responsive grids, and micro-animations
- **Icons**: Lucide React
- **Deployment**: Static export (`output: 'export'`) ready for Cloudflare Pages, Vercel, or AWS S3 / CloudFront

---

## Local Development

```bash
# Install dependencies
npm install

# Start development server
npm run dev -- -p 3111

# Build production bundle (static export in out/)
npm run build
```

---

## License

&copy; 2026 DOUBLE 7 LOGISTICS LTD. All rights reserved. Architected by Soben.
