export default function ReceiptPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-hmif-cream p-6">
      <div className="w-full max-w-md rounded-2xl border border-hmif-gray-light/30 bg-hmif-white p-8 text-center shadow-md">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-hmif-gold/20 text-hmif-dark">
          <svg
            className="h-8 w-8 text-hmif-dark"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M5 13l4 4L19 7"
            />
          </svg>
        </div>
        <h1 className="mt-4 text-2xl font-black text-hmif-dark">
          Suara Berhasil Dicatat
        </h1>
        <p className="mt-2 text-xs text-hmif-gray-dark">
          Terima kasih telah berpartisipasi dalam Pemira HMIF. Pilihan Anda telah tersimpan secara anonim dan terenkripsi murni.
        </p>

        <div className="mt-6 rounded-xl bg-hmif-cream p-4 text-left border border-hmif-gray-light/20">
          <div className="text-[10px] font-bold uppercase tracking-wider text-hmif-gray-dark">
            Kode Tanda Terima Digital
          </div>
          <div className="mt-1 font-mono text-sm font-semibold text-hmif-dark break-all">
            RECEIPT-PENDING-TRANSACTION
          </div>
        </div>
      </div>
    </div>
  );
}
