import React, { useEffect, useRef, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { ArrowLeft, Camera, CheckCircle2, FileCheck, Loader2, ScanLine, TriangleAlert } from 'lucide-react';
import { Html5Qrcode } from 'html5-qrcode';
import { useOrder } from '../api/hooks';
import { useClientOpId } from '../hooks/useClientOpId';
import { apiClient, ApiError } from '../../../shared/api/client';
import { LoadingState } from '../../../shared/components/LoadingState';
import { ErrorState } from '../../../shared/components/ErrorState';

type Outcome = 'full' | 'discrepancy';
type DiscrepancyCategory = 'short' | 'damaged' | 'wrong_item' | 'temperature';

const CATEGORY_LABELS: Record<DiscrepancyCategory, string> = {
  short: 'Short delivery',
  damaged: 'Damaged / leaking',
  wrong_item: 'Wrong item',
  temperature: 'Temperature problem',
};

const RECEIPT_SCANNER_ID = 'receipt-qr-scanner';

function isAlreadyConfirmed(error: unknown) {
  return error instanceof ApiError && (
    error.code === 'ALREADY_CONFIRMED' ||
    error.code === 'RECEIPT_ALREADY_RECORDED' ||
    error.code === 'INVALID_TRANSITION'
  );
}

export const SM5ReceiptPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const { data: order, isLoading, isError, error, refetch } = useOrder(id);
  const [outcome, setOutcome] = useState<Outcome>('full');
  const [category, setCategory] = useState<DiscrepancyCategory>('short');
  const [note, setNote] = useState('');
  const [submitError, setSubmitError] = useState<unknown>(null);
  const [confirmed, setConfirmed] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [scannedQr, setScannedQr] = useState<string | null>(null);
  const [scannerError, setScannerError] = useState<string | null>(null);
  const scannerRef = useRef<Html5Qrcode | null>(null);
  const [getClientOpId, resetClientOpId] = useClientOpId();

  const orderWithReceipt = order as (typeof order & { receipt_status?: string }) | undefined;
  const alreadyConfirmed = confirmed || orderWithReceipt?.receipt_status === 'CONFIRMED';

  useEffect(() => {
    if (!order?.stop_id || alreadyConfirmed) return undefined;

    const scanner = new Html5Qrcode(RECEIPT_SCANNER_ID);
    scannerRef.current = scanner;
    let active = true;

    scanner.start(
      { facingMode: 'environment' },
      { fps: 10, qrbox: { width: 210, height: 210 } },
      (decodedText) => {
        if (!active) return;
        setScannedQr(decodedText);
        setScannerError(null);
        void scanner.stop().catch(() => undefined);
      },
      () => undefined,
    ).catch(() => {
      if (active) setScannerError('Camera unavailable. You can still confirm the receipt without scanning.');
    });

    return () => {
      active = false;
      if (scannerRef.current?.isScanning) {
        void scannerRef.current.stop().catch(() => undefined);
      }
      scannerRef.current?.clear();
      scannerRef.current = null;
    };
  }, [order?.stop_id, alreadyConfirmed]);

  async function submitReceipt(event: React.FormEvent) {
    event.preventDefault();
    if (!order?.stop_id || alreadyConfirmed) return;
    if (outcome === 'discrepancy' && !note.trim()) {
      setSubmitError(new Error('A discrepancy note is required.'));
      return;
    }

    setIsSubmitting(true);
    setSubmitError(null);
    const receiptNote = outcome === 'discrepancy'
      ? `[Category: ${CATEGORY_LABELS[category]}] ${note.trim()}`
      : note.trim() || undefined;

    try {
      await apiClient.recordReceipt(order.stop_id, {
        outcome,
        note: receiptNote,
        client_op_id: getClientOpId(),
      });
      resetClientOpId();
      setConfirmed(true);
    } catch (submitErr) {
      if (isAlreadyConfirmed(submitErr)) {
        setConfirmed(true);
      } else {
        setSubmitError(submitErr);
      }
    } finally {
      setIsSubmitting(false);
    }
  }

  if (isLoading) return <div className="p-4 lg:p-6"><LoadingState message="Loading receipt details…" /></div>;
  if (isError) return <div className="p-4 lg:p-6"><ErrorState error={error} title="Could not load receipt details" onRetry={() => refetch()} /></div>;
  if (!order) return <div className="p-4 lg:p-6"><ErrorState error={new Error('Order not found')} title="Order not found" /></div>;

  return (
    <div className="p-4 lg:p-6">
      <div className="mx-auto max-w-3xl space-y-5">
        <div className="flex items-center gap-3 border-b border-slate-200 pb-4">
          <Link to={`/store/orders/${order.id}`} aria-label="Back to order" className="rounded-full p-2 text-slate-600 hover:bg-slate-100"><ArrowLeft className="h-5 w-5" /></Link>
          <div><h1 className="text-xl font-bold text-slate-900">Confirm Receipt</h1><p className="text-sm text-slate-500">Order <span className="font-mono font-bold">{order.id}</span> • Stop <span className="font-mono font-bold">{order.stop_id ?? 'not assigned'}</span></p></div>
        </div>

        {alreadyConfirmed ? (
          <section data-testid="receipt-already-confirmed" className="rounded-xl border border-emerald-200 bg-emerald-50 p-8 text-center">
            <CheckCircle2 className="mx-auto h-12 w-12 text-emerald-700" />
            <h2 className="mt-3 text-xl font-bold text-emerald-950">Receipt already confirmed</h2>
            <p className="mt-2 text-sm text-emerald-800">This delivery receipt has already been recorded and cannot be submitted again.</p>
            <Link to={`/store/orders/${order.id}`} className="mt-5 inline-flex rounded-lg bg-emerald-700 px-4 py-2 text-sm font-semibold text-white">Back to order</Link>
          </section>
        ) : !order.stop_id ? (
          <ErrorState error={new Error('This order does not have a delivery stop yet.')} title="Receipt is not available" />
        ) : (
          <form onSubmit={submitReceipt} className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex items-center gap-3 rounded-lg bg-slate-50 p-4"><div className="flex h-10 w-10 items-center justify-center rounded-lg bg-brand-100 text-brand-700"><FileCheck className="h-5 w-5" /></div><div><h2 className="font-bold text-slate-900">Delivery outcome</h2><p className="text-xs text-slate-500">Choose the result after checking the delivered goods.</p></div></div>
            <div className="mt-5 rounded-lg border border-slate-200 p-4">
              <div className="flex items-center gap-2 text-sm font-bold text-slate-800"><ScanLine className="h-4 w-4 text-emerald-700" /> Optional delivery QR scan</div>
              <p className="mt-1 text-xs text-slate-500">Scan the driver or delivery authorization QR for reference. Scanning is optional.</p>
              <div className="mt-3 overflow-hidden rounded-lg bg-slate-950 p-2"><div id={RECEIPT_SCANNER_ID} className="min-h-[180px]" /></div>
              <div className="mt-2 flex items-start gap-2 text-xs text-slate-600"><Camera className="h-4 w-4 shrink-0 text-emerald-700" /><span>{scannedQr ? `Scanned: ${scannedQr}` : 'Allow camera access to scan a QR code.'}</span></div>
              {scannerError && <p className="mt-2 text-xs text-amber-700">{scannerError}</p>}
            </div>
            <div className="mt-5 grid gap-3 sm:grid-cols-2">
              <label className={`cursor-pointer rounded-lg border p-4 ${outcome === 'full' ? 'border-emerald-500 bg-emerald-50' : 'border-slate-200'}`}><input type="radio" name="outcome" checked={outcome === 'full'} onChange={() => setOutcome('full')} /> <span className="ml-2 text-sm font-semibold">Received in full</span></label>
              <label className={`cursor-pointer rounded-lg border p-4 ${outcome === 'discrepancy' ? 'border-orange-500 bg-orange-50' : 'border-slate-200'}`}><input type="radio" name="outcome" checked={outcome === 'discrepancy'} onChange={() => setOutcome('discrepancy')} /> <span className="ml-2 text-sm font-semibold">Report discrepancy</span></label>
            </div>

            {outcome === 'discrepancy' && (
              <div className="mt-5 rounded-lg border border-orange-200 bg-orange-50 p-4">
                <p className="flex items-center gap-2 text-sm font-bold text-orange-900"><TriangleAlert className="h-4 w-4" /> Discrepancy details</p>
                <div className="mt-3 grid gap-2 sm:grid-cols-2">
                  {(Object.keys(CATEGORY_LABELS) as DiscrepancyCategory[]).map((key) => <label key={key} className="flex items-center gap-2 rounded-md bg-white px-3 py-2 text-sm"><input type="radio" name="category" checked={category === key} onChange={() => setCategory(key)} /> {CATEGORY_LABELS[key]}</label>)}
                </div>
              </div>
            )}

            <label className="mt-5 block text-sm font-semibold text-slate-700">{outcome === 'discrepancy' ? 'Discrepancy note' : 'Receiving note'}{outcome === 'discrepancy' && <span className="text-red-600"> *</span>}<textarea value={note} onChange={(event) => setNote(event.target.value)} rows={4} className="mt-1 block w-full rounded-lg border border-slate-300 p-3 text-sm font-normal" placeholder={outcome === 'discrepancy' ? 'Describe what was missing or damaged' : 'Optional note'} /></label>
            {submitError !== null && <div className="mt-4"><ErrorState error={submitError} title="Receipt could not be submitted" /></div>}
            <button type="submit" disabled={isSubmitting} className="mt-5 flex w-full items-center justify-center gap-2 rounded-lg bg-emerald-700 px-4 py-3 text-sm font-bold text-white disabled:cursor-not-allowed disabled:bg-slate-300">{isSubmitting ? <><Loader2 className="h-4 w-4 animate-spin" /> Submitting…</> : 'Submit receipt'}</button>
          </form>
        )}
      </div>
    </div>
  );
};
