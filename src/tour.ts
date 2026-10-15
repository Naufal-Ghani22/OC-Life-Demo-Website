import { MAIN_TENANT, type State } from './data'

export type Step = {
  n: number
  title: string
  actor: string
  path: string
  alt?: string
  task: string
  why: string
  photo: string
  done: (s: State) => boolean
}

export const STEPS: Step[] = [
  {
    n: 1, title: 'Tenant memilah', actor: 'Tenant · Warung Bu Sari', path: '/tenant',
    task: 'Cek panduan pilah, lalu tekan “Wadah siap dijemput”.',
    why: 'Kemurnian ditentukan di sumber. Wadah ber-QR mengikat setiap kilogram ke satu tenant.',
    photo: '/kv/pickup.webp',
    done: (s) => s.binReady || !!s.demoBatch,
  },
  {
    n: 2, title: 'Petugas scan & QC', actor: 'Petugas Pickup · Pak Joko', path: '/petugas',
    task: 'Scan Wadah #07, ambil berat dari timbangan, foto, isi checklist, lalu simpan.',
    why: 'Pencatatan < 60 detik per wadah, tetap jalan saat sinyal hilang (mode offline).',
    photo: '/kv/mock-pickup.webp',
    done: (s) => !!s.demoBatch,
  },
  {
    n: 3, title: 'Quality gate otomatis', actor: 'Sistem OC-Life', path: '/petugas',
    task: 'Baca hasil quality gate, lalu tekan “Kirim ke PDU”.',
    why: 'Aturan tetap: 0 centang = Murni, kontaminan ringan = Pilah Ulang, anorganik/perusak = Ditolak.',
    photo: '/kv/hub.webp',
    done: (s) => s.tour.done.includes(3),
  },
  {
    n: 4, title: 'PDU menerima batch', actor: 'Operator PDU · Hendra', path: '/operator',
    task: 'Pilih batch Bu Sari, periksa proyeksi output, lalu “Terima & catat output”.',
    why: 'Hanya batch Murni yang masuk digester. Output biogas & bioslurry tercatat per batch.',
    photo: '/kv/pdu.webp',
    done: (s) => !!s.batches.find((b) => b.id === s.demoBatch)?.pdu,
  },
  {
    n: 5, title: 'Poin → e-voucher LPG', actor: 'Tenant & Koperasi SWK', path: '/tenant', alt: '/koperasi',
    task: 'Tukar 500 poin jadi e-voucher, lalu validasi kodenya di layar Koperasi.',
    why: 'Penjualan bioslurry mensubsidi LPG tenant. Voucher sekali pakai, tidak bisa diklaim dua kali.',
    photo: '/kv/koperasi.webp',
    done: (s) => s.vouchers.some((v) => v.tenantId === MAIN_TENANT && v.status === 'ditukar'),
  },
  {
    n: 6, title: 'Dampak & lacak balak', actor: 'Pengelola Kawasan', path: '/pengelola', alt: '/ledger',
    task: 'Lihat dashboard, lalu lacak batch Bu Sari di Impact Ledger dari dapur sampai tabung gas.',
    why: 'Laporan dampak siap audit: ton, CO₂e, m³ biogas, dan aliran subsidi silang dalam satu jejak.',
    photo: '/kv/farm.webp',
    done: (s) => s.tour.done.includes(6),
  },
]

export const ROLES = [
  { path: '/tenant', name: 'Tenant', who: 'Warung Bu Sari · Kios 07', device: 'HP', img: '/kv/ic-tenant.webp', desc: 'Lihat Poin Sirkular, Skor Hijau, tukar e-voucher LPG 3 kg.' },
  { path: '/petugas', name: 'Petugas Pickup', who: 'Pak Joko · E-Trike #01', device: 'HP', img: '/kv/ic-pickup.webp', desc: 'Scan QR wadah, timbang, foto, checklist — di bawah 1 menit.' },
  { path: '/operator', name: 'Operator PDU', who: 'Hendra · Reaktor AD-02', device: 'Laptop', img: '/kv/ic-biodigester.webp', desc: 'Terima batch Murni, catat biogas & bioslurry, kelola stok.' },
  { path: '/koperasi', name: 'Koperasi SWK', who: 'Slamet · Loket 02', device: 'HP', img: '/kv/koperasi.webp', desc: 'Validasi e-voucher tenant, cegah klaim ganda.' },
  { path: '/pengelola', name: 'Pengelola Kawasan', who: 'Bambang · Area Manager', device: 'Laptop', img: '/kv/ic-platform.webp', desc: 'KPI kawasan, peringkat tenant, unduh laporan dampak.' },
  { path: '/ledger', name: 'Auditor', who: 'Impact Ledger', device: 'Laptop', img: '/kv/hub.webp', desc: 'Telusuri batch ID dari tenant sampai tabung LPG.' },
]
