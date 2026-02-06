SELECT 'TripTypeConfig count:' as info, COUNT(*) as count FROM "TripTypeConfig"
UNION ALL
SELECT 'CarTypePricing count:' as info, COUNT(*) as count FROM "CarTypePricing"
UNION ALL
SELECT 'DistanceScope count:' as info, COUNT(*) as count FROM "DistanceScope"
UNION ALL
SELECT 'TripPattern count:' as info, COUNT(*) as count FROM "TripPattern";
