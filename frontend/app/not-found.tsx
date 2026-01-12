import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Text } from "@/components/ui/text";
import { Home, AlertCircle } from "lucide-react";

export default function NotFound() {
    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-950 p-4 relative overflow-hidden">
            {/* Decorative background elements */}
            <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-theme-blue/5 rounded-full blur-[100px] pointer-events-none" />
            <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-theme-orange/5 rounded-full blur-[100px] pointer-events-none" />

            <div className="w-full max-w-md text-center space-y-8 relative z-10">
                <div className="flex flex-col items-center">
                    <div className="h-24 w-24 bg-theme-red/10 rounded-full flex items-center justify-center mb-6 text-theme-red">
                        <AlertCircle size={48} />
                    </div>
                    <Text variant="h1" className="text-8xl font-black text-theme-blue mb-2">
                        404
                    </Text>
                    <Text variant="h3" className="mb-2">Page Not Found</Text>
                    <Text variant="muted" className="mb-8 max-w-[300px] mx-auto">
                        The page you are looking for might have been removed, had its name changed, or is temporarily unavailable.
                    </Text>
                </div>

                <div className="flex justify-center">
                    <Link href="/">
                        <Button size="lg" className="rounded-full px-8">
                            <Home className="mr-2 h-4 w-4" />
                            Go Back Home
                        </Button>
                    </Link>
                </div>

                <div className="pt-8">
                    <Text variant="small" className="text-gray-500 uppercase tracking-widest font-bold">
                        DRybros Staff Portal
                    </Text>
                </div>
            </div>
        </div>
    );
}
