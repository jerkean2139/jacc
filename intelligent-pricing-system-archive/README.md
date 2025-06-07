# Intelligent Pricing System Archive

This folder contains the comprehensive intelligent pricing system that was built to replace the ISO AMP API dependency. The system includes:

## Components Archived:

### Backend Services:
- `interchange-rates.ts` - Real Visa/MC interchange rate management
- `intelligent-pricing-engine.ts` - Core pricing recommendation engine
- `pricing-intelligence-dashboard.ts` - Market intelligence and analytics
- `pricing-demo-setup.ts` - TRX/TracerPay demo data setup

### Frontend Components:
- `pricing-management.tsx` - CRUD interface for processor pricing
- `pricing-demo.tsx` - TRX/TracerPay competitive analysis demo

## Key Features:
- Real interchange rates updated twice yearly (April/October)
- Processor markup intelligence with competitive analysis
- Professional PDF report generation
- SendGrid email integration
- Market positioning analytics
- TracerPay vs TRX competitive comparisons

## Database Schema:
The system added these tables to the schema:
- `interchange_rates` - Visa/MC interchange rate tracking
- `processor_markups` - Competitive processor markup intelligence

## Why Archived:
The owner requested to revert back to the external ISO AMP API for functional integration. This comprehensive pricing intelligence system remains available for future activation when needed.

## Reactivation:
To reactivate this system:
1. Copy files back to their original locations
2. Uncomment pricing routes in server/routes.ts
3. Add routes back to client/src/App.tsx
4. Run database migration to add new tables