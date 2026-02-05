"use client";

import React, { useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Text } from "@/components/ui/text";
import { Star, CheckCircle2, MessageSquare } from "lucide-react";

export default function ReviewPage() {
  const search = useSearchParams();
  const router = useRouter();

  const token = search.get("token") || "";

  const [tripRating, setTripRating] = useState<number>(5);
  const [driverRating, setDriverRating] = useState<number>(5);
  const [overallRating, setOverallRating] = useState<number>(5);
  const [comment, setComment] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const StarRating = ({ 
    value, 
    onChange, 
    label, 
    color = "blue" 
  }: { 
    value: number; 
    onChange: (v: number) => void; 
    label: string;
    color?: string;
  }) => {
    const colorClasses = {
      blue: "from-blue-500 to-blue-600",
      green: "from-green-500 to-green-600",
      purple: "from-purple-500 to-purple-600",
      orange: "from-orange-500 to-orange-600",
    };

    return (
      <div className="space-y-3">
        <label className="block text-base font-semibold text-gray-800">{label}</label>
        <div className="flex gap-2 items-center justify-center">
          {[1, 2, 3, 4, 5].map((star) => (
            <button
              key={star}
              type="button"
              onClick={() => onChange(star)}
              className="focus:outline-none transition-all hover:scale-125 active:scale-95"
            >
              <Star
                className={`w-10 h-10 transition-colors ${
                  star <= value
                    ? "fill-yellow-400 text-yellow-500 drop-shadow-lg"
                    : "fill-gray-200 text-gray-300"
                }`}
              />
            </button>
          ))}
        </div>
        <div className="text-center">
          <span className="inline-block px-4 py-1 rounded-full bg-gray-100 text-sm font-bold text-gray-700">
            {value} out of 5 stars
          </span>
        </div>
      </div>
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    if (!token) {
      setError("Invalid review link. Please use the link provided to you.");
      return;
    }

    if (!comment.trim()) {
      setError("Please share your experience with us in the comment section.");
      return;
    }

    setLoading(true);
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";
      const response = await fetch(`${apiUrl}/reviews/submit`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          token,
          tripRating,
          driverRating,
          overallRating,
          comment: comment.trim(),
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to submit review");
      }

      setSuccess("Thank you! Your review has been submitted successfully.");
      setComment("");
      setTripRating(5);
      setDriverRating(5);
      setOverallRating(5);
    } catch (err: any) {
      setError(err?.message || "Failed to submit review. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50 flex items-center justify-center p-4">
      <div className="w-full max-w-3xl">
        {/* Header Section */}
        <div className="bg-white rounded-2xl shadow-2xl overflow-hidden mb-6">
          <div className="bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 p-8 text-white text-center">
            <div className="inline-block p-3 bg-white/20 rounded-full mb-4">
              <MessageSquare className="w-12 h-12" />
            </div>
            <h1 className="text-4xl font-bold mb-2">Share Your Experience</h1>
            <p className="text-lg text-white/90">
              Your feedback helps us improve our service and ensures quality for future rides
            </p>
          </div>
        </div>

        {/* Main Content */}
        <div className="bg-white rounded-2xl shadow-2xl p-8">
          {!token && (
            <div className="bg-red-50 border-2 border-red-200 text-red-700 p-4 rounded-lg mb-6 text-center">
              <p className="font-semibold">⚠️ Invalid Review Link</p>
              <p className="text-sm mt-1">Please use the review link that was sent to you.</p>
            </div>
          )}

          {error && (
            <div className="bg-red-50 border-2 border-red-200 text-red-700 p-4 rounded-lg mb-6 text-center">
              <p className="font-semibold">{error}</p>
            </div>
          )}

          {success && (
            <div className="bg-gradient-to-r from-green-50 to-emerald-50 border-2 border-green-200 p-6 rounded-lg mb-6 text-center">
              <CheckCircle2 className="w-16 h-16 text-green-500 mx-auto mb-3" />
              <p className="text-xl font-bold text-green-800 mb-2">{success}</p>
              <p className="text-sm text-green-700">We truly appreciate you taking the time to share your feedback!</p>
            </div>
          )}

          {!success && (
            <form onSubmit={handleSubmit} className="space-y-8">
              {/* Trip Rating */}
              <div className="bg-gradient-to-br from-blue-50 to-blue-100 p-6 rounded-xl border-2 border-blue-200">
                <StarRating
                  value={tripRating}
                  onChange={setTripRating}
                  label="🚗 How was your trip?"
                  color="blue"
                />
              </div>

              {/* Driver Rating */}
              <div className="bg-gradient-to-br from-green-50 to-emerald-100 p-6 rounded-xl border-2 border-green-200">
                <StarRating
                  value={driverRating}
                  onChange={setDriverRating}
                  label="👤 How was your driver?"
                  color="green"
                />
              </div>

              {/* Overall Rating */}
              <div className="bg-gradient-to-br from-purple-50 to-pink-100 p-6 rounded-xl border-2 border-purple-200">
                <StarRating
                  value={overallRating}
                  onChange={setOverallRating}
                  label="⭐ Overall experience"
                  color="purple"
                />
              </div>

              {/* Comment Section */}
              <div className="bg-gradient-to-br from-orange-50 to-yellow-100 p-6 rounded-xl border-2 border-orange-200">
                <label className="block text-base font-semibold text-gray-800 mb-3">
                  💬 Tell us more about your experience
                </label>
                <textarea
                  className="w-full border-2 border-gray-300 rounded-lg p-4 min-h-[140px] focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent resize-none bg-white"
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  placeholder="Share details about your trip, driver behavior, vehicle condition, or any suggestions for improvement..."
                  maxLength={2000}
                />
                <div className="text-right mt-2 text-sm text-gray-500">
                  {comment.length}/2000 characters
                </div>
              </div>

              {/* Submit Button */}
              <Button 
                type="submit" 
                disabled={!token || loading} 
                className="w-full py-4 text-xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white rounded-xl shadow-lg hover:shadow-xl transition-all transform hover:scale-[1.02] active:scale-[0.98]"
              >
                {loading ? (
                  <span className="flex items-center justify-center gap-2">
                    <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                    Submitting Your Review...
                  </span>
                ) : (
                  "✨ Submit Review"
                )}
              </Button>
            </form>
          )}

          {success && (
            <div className="mt-8 text-center">
              <Button 
                variant="outline" 
                onClick={() => router.push("/")}
                className="px-8 py-3 text-lg font-semibold"
              >
                Close Window
              </Button>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="text-center mt-6 text-gray-600">
          <p className="text-sm">
            🔒 Your review is secure and helps us maintain quality service standards
          </p>
        </div>
      </div>
    </div>
  );
}
