"use client";

import React, { useState, useMemo } from "react";
import { useSearchParams, useParams, useRouter } from "next/navigation";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Text } from "@/components/ui/text";
import { submitTripReviewPublic } from "@/lib/features/reviews/reviewApi";
import { Star } from "lucide-react";

export default function TripReviewPage() {
  const params = useParams();
  const search = useSearchParams();
  const router = useRouter();

  const tripId = String(params?.tripId || "");
  const driverId = search.get("driverId") || "";
  const franchiseId = search.get("franchiseId") || "";
  const customerId = search.get("customerId") || "";

  const [tripRating, setTripRating] = useState<number>(5);
  const [driverRating, setDriverRating] = useState<number>(5);
  const [overallRating, setOverallRating] = useState<number>(5);
  const [comment, setComment] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const isReady = useMemo(() => {
    return Boolean(tripId && driverId && franchiseId && customerId);
  }, [tripId, driverId, franchiseId, customerId]);

  const StarRating = ({ value, onChange, label }: { value: number; onChange: (v: number) => void; label: string }) => {
    return (
      <div className="space-y-2">
        <label className="block text-sm font-medium">{label}</label>
        <div className="flex gap-2 items-center">
          {[1, 2, 3, 4, 5].map((star) => (
            <button
              key={star}
              type="button"
              onClick={() => onChange(star)}
              className="focus:outline-none transition-transform hover:scale-110"
            >
              <Star
                className={`w-8 h-8 ${
                  star <= value
                    ? "fill-yellow-400 text-yellow-400"
                    : "fill-gray-200 text-gray-200"
                }`}
              />
            </button>
          ))}
          <span className="ml-2 text-sm font-medium text-gray-700">{value}/5</span>
        </div>
      </div>
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    if (!isReady) {
      setError("Missing required information in link. Please contact support.");
      return;
    }
    if (!comment.trim()) {
      setError("Please provide a brief description of your experience.");
      return;
    }
    setLoading(true);
    try {
      await submitTripReviewPublic({
        tripId,
        driverId,
        franchiseId,
        customerId,
        tripRating,
        driverRating,
        overallRating,
        comment: comment.trim(),
      });
      setSuccess("Thank you! Your review has been submitted.");
      setComment("");
      setTripRating(5);
      setDriverRating(5);
      setOverallRating(5);
    } catch (err: any) {
      setError(err?.response?.data?.error || err?.message || "Failed to submit review");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center p-4">
      <div className="w-full max-w-2xl bg-white border rounded-lg shadow-lg p-8">
        <div className="text-center mb-6">
          <Text as="h1" className="text-3xl font-bold text-gray-800 mb-2">
            How was your trip?
          </Text>
          <Text as="p" className="text-sm text-gray-600">
            Trip #{tripId.slice(0, 8).toUpperCase()}
          </Text>
        </div>

        {!isReady && (
          <div className="bg-yellow-50 border border-yellow-200 text-yellow-700 p-3 rounded mb-4">
            Missing trip or user details in the link. Ensure the link contains driverId, franchiseId and customerId.
          </div>
        )}

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 p-3 rounded mb-4">{error}</div>
        )}

        {success && (
          <div className="bg-green-50 border border-green-200 text-green-700 p-4 rounded mb-4 text-center">
            <p className="font-semibold text-lg">{success}</p>
            <p className="text-sm mt-1">We appreciate your feedback!</p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Trip Rating */}
          <div className="p-4 bg-blue-50 rounded-lg">
            <StarRating
              value={tripRating}
              onChange={setTripRating}
              label="How was your trip experience?"
            />
          </div>

          {/* Driver Rating */}
          <div className="p-4 bg-green-50 rounded-lg">
            <StarRating
              value={driverRating}
              onChange={setDriverRating}
              label="How was your driver?"
            />
          </div>

          {/* Overall Rating */}
          <div className="p-4 bg-purple-50 rounded-lg">
            <StarRating
              value={overallRating}
              onChange={setOverallRating}
              label="Overall rating"
            />
          </div>

          {/* Comment */}
          <div>
            <label className="block text-sm font-medium mb-2">Tell us more about your experience</label>
            <textarea
              className="w-full border border-gray-300 rounded-lg p-3 min-h-[120px] focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder="Share your feedback about the trip, driver, and overall service..."
            />
          </div>

          <Button 
            type="submit" 
            disabled={!isReady || loading} 
            className="w-full py-3 text-lg font-semibold"
          >
            {loading ? "Submitting..." : "Submit Review"}
          </Button>
        </form>

        {success && (
          <div className="mt-6 text-center">
            <Button variant="ghost" onClick={() => router.push("/")}>
              Close
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
