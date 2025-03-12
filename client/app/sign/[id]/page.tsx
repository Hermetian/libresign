'use client';

import { useState, useRef, useEffect } from 'react';
import SignatureCanvas from 'react-signature-canvas';
import { useRouter } from 'next/navigation';

export default function SignDocumentPage({ params }: { params: { id: string } }) {
  const requestId = params.id;
  const router = useRouter();
  const [documentUrl, setDocumentUrl] = useState<string | null>(null);
  const [documentTitle, setDocumentTitle] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [signatureType, setSignatureType] = useState<'draw' | 'type'>('draw');
  const [typedName, setTypedName] = useState<string>('');
  const [consentChecked, setConsentChecked] = useState<boolean>(false);
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [success, setSuccess] = useState<boolean>(false);
  
  const signatureRef = useRef<SignatureCanvas | null>(null);
  
  useEffect(() => {
    const fetchDocument = async () => {
      try {
        const response = await fetch(`/api/documents/${requestId}/sign`);
        
        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.message || 'Failed to load document');
        }
        
        const data = await response.json();
        setDocumentUrl(data.documentUrl);
        setDocumentTitle(data.title || 'Untitled Document');
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
  }, [requestId]);
  
  const clearSignature = () => {
    if (signatureRef.current) {
      signatureRef.current.clear();
    }
  };
  
  const handleSubmit = async () => {
    if (!consentChecked) {
      setError('You must consent to using electronic signatures');
      return;
    }
    
    let signatureData = '';
    
    if (signatureType === 'draw') {
      if (signatureRef.current?.isEmpty()) {
        setError('Please draw your signature');
        return;
      }
      signatureData = signatureRef.current?.toDataURL() || '';
    } else {
      if (!typedName.trim()) {
        setError('Please type your name');
        return;
      }
      signatureData = typedName;
    }
    
    setError(null);
    setSubmitting(true);
    
    try {
      const response = await fetch(`/api/documents/${requestId}/sign`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          signatureData,
          signatureType,
        }),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to submit signature');
      }
      
      setSuccess(true);
      
      // Redirect to a thank you page after a short delay
      setTimeout(() => {
        router.push('/thank-you');
      }, 3000);
    } catch (error) {
      if (error instanceof Error) {
        setError(error.message);
      } else {
        setError('An unexpected error occurred while submitting your signature');
      }
    } finally {
      setSubmitting(false);
    }
  };
  
  if (loading) {
    return (
      <div className="container mx-auto p-6 text-center">
        <div className="animate-pulse">Loading document...</div>
      </div>
    );
  }
  
  if (error && !success) {
    return (
      <div className="container mx-auto p-6">
        <div className="bg-red-100 p-4 rounded">
          <p className="text-red-700">{error}</p>
        </div>
      </div>
    );
  }
  
  if (success) {
    return (
      <div className="container mx-auto p-6 text-center">
        <div className="bg-green-100 p-6 rounded">
          <h2 className="text-2xl font-bold text-green-700 mb-2">Document Signed Successfully!</h2>
          <p>Thank you for signing this document. You will be redirected in a moment...</p>
        </div>
      </div>
    );
  }
  
  return (
    <div className="container mx-auto p-6">
      <h1 className="text-2xl font-bold mb-6">Sign Document: {documentTitle}</h1>
      
      {documentUrl && (
        <div className="mb-8 border rounded p-2">
          <iframe
            src={documentUrl}
            className="w-full h-96 border-0"
            title="Document to sign"
          />
        </div>
      )}
      
      <div className="space-y-6">
        <div>
          <h2 className="text-xl font-semibold mb-2">Your Signature</h2>
          
          <div className="flex items-center space-x-4 mb-4">
            <button
              type="button"
              onClick={() => setSignatureType('draw')}
              className={`px-4 py-2 rounded ${
                signatureType === 'draw' ? 'bg-blue-500 text-white' : 'bg-gray-200'
              }`}
            >
              Draw
            </button>
            <button
              type="button"
              onClick={() => setSignatureType('type')}
              className={`px-4 py-2 rounded ${
                signatureType === 'type' ? 'bg-blue-500 text-white' : 'bg-gray-200'
              }`}
            >
              Type
            </button>
          </div>
          
          {signatureType === 'draw' ? (
            <div className="border rounded p-2">
              <SignatureCanvas
                ref={signatureRef}
                canvasProps={{
                  className: 'w-full h-40 bg-white',
                }}
                backgroundColor="white"
              />
              <div className="mt-2 text-right">
                <button
                  type="button"
                  onClick={clearSignature}
                  className="text-sm text-gray-600 hover:text-gray-900"
                >
                  Clear
                </button>
              </div>
            </div>
          ) : (
            <div className="border rounded p-2">
              <input
                type="text"
                value={typedName}
                onChange={(e) => setTypedName(e.target.value)}
                placeholder="Type your full name"
                className="w-full p-2 border-b focus:outline-none focus:border-blue-500"
              />
            </div>
          )}
        </div>
        
        <div className="flex items-start space-x-2">
          <input
            type="checkbox"
            id="consent"
            checked={consentChecked}
            onChange={(e) => setConsentChecked(e.target.checked)}
            className="mt-1"
          />
          <label htmlFor="consent" className="text-sm">
            I consent to use electronic signatures and records for this document. I understand that my electronic signature has the same legal effect as a handwritten signature.
          </label>
        </div>
        
        <div className="flex justify-end">
          <button
            type="button"
            onClick={handleSubmit}
            disabled={submitting}
            className="bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600 disabled:bg-gray-400"
          >
            {submitting ? 'Submitting...' : 'Sign Document'}
          </button>
        </div>
      </div>
    </div>
  );
} 