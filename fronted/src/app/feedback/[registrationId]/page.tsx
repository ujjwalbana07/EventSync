"use client";
import { useEffect, useState, FormEvent } from "react";
import { api } from "../../../utils/api";
import { useRouter, useParams } from "next/navigation";

export default function FeedbackPage() {
    const params = useParams();
    const router = useRouter();
    const registrationId = params.registrationId;

    const [rating, setRating] = useState(0);
    const [comments, setComments] = useState("");
    const [submitted, setSubmitted] = useState(false);
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e: FormEvent) => {
        e.preventDefault();
        setLoading(true);
        try {
            const res = await api.post(`/registrations/${registrationId}/feedback`, {
                rating,
                comments
            });
            if (res.ok) {
                setSubmitted(true);
                // Optional: Reload to show "already submitted" state if handled by backend, 
                // but since we show a thank you message, let's keep it simple.
                // If user insisted on "refresh", we can do:
                setTimeout(() => {
                    window.location.reload();
                }, 2000);
            } else {
                alert("Failed to submit feedback. You may have already submitted it.");
            }
        } catch (err) {
            console.error(err);
            alert("Error submitting feedback");
        } finally {
            setLoading(false);
        }
    };

    if (submitted) {
        return (
            <div className="min-h-screen bg-gray-900 text-white flex items-center justify-center p-4">
                <div className="bg-gray-800 p-8 rounded-lg max-w-md w-full text-center border border-gray-700">
                    <h1 className="text-3xl font-bold mb-4 text-green-400">Thank You!</h1>
                    <p className="text-gray-300 mb-6">Your feedback has been recorded.</p>
                    <button
                        onClick={() => router.push('/')}
                        className="bg-blue-600 hover:bg-blue-500 text-white px-6 py-2 rounded-full font-bold transition"
                    >
                        Go Home
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-900 text-white flex items-center justify-center p-4">
            <div className="bg-gray-800 p-8 rounded-lg max-w-md w-full border border-gray-700 shadow-xl">
                <h1 className="text-2xl font-bold mb-6 text-center">Event Feedback</h1>
                <p className="text-gray-400 text-center mb-6 text-sm">Please rate your experience.</p>

                <form onSubmit={handleSubmit} className="space-y-6">
                    <div>
                        <label className="block text-gray-300 mb-2 font-bold">Rating</label>
                        <div className="flex gap-4 justify-center">
                            {[1, 2, 3, 4, 5].map((star) => (
                                <button
                                    key={star}
                                    type="button"
                                    onClick={() => setRating(star)}
                                    className={`text-3xl transition ${rating >= star ? 'text-yellow-400 scale-110' : 'text-gray-600 hover:text-yellow-400'}`}
                                >
                                    ★
                                </button>
                            ))}
                        </div>
                    </div>

                    <div>
                        <label className="block text-gray-300 mb-2 font-bold">Comments</label>
                        <textarea
                            required
                            className="w-full p-3 rounded bg-gray-700 text-white border border-gray-600 focus:border-blue-500 outline-none h-32"
                            placeholder="Share your thoughts..."
                            value={comments}
                            onChange={(e) => setComments(e.target.value)}
                        />
                    </div>

                    <button
                        type="submit"
                        disabled={loading}
                        className={`w-full py-3 rounded font-bold text-lg transition ${loading ? 'bg-gray-600 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-500 text-white'}`}
                    >
                        {loading ? "Submitting..." : "Submit Feedback"}
                    </button>
                </form>
            </div>
        </div>
    );
}
