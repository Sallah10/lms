// components/ActivityLogs.tsx
"use client";

import { useEffect, useState } from "react";

interface ActivityLog {
  id: string;
  action: string;
  details: string | null;
  oldValue: string | null;
  newValue: string | null;
  createdAt: string;
  user: {
    name: string | null;
  };
  lead: {
    name: string | null;
    email: string | null;
  } | null;
}

interface ActivityLogsProps {
  leadId?: string;
  userId?: string;
  limit?: number;
}

export function ActivityLogs({
  leadId,
  userId,
  limit = 10,
}: ActivityLogsProps) {
  const [logs, setLogs] = useState<ActivityLog[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchLogs = async () => {
      try {
        const params = new URLSearchParams();
        if (leadId) params.append("leadId", leadId);
        if (userId) params.append("userId", userId);
        if (limit) params.append("limit", limit.toString());

        const response = await fetch(`/api/activity-logs?${params}`);
        if (response.ok) {
          const data = await response.json();
          setLogs(data.logs);
        }
      } catch (error) {
        console.error("Error fetching activity logs:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchLogs();
  }, [leadId, userId, limit]);

  if (loading) return <div>Loading activity logs...</div>;

  return (
    <div className="space-y-4">
      <h3 className="font-semibold">Activity Logs</h3>
      {logs.length === 0 ? (
        <p className="text-gray-500">No activity yet</p>
      ) : (
        <div className="space-y-2">
          {logs.map((log) => (
            <div key={log.id} className="border-l-4 border-blue-500 pl-4 py-2">
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <p className="font-medium">{log.action}</p>
                    <span className="text-xs text-gray-500">
                      by {log.user.name}
                    </span>
                  </div>

                  {/* SHOW LEAD INFORMATION IF AVAILABLE */}
                  {log.lead && (
                    <p className="text-sm text-gray-600 mb-1">
                      Lead: <strong>{log.lead.name}</strong> ({log.lead.email})
                    </p>
                  )}

                  {log.details && (
                    <p className="text-sm text-gray-700">{log.details}</p>
                  )}

                  {log.oldValue && log.newValue && (
                    <p className="text-sm text-gray-600">
                      Changed from{" "}
                      <span className="font-medium">{log.oldValue}</span>
                      to <span className="font-medium">{log.newValue}</span>
                    </p>
                  )}
                </div>

                <div className="text-right text-sm text-gray-500 whitespace-nowrap">
                  <p>{new Date(log.createdAt).toLocaleDateString()}</p>
                  <p>{new Date(log.createdAt).toLocaleTimeString()}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
{
  /* {logs.map((log) => (
            <div key={log.id} className="border-l-4 border-blue-500 pl-4 py-2">
              <div className="flex justify-between items-start">
                <div>
                  <p className="font-medium">{log.action}</p>
                  {log.details && <p className="text-sm">{log.details}</p>}
                  {log.oldValue && (
                    <p className="text-sm text-gray-600">
                      From: {log.oldValue}
                    </p>
                  )}
                  {log.newValue && (
                    <p className="text-sm text-gray-600">To: {log.newValue}</p>
                  )}
                </div>
                <div className="text-right text-sm text-gray-500">
                  <p>{log.user.name}</p>
                  <p>{new Date(log.createdAt).toLocaleDateString()}</p>
                </div>
              </div>
            </div>
          ))} */
}
