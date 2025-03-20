'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { use } from 'react';

interface Signature {
  id: string;
  signerName: string;
  signerEmail: string;
  completedAt: string | null;
}

interface Document {
  id: string;
  title: string;
  status: 'draft' | 'pending' | 'completed';
  createdAt: string;
  updatedAt: string;
  documentUrl: string;
  signatures: Signature[];
}

type Params = Promise<{ id: string }>;

export default function DocumentDetailsPage(props: { params: Params }) {
  const params = use(props.params);
  const documentId = params.id;
  const router = useRouter();
  const [document, setDocument] = useState<Document | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [deleteModalOpen, setDeleteModalOpen] = useState<boolean>(false);
  
  useEffect(() => {
    const fetchDocument = async () => {
      try {
        const response = await fetch(`/api/documents/${documentId}`);
        
        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.message || 'Failed to load document');
        }
        
        const data = await response.json();
        setDocument(data);
      } catch (error) {
        if (error instanceof Error) {
          setError(error.message);
        } else {
          setError('An unexpected error occurred while loading the document');
        }
      } finally {
        setLoading(false);
      }
    };
    
    fetchDocument();
  }, [documentId]);
  
  const formatDate = (dateString: string) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).format(date);
  };
  
  const getStatusBadge = (status: Document['status']) => {
    const classNames = {
      draft: 'bg-gray-100 text-gray-800',
      pending: 'bg-yellow-100 text-yellow-800',
      completed: 'bg-green-100 text-green-800',
    };
    
    return (
      <span className={`px-2 py-1 rounded-full text-xs ${classNames[status]}`}>
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </span>
    );
  };
  
  const handleDelete = async () => {
    try {
      const response = await fetch(`/api/documents/${documentId}`, {
        method: 'DELETE',
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to delete document');
      }
      
      // Redirect to the dashboard after successful deletion
      router.push('/dashboard');
    } catch (error) {
      if (error instanceof Error) {
        setError(error.message);
      } else {
        setError('An unexpected error occurred while deleting the document');
      }
    } finally {
      setDeleteModalOpen(false);
    }
  };
  
  const handleDownload = async () => {
    try {
      const response = await fetch(`/api/documents/${documentId}/download`);
      
      if (!response.ok) {
        throw new Error('Failed to download document');
      }
      
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = window.document.createElement('a');
      a.href = url;
      a.download = `${document?.title || 'document'}.pdf`;
      window.document.body.appendChild(a);
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
        <div className="animate-pulse">Loading document...</div>
      </div>
    );
  }
  
  if (error && !document) {
    return (
      <div className="container mx-auto p-6">
        <div className="bg-red-100 p-4 rounded">
          <p className="text-red-700">{error}</p>
        </div>
      </div>
    );
  }
  
  if (!document) {
    return (
      <div className="container mx-auto p-6 text-center">
        <p className="text-gray-700">Document not found.</p>
      </div>
    );
  }
  
  return (
    <div className="container mx-auto p-6">
      {error && (
        <div className="bg-red-100 p-4 rounded mb-6">
          <p className="text-red-700">{error}</p>
        </div>
      )}
      
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold">{document.title}</h1>
          <div className="mt-2 flex items-center space-x-2">
            <span className="text-sm text-gray-500">Status:</span>
            {getStatusBadge(document.status)}
          </div>
        </div>
        
        <div className="flex space-x-2">
          <button
            onClick={handleDownload}
            className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
          >
            Download
          </button>
          
          {document.status === 'draft' && (
            <Link
              href={`/documents/${documentId}/request`}
              className="bg-purple-500 text-white px-4 py-2 rounded hover:bg-purple-600"
            >
              Request Signatures
            </Link>
          )}
          
          <Link
            href={`/documents/${documentId}/audit`}
            className="bg-gray-500 text-white px-4 py-2 rounded hover:bg-gray-600"
          >
            Audit Trail
          </Link>
          
          <button
            onClick={() => setDeleteModalOpen(true)}
            className="bg-red-500 text-white px-4 py-2 rounded hover:bg-red-600"
          >
            Delete
          </button>
        </div>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div>
          <div className="border rounded overflow-hidden mb-6">
            <iframe
              src={document.documentUrl}
              className="w-full h-[600px] border-0"
              title={document.title}
            />
          </div>
        </div>
        
        <div>
          <div className="bg-gray-50 p-6 rounded border mb-6">
            <h2 className="text-xl font-semibold mb-4">Document Information</h2>
            <dl className="grid grid-cols-2 gap-x-4 gap-y-2">
              <dt className="text-sm text-gray-500">Created</dt>
              <dd className="text-sm">{formatDate(document.createdAt)}</dd>
              
              <dt className="text-sm text-gray-500">Last Updated</dt>
              <dd className="text-sm">{formatDate(document.updatedAt)}</dd>
            </dl>
          </div>
          
          <div className="bg-gray-50 p-6 rounded border">
            <h2 className="text-xl font-semibold mb-4">Signatures</h2>
            
            {document.signatures.length === 0 ? (
              <p className="text-gray-500">No signatures requested yet.</p>
            ) : (
              <div className="space-y-4">
                {document.signatures.map((signature) => (
                  <div key={signature.id} className="p-4 border rounded">
                    <div className="flex justify-between">
                      <div>
                        <h3 className="font-medium">{signature.signerName}</h3>
                        <p className="text-sm text-gray-500">{signature.signerEmail}</p>
                      </div>
                      <div>
                        {signature.completedAt ? (
                          <span className="bg-green-100 text-green-800 px-2 py-1 rounded-full text-xs">
                            Signed: {formatDate(signature.completedAt)}
                          </span>
                        ) : (
                          <span className="bg-yellow-100 text-yellow-800 px-2 py-1 rounded-full text-xs">
                            Pending
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
      
      {deleteModalOpen && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center z-10">
          <div className="bg-white p-6 rounded-lg shadow-lg max-w-md w-full">
            <h2 className="text-xl font-bold mb-4">Confirm Deletion</h2>
            <p className="mb-6">
              Are you sure you want to delete this document? This action cannot be undone.
            </p>
            <div className="flex justify-end space-x-2">
              <button
                onClick={() => setDeleteModalOpen(false)}
                className="bg-gray-200 px-4 py-2 rounded hover:bg-gray-300"
              >
                Cancel
              </button>
              <button
                onClick={handleDelete}
                className="bg-red-500 text-white px-4 py-2 rounded hover:bg-red-600"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
} 