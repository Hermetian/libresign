'use client';

import { useState, useEffect } from 'react';

interface AuditLogEntry {
  id: string;
  userId: string;
  userName: string;
  action: string;
  timestamp: string;
  details: string;
  ipAddress?: string;
}

type Props = {
  documentId: string;
}

export default function AuditTrailClient({ documentId }: Props) {
  const [auditLogs, setAuditLogs] = useState<AuditLogEntry[]>([]);
  const [documentTitle, setDocumentTitle] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  
  useEffect(() => {
    const fetchAuditLogs = async () => {
      try {
        const response = await fetch(`/api/documents/${documentId}/audit`);
        
        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.message || 'Failed to load audit logs');
        }
        
        const data = await response.json();
        setAuditLogs(data.auditLogs || []);
        setDocumentTitle(data.documentTitle || 'Untitled Document');
      } catch (error) {
        if (error instanceof Error) {
          setError(error.message);
        } else {
          setError('An unexpected error occurred while loading audit logs');
        }
      } finally {
        setLoading(false);
      }
    };
    
    fetchAuditLogs();
  }, [documentId]);
  
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      timeZoneName: 'short'
    }).format(date);
  };
  
  const getActionColor = (action: string) => {
    switch(action.toLowerCase()) {
      case 'create':
      case 'upload':
        return 'text-blue-600';
      case 'view':
        return 'text-gray-600';
      case 'sign':
        return 'text-green-600';
      case 'request':
        return 'text-purple-600';
      case 'delete':
        return 'text-red-600';
      default:
        return 'text-gray-800';
    }
  };
  
  const downloadAuditTrail = async () => {
    try {
      const response = await fetch(`/api/documents/${documentId}/audit/download`);
      
      if (!response.ok) {
        throw new Error('Failed to download audit trail');
      }
      
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `audit-trail-${documentId}.pdf`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      a.remove();
    } catch (error) {
      if (error instanceof Error) {
        setError(error.message);
      } else {
        setError('An unexpected error occurred');
      }
    }
  };
  
  if (loading) {
    return (
      <div className="container mx-auto p-6 text-center">
        <div className="animate-pulse">Loading audit logs...</div>
      </div>
    );
  }
  
  return (
    <div className="container mx-auto p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Audit Trail: {documentTitle}</h1>
        <button
          onClick={downloadAuditTrail}
          className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
        >
          Download PDF
        </button>
      </div>
      
      {error && (
        <div className="bg-red-100 p-4 rounded mb-6">
          <p className="text-red-700">{error}</p>
        </div>
      )}
      
      {auditLogs.length === 0 ? (
        <div className="text-center p-8 bg-gray-50 rounded">
          <p className="text-gray-500">No audit logs found for this document.</p>
        </div>
      ) : (
        <div className="border rounded overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Time
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    User
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Action
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Details
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    IP Address
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {auditLogs.map((log) => (
                  <tr key={log.id}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {formatDate(log.timestamp)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {log.userName}
                    </td>
                    <td className={`px-6 py-4 whitespace-nowrap text-sm font-medium ${getActionColor(log.action)}`}>
                      {log.action}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500">
                      {log.details}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {log.ipAddress || 'N/A'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
} 