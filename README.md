# OC-Life · Demo Simulasi Terpandu

Website demo untuk juri BPC IDEANATION 2026 (terpisah dari company profile `oc-life-web`).
Satu batch sisa makanan diikuti melalui 6 langkah dan 5 peran; semua aksi saling terhubung.

## Menjalankan
```
npm install
npm run dev      # http://localhost:5173
npm run build    # hasil di dist/ (siap deploy Vercel / Netlify, SPA hash-route)
```

## Alur tur (± 3 menit)
1. **Tenant** (`#/tenant`) — centang 3 poin persiapan → *Wadah siap dijemput*
2. **Petugas** (`#/petugas`) — Scan QR → pilih *Warung Bu Sari* → timbang → foto → checklist → *Simpan batch*
3. **Quality gate** — hasil otomatis Murni / Pilah Ulang / Ditolak → *Kirim ke PDU*
4. **Operator PDU** (`#/operator`) — *Terima & catat output* (biogas, bioslurry, poin cair)
5. **Tenant → Koperasi** — tukar 500 poin jadi e-voucher → validasi di `#/koperasi` (coba cek 2× untuk melihat pencegahan klaim ganda)
6. **Pengelola** (`#/pengelola`) — dashboard, *Laporan dampak* (cetak/PDF) → **Impact Ledger** (`#/ledger`)

Panel tur di kanan bawah memandu setiap langkah. **Reset demo** (sidebar) mengembalikan data awal sebelum juri berikutnya.

## Catatan
- Data dummy deterministik: 1 SWK, 25 tenant, 30 hari. Tersimpan di `localStorage` browser.
- Konstanta bisnis ada di `src/data.ts` (`K`) — samakan dengan proposal bila berubah.
- Fitur lain: mode offline + sinkron, tombol *Urungkan* setelah simpan batch, tolak batch dengan alasan, jual bioslurry, ekspor JSON ledger, feed *Aktivitas* lintas peran.
