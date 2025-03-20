import AuditTrailClient from './AuditTrailClient';

type Params = Promise<{ id: string }>;

export default async function AuditTrailPage({
  params,
}: {
  params: Params;
}) {
  const resolvedParams = await params;
  return <AuditTrailClient documentId={resolvedParams.id} />;
} 