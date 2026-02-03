"use client";

import React, { useState, useMemo } from "react";
import { useSearchParams, useParams, useRouter } from "next/navigation";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Text } from "@/components/ui/text";
import { submitTripReviewPublic } from "@/lib/features/reviews/reviewApi";

export default function TripReviewPage() {
  const params = useParams();
  const search = useSearchParams();
  const router = useRouter();

  const tripId = String(params?.tripId || "");
  const driverId = search.get("driverId") || "";
  const franchiseId = search.get("franchiseId") || "";
  const customerId = search.get("customerId") || "";

  const [rating, setRating] = useState<number>(5);
  const [comment, setComment] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const isReady = useMemo(() => {
    return Boolean(tripId && driverId && franchiseId && customerId);
  }, [tripId, driverId, franchiseId, customerId]);

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
        rating,
        comment: comment.trim(),
      });
      setSuccess("Thank you! Your review has been submitted.");
      setComment("");
      setRating(5);
    } catch (err: any) {
      setError(err?.response?.data?.error || err?.message || "Failed to submit review");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-white flex items-center justify-center p-4">
      <div className="w-full max-w-xl border rounded-lg shadow-sm p-6">
        <Text as="h1" className="text-2xl font-semibold mb-2">Trip Review</Text>
        <Text as="p" className="text-sm text-gray-600 mb-6">
          Share your experience for Trip #{tripId.slice(0, 8).toUpperCase()}.
        </Text>

        {!isReady && (
          <div className="bg-yellow-50 border border-yellow-200 text-yellow-700 p-3 rounded mb-4">
            Missing trip or user details in the link. Ensure the link contains driverId, franchiseId and customerId.
          </div>
        )}

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 p-3 rounded mb-4">{error}</div>
        )}

        {success && (
          <div className="bg-green-50 border border-green-200 text-green-700 p-3 rounded mb-4">{success}</div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">Overall Rating (1–5)</label>
            <Input
              type="number"
              min={1}
              max={5}
              value={rating}
              onChange={(e) => setRating(parseInt(e.target.value || "5", 10))}
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Description</label>
            <textarea
              className="w-full border rounded-md p-2 min-h-[120px]"
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder="Tell us about the trip and driver experience"
            />
          </div>

          <Button type="submit" disabled={!isReady || loading} className="w-full">
            {loading ? "Submitting..." : "Submit Review"}
          </Button>
        </form>

        <div className="mt-6 text-center">
          <Button variant="ghost" onClick={() => router.push("/")}>Back to Home</Button>
        </div>
      </div>
    </div>
  );
}
