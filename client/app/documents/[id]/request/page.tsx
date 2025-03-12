'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

interface SignerInput {
  email: string;
  name: string;
}

export default function RequestSignaturesPage({ params }: { params: { id: string } }) {
  const documentId = params.id;
  const router = useRouter();
  const [signers, setSigners] = useState<SignerInput[]>([{ email: '', name: '' }]);
  const [message, setMessage] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<boolean>(false);

  const addSigner = () => {
    setSigners([...signers, { email: '', name: '' }]);
  };

  const removeSigner = (index: number) => {
    const newSigners = [...signers];
    newSigners.splice(index, 1);
    setSigners(newSigners);
  };

  const updateSigner = (index: number, field: keyof SignerInput, value: string) => {
    const newSigners = [...signers];
    newSigners[index] = { ...newSigners[index], [field]: value };
    setSigners(newSigners);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate form
    if (signers.some(signer => !signer.email || !signer.name)) {
      setError('All signers must have both name and email');
      return;
    }
    
    setIsSubmitting(true);
    setError(null);
    
    try {
      const response = await fetch(`/api/documents/${documentId}/requests`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          signers,
          message,
        }),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to send signature requests');
      }
      
      setSuccess(true);
      
      // Redirect to document page after a short delay
      setTimeout(() => {
        router.push(`/documents/${documentId}`);
      }, 2000);
    } catch (error) {
      if (error instanceof Error) {
        setError(error.message);
      } else {
        setError('An unexpected error occurred');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="container mx-auto p-6">
      <h1 className="text-2xl font-bold mb-6">Request Signatures</h1>
      
      {success ? (
        <div className="bg-green-100 p-4 rounded mb-4">
          Signature requests sent successfully!
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-6">
          {error && (
            <div className="bg-red-100 p-4 rounded mb-4">
              {error}
            </div>
          )}
          
          <div className="space-y-2">
            <label className="block font-medium">Message to signers (optional):</label>
            <textarea
              className="w-full border rounded p-2"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              rows={3}
              placeholder="Please sign this document at your earliest convenience."
            />
          </div>
          
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <h2 className="text-xl font-semibold">Signers</h2>
              <button
                type="button"
                onClick={addSigner}
                className="bg-blue-500 text-white px-3 py-1 rounded hover:bg-blue-600"
              >
                Add Signer
              </button>
            </div>
            
            {signers.map((signer, index) => (
              <div key={index} className="p-4 border rounded space-y-3">
                <div className="flex justify-between">
                  <h3 className="font-medium">Signer {index + 1}</h3>
                  {signers.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removeSigner(index)}
                      className="text-red-500"
                    >
                      Remove
                    </button>
                  )}
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-1">Name:</label>
                    <input
                      type="text"
                      value={signer.name}
                      onChange={(e) => updateSigner(index, 'name', e.target.value)}
                      className="w-full border rounded p-2"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Email:</label>
                    <input
                      type="email"
                      value={signer.email}
                      onChange={(e) => updateSigner(index, 'email', e.target.value)}
                      className="w-full border rounded p-2"
                      required
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
          
          <div className="flex justify-end">
            <button
              type="submit"
              disabled={isSubmitting}
              className="bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600 disabled:bg-gray-400"
            >
              {isSubmitting ? 'Sending...' : 'Send Signature Requests'}
            </button>
          </div>
        </form>
      )}
    </div>
  );
} 