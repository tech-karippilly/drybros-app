import { Text } from "@/components/ui/text";

export default function DashboardPage() {
    return (
        <div className="p-8">
            <Text variant="h1">Dashboard</Text>
            <Text variant="regular" className="mt-4">
                Welcome to the DRybros Staff Portal dashboard. This is where you can manage trips, drivers, and operations.
            </Text>
        </div>
    );
}
