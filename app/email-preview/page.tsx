'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export default function EmailPreviewPage() {
  const [tripId, setTripId] = useState('');
  const [previewHTML, setPreviewHTML] = useState('');
  const [loading, setLoading] = useState(false);
  const [emailResults, setEmailResults] = useState<any>(null);

  const generatePreview = async () => {
    if (!tripId.trim()) {
      alert('Please enter a Trip ID');
      return;
    }

    setLoading(true);
    try {
      const response = await fetch('/api/email/send-trip-summary', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ tripId: tripId.trim() }),
      });

      if (response.ok) {
        const result = await response.json();
        setEmailResults(result);
        alert(`Trip summary emails sent successfully!\n\nSent: ${result.statistics.totalSent}\nFailed: ${result.statistics.totalFailed}\n\nTrip Stats:\n- ${result.statistics.tripSummary.totalExpenses} expenses\n- ${result.statistics.tripSummary.totalAmount} total amount\n- ${result.statistics.tripSummary.settlementsNeeded} settlements needed\n- ${result.statistics.tripSummary.membersCount} members`);
      } else {
        const error = await response.json();
        alert(`Error: ${error.error}`);
      }
    } catch (error) {
      console.error('Error:', error);
      alert('Failed to generate trip summary');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col mt-16 p-6 bg-gray-50">
      <div className="w-full max-w-4xl mx-auto">
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>📧 Trip Summary Email Tester</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <label htmlFor="tripId" className="block text-sm font-medium text-gray-700 mb-1">
                  Trip ID
                </label>
                <input
                  type="text"
                  id="tripId"
                  value={tripId}
                  onChange={(e) => setTripId(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Enter Trip ID to test email"
                />
              </div>
              
              <button
                onClick={generatePreview}
                disabled={loading}
                className="w-full px-4 py-3 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-blue-400 disabled:cursor-not-allowed"
              >
                {loading ? 'Sending Trip Summary Emails...' : 'Send Trip Summary Emails'}
              </button>
            </div>

            {emailResults && (
              <div className="mt-6 p-4 bg-green-50 border border-green-200 rounded-lg">
                <h3 className="font-semibold text-green-800 mb-2">✅ Email Results</h3>
                <div className="text-sm text-green-700">
                  <p><strong>Successfully sent:</strong> {emailResults.statistics.totalSent} emails</p>
                  <p><strong>Failed:</strong> {emailResults.statistics.totalFailed} emails</p>
                  <br />
                  <p><strong>Trip Summary:</strong></p>
                  <ul className="list-disc ml-5">
                    <li>{emailResults.statistics.tripSummary.totalExpenses} total expenses</li>
                    <li>{emailResults.statistics.tripSummary.totalAmount} total amount</li>
                    <li>{emailResults.statistics.tripSummary.settlementsNeeded} settlements needed</li>
                    <li>{emailResults.statistics.tripSummary.membersCount} members</li>
                  </ul>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>ℹ️ How it Works</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4 text-sm text-gray-600">
              <p><strong>When you end a trip, the system automatically:</strong></p>
              <ul className="list-disc ml-5 space-y-1">
                <li>Generates a comprehensive trip summary</li>
                <li>Calculates optimal settlements between members</li>
                <li>Creates beautiful HTML email with all expense details</li>
                <li>Sends individual emails to all trip members</li>
                <li>Provides trip statistics and breakdown</li>
              </ul>
              
              <p className="mt-4"><strong>Email includes:</strong></p>
              <ul className="list-disc ml-5 space-y-1">
                <li>📋 Complete trip details and duration</li>
                <li>📊 Statistics (total spent, average per person, etc.)</li>
                <li>💰 Detailed list of all expenses with dates and categories</li>
                <li>⚖️ Settlement summary showing who owes what</li>
                <li>👥 List of all trip members</li>
                <li>🎨 Beautiful, mobile-responsive design</li>
              </ul>

              <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <p className="text-blue-800 font-semibold">💡 Pro Tip:</p>
                <p className="text-blue-700">Use this tester to send trip summaries manually, or they'll be sent automatically when you end a trip from the trip page!</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
