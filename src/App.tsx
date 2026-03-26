import { useMemo, useState, type ReactNode } from "react";
import { AnimatePresence, motion } from "motion/react";
import type { LucideIcon } from "lucide-react";
import {
  Bell,
  Camera,
  ChevronLeft,
  Clock3,
  Circle,
  Gift,
  Home,
  Leaf,
  Link as LinkIcon,
  LoaderCircle,
  MapPin,
  QrCode,
  ScanLine,
  Scale,
  CheckCircle2,
  X,
} from "lucide-react";

type Screen = "home" | "deposit" | "status" | "catalog";
type ToastTone = "success" | "info" | "warn";
type StatusTone = "done" | "progress" | "wait";
type GradeKey = "A" | "B" | "C";
type ScannerStep = "idle" | "validating";

type PhoneFrameProps = {
  children: ReactNode;
  title?: string;
  subtitle?: string;
  leftIcon?: ReactNode;
  rightIcon?: ReactNode;
  overlay?: ReactNode;
  footer?: ReactNode;
};

type BottomNavItem = {
  key: Screen;
  icon: LucideIcon;
  label: string;
};

type ActivityItem = {
  id: string;
  time: string;
  message: string;
};

type Batch = {
  id: string;
  submittedAt: string;
  location: string;
  weightKg: number;
  gradeLabel: GradeKey;
  gradeFactor: number;
  pendingTokens: number;
  minted: boolean;
};

type Reward = {
  id: string;
  emoji: string;
  title: string;
  price: number;
  note?: string;
};

type RewardCardProps = {
  reward: Reward;
  onRedeem: (reward: Reward) => void;
  canRedeem: boolean;
};

type StatusRowProps = {
  icon: ReactNode;
  title: string;
  detail: string;
  tone?: StatusTone;
};

const SCREEN_INDEX: Record<Screen, number> = {
  home: 0,
  deposit: 1,
  status: 2,
  catalog: 3,
};

const GRADE_OPTIONS: Record<
  GradeKey,
  { label: string; factor: number; badge: string }
> = {
  A: { label: "Murni Organik", factor: 1.2, badge: "🟢" },
  B: { label: "Campuran Ringan", factor: 1.0, badge: "🟡" },
  C: { label: "Perlu Sortir Ulang", factor: 0.8, badge: "🟠" },
};

const REWARDS: Reward[] = [
  { id: "beras", emoji: "🍚", title: "Beras Premium 50 Kg", price: 10 },
  {
    id: "telur",
    emoji: "🥚",
    title: "Telur Ayam 10 Kg (Kop Merah Putih)",
    price: 70,
  },
  { id: "ayam", emoji: "🥩", title: "Daging Ayam 5 Kg", price: 80 },
];

const INITIAL_ACTIVITIES: ActivityItem[] = [
  {
    id: "a1",
    time: "Hari ini, 08:30",
    message: "✅ Validasi smart contract berhasil (Batch #882). +50 MBG",
  },
  {
    id: "a2",
    time: "Kemarin, 14:00",
    message: "🔄 Penukaran 200 MBG untuk subsidi beras 10 kg.",
  },
];

function formatToken(value: number): string {
  return new Intl.NumberFormat("id-ID", {
    minimumFractionDigits: value % 1 === 0 ? 0 : 1,
    maximumFractionDigits: 1,
  }).format(value);
}

function formatKg(value: number): string {
  return new Intl.NumberFormat("id-ID", {
    minimumFractionDigits: value % 1 === 0 ? 0 : 1,
    maximumFractionDigits: 1,
  }).format(value);
}

function PhoneFrame({
  children,
  title,
  subtitle,
  leftIcon,
  rightIcon,
  overlay,
  footer,
}: PhoneFrameProps) {
  return (
    <div className="mx-auto w-[350px] rounded-[2.6rem] border-8 border-slate-900 bg-slate-900 p-2 shadow-2xl">
      <div className="overflow-hidden rounded-[2rem] bg-white">
        <div className="flex h-6 items-center justify-center">
          <div className="mt-2 h-1.5 w-20 rounded-full bg-slate-300" />
        </div>

        <div className="relative min-h-[720px] px-4 pb-5">
          {(title || subtitle || leftIcon || rightIcon) && (
            <div className="flex items-start justify-between pt-3">
              <div className="flex items-center gap-2 text-slate-700">
                {leftIcon}
                <div>
                  {title && (
                    <div className="text-base font-bold leading-tight">
                      {title}
                    </div>
                  )}
                  {subtitle && (
                    <div className="mt-0.5 text-xs text-slate-500">
                      {subtitle}
                    </div>
                  )}
                </div>
              </div>
              <div>{rightIcon}</div>
            </div>
          )}

          <div className="relative mt-4">{children}</div>
          {footer}
          <AnimatePresence>{overlay}</AnimatePresence>
        </div>
      </div>
    </div>
  );
}

function SectionTitle({ children }: { children: ReactNode }) {
  return (
    <div className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">
      {children}
    </div>
  );
}

function StatusRow({
  icon,
  title,
  detail,
  tone = "done",
}: StatusRowProps) {
  const styles: Record<StatusTone, string> = {
    done: "bg-emerald-100 text-emerald-700",
    progress: "bg-amber-100 text-amber-700",
    wait: "bg-slate-100 text-slate-500",
  };

  return (
    <div className="flex gap-3 rounded-2xl border border-slate-200 p-3">
      <div
        className={`mt-0.5 flex h-8 w-8 items-center justify-center rounded-xl ${styles[tone]}`}
      >
        {icon}
      </div>
      <div>
        <div className="text-sm font-semibold text-slate-800">{title}</div>
        <div className="mt-1 text-xs leading-5 text-slate-500">{detail}</div>
      </div>
    </div>
  );
}

function RewardCard({ reward, onRedeem, canRedeem }: RewardCardProps) {
  return (
    <motion.div
      layout
      whileHover={{ y: -2 }}
      transition={{ type: "spring", stiffness: 340, damping: 24 }}
      className="rounded-3xl border border-slate-200 p-4 shadow-sm"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-amber-50 text-2xl">
            {reward.emoji}
          </div>

          <div>
            <div className="text-sm font-semibold text-slate-800">
              {reward.title}
            </div>
            <div className="mt-1 text-xs text-slate-500">
              Harga: {formatToken(reward.price)} MBG Token
            </div>
            {reward.note && (
              <div className="mt-1 text-xs text-emerald-700">{reward.note}</div>
            )}
          </div>
        </div>
      </div>

      <button
        onClick={() => onRedeem(reward)}
        disabled={!canRedeem}
        className={`mt-4 w-full rounded-2xl px-4 py-3 text-sm font-semibold text-white ${
          canRedeem
            ? "bg-emerald-600"
            : "cursor-not-allowed bg-slate-300 text-slate-100"
        }`}
      >
        {canRedeem ? "Tukar Sekarang" : "Saldo Tidak Cukup"}
      </button>
    </motion.div>
  );
}

function BottomNav({
  activeScreen,
  onNavigate,
}: {
  activeScreen: Screen;
  onNavigate: (screen: Screen) => void;
}) {
  const items: BottomNavItem[] = [
    { key: "home", icon: Home, label: "Beranda" },
    { key: "deposit", icon: Camera, label: "Setor" },
    { key: "status", icon: LinkIcon, label: "Status" },
    { key: "catalog", icon: Gift, label: "Katalog" },
  ];

  return (
    <div className="mt-6 border-t border-slate-200 pt-3">
      <div className="grid grid-cols-4 gap-2 text-center">
        {items.map((item) => {
          const Icon = item.icon;
          const active = item.key === activeScreen;

          return (
            <button
              key={item.key}
              onClick={() => onNavigate(item.key)}
              className="flex flex-col items-center gap-1"
            >
              <motion.div
                layout
                className={`rounded-2xl p-2 ${
                  active
                    ? "bg-emerald-100 text-emerald-700"
                    : "bg-slate-100 text-slate-500"
                }`}
              >
                <Icon className="h-4 w-4" />
              </motion.div>
              <div
                className={`text-[11px] ${
                  active ? "font-semibold text-emerald-700" : "text-slate-500"
                }`}
              >
                {item.label}
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}

function ScannerOverlay({
  isValidating,
  onClose,
  onConfirm,
}: {
  isValidating: boolean;
  onClose: () => void;
  onConfirm: () => void;
}) {
  return (
    <motion.div
      key="scanner"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="absolute inset-0 z-30 bg-slate-950/75 backdrop-blur-[2px]"
    >
      <div className="absolute right-4 top-4">
        <button
          onClick={onClose}
          className="rounded-full bg-white/10 p-2 text-white"
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      <div className="flex h-full flex-col items-center justify-center px-6 text-white">
        <div className="text-sm font-semibold">Pemindaian QR</div>
        <div className="mt-2 text-center text-xs leading-5 text-slate-200">
          Arahkan kamera ke label wadah limbah untuk mengisi form secara
          otomatis.
        </div>

        <div className="relative mt-6 h-64 w-64 overflow-hidden rounded-[2rem] border-2 border-white/70">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(16,185,129,0.15),transparent_60%)]" />
          <motion.div
            animate={{ y: [12, 208, 12] }}
            transition={{ duration: 2.2, repeat: Infinity, ease: "easeInOut" }}
            className="absolute left-4 right-4 h-1 rounded-full bg-emerald-400 shadow-[0_0_20px_rgba(52,211,153,0.9)]"
          />
          <div className="absolute inset-5 rounded-[1.4rem] border border-dashed border-white/40" />
          <div className="absolute bottom-4 left-4 rounded-full bg-white/10 px-3 py-1 text-[11px] font-medium text-emerald-200">
            {isValidating ? "Memvalidasi QR..." : "Siap memindai"}
          </div>
        </div>

        <div className="mt-6 grid w-full max-w-[270px] gap-3">
          <button
            onClick={onConfirm}
            disabled={isValidating}
            className="rounded-2xl bg-emerald-500 px-4 py-3 text-sm font-semibold text-white disabled:opacity-60"
          >
            {isValidating ? "Membaca Kode..." : "Kirim Kode QR"}
          </button>
          <button
            onClick={onClose}
            className="rounded-2xl border border-white/20 bg-white/10 px-4 py-3 text-sm font-semibold text-white"
          >
            Tutup Scanner
          </button>
        </div>
      </div>
    </motion.div>
  );
}

function RedeemModal({
  reward,
  tokenBalance,
  onCancel,
  onConfirm,
}: {
  reward: Reward;
  tokenBalance: number;
  onCancel: () => void;
  onConfirm: () => void;
}) {
  const remaining = tokenBalance - reward.price;

  return (
    <motion.div
      key="redeem-modal"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="absolute inset-0 z-30 flex items-end bg-slate-950/45 p-4 backdrop-blur-[2px]"
    >
      <motion.div
        initial={{ y: 40, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: 40, opacity: 0 }}
        transition={{ type: "spring", stiffness: 320, damping: 28 }}
        className="w-full rounded-[2rem] bg-white p-5 shadow-2xl"
      >
        <div className="flex items-start justify-between gap-3">
          <div>
            <div className="text-sm font-semibold text-slate-900">
              Konfirmasi Penukaran
            </div>
            <div className="mt-1 text-xs leading-5 text-slate-500">
              Pastikan saldo dan item sudah sesuai sebelum voucher diterbitkan.
            </div>
          </div>
          <button
            onClick={onCancel}
            className="rounded-full bg-slate-100 p-2 text-slate-600"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="mt-4 rounded-3xl border border-slate-200 p-4">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-amber-50 text-2xl">
              {reward.emoji}
            </div>
            <div>
              <div className="text-sm font-semibold text-slate-800">
                {reward.title}
              </div>
              <div className="mt-1 text-xs text-slate-500">
                Harga {formatToken(reward.price)} MBG Token
              </div>
            </div>
          </div>

          <div className="mt-4 grid grid-cols-2 gap-3 text-xs">
            <div className="rounded-2xl bg-slate-50 p-3">
              <div className="text-slate-500">Saldo saat ini</div>
              <div className="mt-1 text-sm font-semibold text-slate-800">
                {formatToken(tokenBalance)} MBG
              </div>
            </div>
            <div className="rounded-2xl bg-emerald-50 p-3">
              <div className="text-emerald-700">Sisa setelah tukar</div>
              <div className="mt-1 text-sm font-semibold text-emerald-800">
                {formatToken(Math.max(remaining, 0))} MBG
              </div>
            </div>
          </div>
        </div>

        <div className="mt-4 grid grid-cols-2 gap-3">
          <button
            onClick={onCancel}
            className="rounded-2xl border border-slate-200 px-4 py-3 text-sm font-semibold text-slate-700"
          >
            Batal
          </button>
          <button
            onClick={onConfirm}
            className="rounded-2xl bg-emerald-600 px-4 py-3 text-sm font-semibold text-white"
          >
            Konfirmasi Tukar
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}

export default function MBGTokenWireframeMobile() {
  const [activeScreen, setActiveScreen] = useState<Screen>("home");
  const [direction, setDirection] = useState<number>(1);
  const [tokenBalance, setTokenBalance] = useState<number>(1250);
  const [totalWasteKg, setTotalWasteKg] = useState<number>(450);
  const [emissionReducedKg, setEmissionReducedKg] = useState<number>(120);
  const [notifications, setNotifications] = useState<number>(1);
  const [activities, setActivities] =
    useState<ActivityItem[]>(INITIAL_ACTIVITIES);
  const [batchCounter, setBatchCounter] = useState<number>(883);
  const [currentBatch, setCurrentBatch] = useState<Batch | null>(null);
  const [voucherMessage, setVoucherMessage] = useState<string | null>(null);
  const [toast, setToast] = useState<{
    tone: ToastTone;
    message: string;
  } | null>({
    tone: "info",
    message:
      "*Referensi konsep dan hasil akhir dapat berubah sesuai dengan kebutuhan teknis",
  });

  const [locationInput, setLocationInput] = useState<string>(
    "Dapur #04, Jakarta Barat"
  );
  const [weightInput, setWeightInput] = useState<string>("18.5");
  const [gradeInput, setGradeInput] = useState<GradeKey>("A");
  const [scannerOpen, setScannerOpen] = useState<boolean>(false);
  const [scannerStep, setScannerStep] = useState<ScannerStep>("idle");
  const [pendingReward, setPendingReward] = useState<Reward | null>(null);

  const weightValue = Number(weightInput) > 0 ? Number(weightInput) : 0;
  const selectedGrade = GRADE_OPTIONS[gradeInput];

  const estimatedTokens = useMemo(
    () => Number((weightValue * selectedGrade.factor).toFixed(1)),
    [selectedGrade.factor, weightValue]
  );

  const estimatedEmissions = useMemo(
    () => Number((weightValue * 0.265).toFixed(1)),
    [weightValue]
  );

  const nextBatchId = useMemo(
    () => `MBG-WST-20260324-${batchCounter}`,
    [batchCounter]
  );

  function navigateTo(screen: Screen) {
    setDirection(SCREEN_INDEX[screen] >= SCREEN_INDEX[activeScreen] ? 1 : -1);
    setActiveScreen(screen);
  }

  function addActivity(message: string, time = "Baru saja") {
    setActivities((prev) => [
      {
        id: `${Date.now()}-${Math.random()}`,
        time,
        message,
      },
      ...prev,
    ]);
  }

  function handleScannerDemo() {
    setScannerStep("validating");

    window.setTimeout(() => {
      setScannerStep("idle");
      setScannerOpen(false);
      setLocationInput("Dapur #04, Jakarta Barat");
      setWeightInput("18.5");
      setGradeInput("A");
      setToast({
        tone: "success",
        message:
          "Kode QR terbaca. Form setor limbah diisi otomatis dan siap disesuaikan.",
      });
    }, 900);
  }

  function handleSubmitBatch() {
    if (!locationInput.trim() || weightValue <= 0) {
      setToast({
        tone: "warn",
        message:
          "Lengkapi lokasi dan berat limbah yang valid sebelum dikirim.",
      });
      return;
    }

    const batch: Batch = {
      id: nextBatchId,
      submittedAt: "24 Mar 2026, 09:15 WIB",
      location: locationInput,
      weightKg: weightValue,
      gradeLabel: gradeInput,
      gradeFactor: selectedGrade.factor,
      pendingTokens: estimatedTokens,
      minted: false,
    };

    setCurrentBatch(batch);
    setBatchCounter((prev) => prev + 1);
    setVoucherMessage(null);
    setPendingReward(null);
    setToast({
      tone: "info",
      message: `${batch.id} dikirim. Lanjutkan ke Status untuk menyelesaikan penerbitan token.`,
    });
    setDirection(1);
    setActiveScreen("status");
  }

  function handleCompleteMint() {
    if (!currentBatch || currentBatch.minted) return;

    const mintedBatch: Batch = { ...currentBatch, minted: true };
    const emissionGain = Number((mintedBatch.weightKg * 0.265).toFixed(1));

    setCurrentBatch(mintedBatch);
    setTokenBalance((prev) =>
      Number((prev + mintedBatch.pendingTokens).toFixed(1))
    );
    setTotalWasteKg((prev) => Number((prev + mintedBatch.weightKg).toFixed(1)));
    setEmissionReducedKg((prev) =>
      Number((prev + emissionGain).toFixed(1))
    );
    setNotifications((prev) => prev + 1);

    addActivity(
      `✅ Penerbitan token berhasil untuk ${mintedBatch.id}. +${formatToken(
        mintedBatch.pendingTokens
      )} MBG`
    );

    setToast({
      tone: "success",
      message: `Penerbitan selesai. Saldo bertambah ${formatToken(
        mintedBatch.pendingTokens
      )} MBG Token.`,
    });
  }

  function requestRedeem(reward: Reward) {
    if (tokenBalance < reward.price) {
      setToast({
        tone: "warn",
        message: `Saldo belum cukup untuk menukar ${reward.title}.`,
      });
      return;
    }

    setPendingReward(reward);
  }

  function confirmRedeem() {
    if (!pendingReward) return;

    const reward = pendingReward;

    setTokenBalance((prev) => Number((prev - reward.price).toFixed(1)));
    setNotifications((prev) => prev + 1);

    const voucher = `QR-VCH-${Math.floor(100000 + Math.random() * 900000)}`;

    setVoucherMessage(
      `Voucher berhasil dibuat untuk ${reward.title}. Kode: ${voucher}`
    );

    addActivity(
      `🎟️ Penukaran berhasil: ${reward.title} (${formatToken(reward.price)} MBG).`
    );

    setPendingReward(null);
    setToast({
      tone: "success",
      message: `${reward.title} berhasil ditukar. Voucher QR telah diterbitkan.`,
    });
  }

  function resetDemo() {
    setDirection(-1);
    setActiveScreen("home");
    setTokenBalance(1250);
    setTotalWasteKg(450);
    setEmissionReducedKg(120);
    setNotifications(1);
    setActivities(INITIAL_ACTIVITIES);
    setBatchCounter(883);
    setCurrentBatch(null);
    setVoucherMessage(null);
    setPendingReward(null);
    setScannerOpen(false);
    setScannerStep("idle");
    setLocationInput("Dapur #04, Jakarta Barat");
    setWeightInput("18.5");
    setGradeInput("A");
    setToast({
      tone: "info",
      message: "Mock-up kembali ke kondisi awal.",
    });
  }

  const toastStyles: Record<ToastTone, string> = {
    success: "border-emerald-200 bg-emerald-50 text-emerald-800",
    info: "border-sky-200 bg-sky-50 text-sky-800",
    warn: "border-amber-200 bg-amber-50 text-amber-800",
  };

  const screenTransition = {
    enter: (customDirection: number) => ({
      x: customDirection > 0 ? 36 : -36,
      opacity: 0,
      scale: 0.98,
    }),
    center: {
      x: 0,
      opacity: 1,
      scale: 1,
    },
    exit: (customDirection: number) => ({
      x: customDirection > 0 ? -36 : 36,
      opacity: 0,
      scale: 0.98,
    }),
  };

  const leftIcon =
    activeScreen === "home" ? (
      <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-emerald-100 font-bold text-emerald-700">
        DS
      </div>
    ) : (
      <button
        onClick={() => navigateTo("home")}
        className="rounded-2xl bg-slate-100 p-2.5 text-slate-700"
      >
        <ChevronLeft className="h-4 w-4" />
      </button>
    );

  const rightIcon =
    activeScreen === "home" ? (
      <div className="relative rounded-2xl bg-slate-100 p-2.5 text-slate-700">
        <Bell className="h-4 w-4" />
        <span className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full bg-rose-500 text-[10px] font-bold text-white">
          {notifications}
        </span>
      </div>
    ) : null;

  const titleMap: Record<Screen, { title: string; subtitle: string }> = {
    home: { title: "Dapur Sejahtera #04", subtitle: "Profil Dapur MBG" },
    deposit: { title: "Serah Terima Limbah MBG", subtitle: "Info Detail Limbah" },
    status: {
      title: currentBatch ? `Status ${currentBatch.id}` : "Status Batch",
      subtitle: "Validasi Blockchain",
    },
    catalog: {
      title: "Katalog Subsidi Pangan",
      subtitle: "Penukaran Token",
    },
  };

  const overlay = scannerOpen ? (
    <ScannerOverlay
      isValidating={scannerStep === "validating"}
      onClose={() => {
        if (scannerStep === "validating") return;
        setScannerOpen(false);
      }}
      onConfirm={handleScannerDemo}
    />
  ) : pendingReward ? (
    <RedeemModal
      reward={pendingReward}
      tokenBalance={tokenBalance}
      onCancel={() => setPendingReward(null)}
      onConfirm={confirmRedeem}
    />
  ) : null;

  function renderScreenContent() {
    if (activeScreen === "home") {
      return (
        <div className="space-y-5">
          <motion.div
            layout
            className="rounded-3xl bg-gradient-to-br from-emerald-700 to-teal-600 p-5 text-white shadow-lg"
          >
            <div className="text-xs text-emerald-100">Dompet & Dampak Lingkungan</div>
            <div className="mt-3 flex items-center gap-2 text-sm text-emerald-50">
              <Gift className="h-4 w-4" /> Saldo Anda
            </div>
            <div className="mt-1 text-3xl font-bold">
              {formatToken(tokenBalance)} Token MBG
            </div>

            <div className="mt-4 grid grid-cols-2 gap-3">
              <div className="rounded-2xl bg-white/10 p-3">
                <div className="flex items-center gap-2 text-xs text-emerald-100">
                  <Scale className="h-3.5 w-3.5" /> Total Limbah Disetor
                </div>
                <div className="mt-1 text-lg font-semibold">
                  {formatKg(totalWasteKg)} Kg
                </div>
              </div>
              <div className="rounded-2xl bg-white/10 p-3">
                <div className="flex items-center gap-2 text-xs text-emerald-100">
                  <Leaf className="h-3.5 w-3.5" /> Emisi Tereduksi
                </div>
                <div className="mt-1 text-lg font-semibold">
                  {formatKg(emissionReducedKg)} Kg CO2e
                </div>
              </div>
            </div>
          </motion.div>

          <div>
            <SectionTitle>Tombol Aksi Cepat</SectionTitle>
            <div className="mt-3 grid grid-cols-2 gap-3">
              <button
                onClick={() => navigateTo("deposit")}
                className="rounded-2xl bg-slate-900 px-4 py-4 text-left text-white shadow-sm"
              >
                <div className="flex items-center gap-2">
                  <QrCode className="h-4 w-4" />
                  <span className="text-sm font-semibold">Pindai QR</span>
                </div>
                <div className="mt-1 text-xs text-slate-300">
                   Serah Terima Limbah
                </div>
              </button>
              <button
                onClick={() => navigateTo("catalog")}
                className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-4 text-left text-emerald-800 shadow-sm"
              >
                <div className="flex items-center gap-2">
                  <Gift className="h-4 w-4" />
                  <span className="text-sm font-semibold">Tukar MBGT</span>
                </div>
                <div className="mt-1 text-xs text-emerald-700">Penukaran Token</div>
              </button>
            </div>
          </div>

          <div>
            <SectionTitle>Aktivitas Terkini</SectionTitle>
            <div className="mt-3 space-y-3">
              {activities.slice(0, 3).map((activity) => (
                <motion.div
                  layout
                  key={activity.id}
                  className="rounded-2xl border border-slate-200 p-3"
                >
                  <div className="text-xs text-slate-500">{activity.time}</div>
                  <div className="mt-1 text-sm font-medium text-slate-800">
                    {activity.message}
                  </div>
                </motion.div>
              ))}

              <button
                onClick={() => navigateTo("status")}
                className="w-full rounded-2xl bg-slate-50 px-3 py-3 text-left text-sm font-medium text-emerald-700"
              >
                Lihat Riwayat Transaksi Blockchain ➜
              </button>
            </div>
          </div>
        </div>
      );
    }

    if (activeScreen === "deposit") {
      return (
        <div className="space-y-5">
          <div>
            <SectionTitle>Pindai Kode QR</SectionTitle>
            <div className="mt-3 rounded-3xl border-2 border-dashed border-emerald-300 bg-emerald-50 p-5 text-center">
              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-white text-emerald-700 shadow-sm">
                <ScanLine className="h-7 w-7" />
              </div>
              <div className="mt-3 text-sm font-semibold text-slate-800">
                Area Kamera
              </div>
              <div className="mt-1 text-xs leading-5 text-slate-500">
                Pastikan Kode QR terlihat jelas.
              </div>
              <button
                onClick={() => setScannerOpen(true)}
                className="mt-4 rounded-2xl bg-slate-900 px-4 py-3 text-sm font-semibold text-white"
              >
                Pindai - Scan
              </button>
            </div>
          </div>

          <div>
            <SectionTitle>Verifikasi Setor Limbah</SectionTitle>
            <div className="mt-3 space-y-3 rounded-3xl border border-slate-200 p-4">
              <div>
                <label className="text-xs font-medium text-slate-500">
                  ID Batch
                </label>
                <div className="mt-1 rounded-2xl bg-slate-50 px-4 py-3 font-mono text-sm font-semibold text-slate-800">
                  {nextBatchId}
                </div>
              </div>

              <div>
                <label className="text-xs font-medium text-slate-500">
                  Lokasi
                </label>
                <input
                  value={locationInput}
                  onChange={(event) => setLocationInput(event.target.value)}
                  className="mt-1 w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none ring-0 focus:border-emerald-400"
                  placeholder="Contoh: Dapur #04, Jakarta Barat"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-medium text-slate-500">
                    Berat Limbah (kg)
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    min="0"
                    value={weightInput}
                    onChange={(event) => setWeightInput(event.target.value)}
                    className="mt-1 w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-emerald-400"
                  />
                </div>
                <div>
                  <label className="text-xs font-medium text-slate-500">
                    Kualitas
                  </label>
                  <select
                    value={gradeInput}
                    onChange={(event) =>
                      setGradeInput(event.target.value as GradeKey)
                    }
                    className="mt-1 w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-emerald-400"
                  >
                    {(Object.keys(GRADE_OPTIONS) as GradeKey[]).map((grade) => (
                      <option key={grade} value={grade}>
                        Grade {grade} — {GRADE_OPTIONS[grade].label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="rounded-2xl bg-slate-50 p-3">
                  <div className="text-xs text-slate-500">Faktor Grade</div>
                  <div className="mt-1 text-sm font-semibold text-slate-800">
                    {selectedGrade.badge} {selectedGrade.factor}
                  </div>
                </div>
                <div className="rounded-2xl bg-emerald-50 p-3">
                  <div className="text-xs text-emerald-700">
                    Estimasi Token
                  </div>
                  <div className="mt-1 text-sm font-semibold text-emerald-800">
                    {formatToken(estimatedTokens)} MBG
                  </div>
                </div>
              </div>

              <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-3 text-xs leading-5 text-emerald-800">
                Estimasi dampak: {formatKg(estimatedEmissions)} Kg CO2e
                tereduksi dari batch ini.
              </div>
            </div>
          </div>

          <button
            onClick={handleSubmitBatch}
            className="w-full rounded-2xl bg-slate-900 px-4 py-4 text-sm font-semibold text-white shadow-sm"
          >
            🚀 Eksekusi ke Smart Contract
          </button>
        </div>
      );
    }

    if (activeScreen === "status") {
      const progress = currentBatch ? (currentBatch.minted ? 100 : 76) : 10;

      return (
        <div className="space-y-5">
          <div>
            <SectionTitle>Status Proses Smart Contract</SectionTitle>
            <div className="mt-3 overflow-hidden rounded-full bg-slate-100">
              <motion.div
                initial={false}
                animate={{ width: `${progress}%` }}
                transition={{ type: "spring", stiffness: 180, damping: 24 }}
                className="h-2 rounded-full bg-gradient-to-r from-emerald-500 to-amber-400"
              />
            </div>
            <div className="mt-2 text-xs text-slate-500">
              {currentBatch
                ? currentBatch.minted
                  ? "4 dari 4 langkah selesai"
                  : "3 dari 4 langkah selesai"
                : "Belum ada batch aktif"}
            </div>
          </div>

          <div className="space-y-3">
            <StatusRow
              tone={currentBatch ? "done" : "wait"}
              icon={
                currentBatch ? (
                  <CheckCircle2 className="h-4 w-4" />
                ) : (
                  <Circle className="h-4 w-4" />
                )
              }
              title="1. Pencatatan Awal"
              detail={
                currentBatch
                  ? `Data berat (${formatKg(currentBatch.weightKg)}kg) & lokasi ${currentBatch.location} cocok.`
                  : "Menunggu pengiriman data batch."
              }
            />
            <StatusRow
              tone={currentBatch ? "done" : "wait"}
              icon={
                currentBatch ? (
                  <CheckCircle2 className="h-4 w-4" />
                ) : (
                  <Circle className="h-4 w-4" />
                )
              }
              title="2. Verifikasi Serah Terima"
              detail={
                currentBatch
                  ? `Grade ${currentBatch.gradeLabel} diverifikasi oleh petugas pengolah.`
                  : "Belum ada verifikasi."
              }
            />
            <StatusRow
              tone={
                currentBatch
                  ? currentBatch.minted
                    ? "done"
                    : "progress"
                  : "wait"
              }
              icon={
                currentBatch ? (
                  currentBatch.minted ? (
                    <CheckCircle2 className="h-4 w-4" />
                  ) : (
                    <LoaderCircle className="h-4 w-4 animate-spin" />
                  )
                ) : (
                  <Circle className="h-4 w-4" />
                )
              }
              title="3. Kalkulasi Bobot Token"
              detail={
                currentBatch
                  ? `(${formatKg(currentBatch.weightKg)}kg × faktor ${currentBatch.gradeFactor}) = ${formatToken(currentBatch.pendingTokens)} MBG Token.`
                  : "Belum ada kalkulasi."
              }
            />
            <StatusRow
              tone={
                currentBatch
                  ? currentBatch.minted
                    ? "done"
                    : "wait"
                  : "wait"
              }
              icon={
                currentBatch ? (
                  currentBatch.minted ? (
                    <CheckCircle2 className="h-4 w-4" />
                  ) : (
                    <Circle className="h-4 w-4" />
                  )
                ) : (
                  <Circle className="h-4 w-4" />
                )
              }
              title="4. Penerbitan Token"
              detail={
                currentBatch
                  ? currentBatch.minted
                    ? "Token berhasil ditransfer ke saldo dapur."
                    : "Menunggu konfirmasi jaringan..."
                  : "Belum ada permintaan."
              }
            />
          </div>

          <div className="rounded-3xl bg-slate-900 p-4 text-white">
            <div className="text-xs text-slate-400">Bukti Transaksi</div>
            <div className="mt-2 text-sm font-semibold">
              View on MBG Explorer
            </div>
            <div className="mt-2 rounded-2xl bg-white/10 px-3 py-3 font-mono text-xs text-slate-200">
              {currentBatch
                ? `mbg://explorer/tx/${currentBatch.id.toLowerCase()}`
                : "mbg://explorer/tx/pending"}
            </div>
          </div>

          {currentBatch && !currentBatch.minted && (
            <button
              onClick={handleCompleteMint}
              className="w-full rounded-2xl bg-emerald-600 px-4 py-4 text-sm font-semibold text-white"
            >
              Setuju (+
              {formatToken(currentBatch.pendingTokens)} MBG)
            </button>
          )}

          {currentBatch?.minted && (
            <button
              onClick={() => navigateTo("home")}
              className="w-full rounded-2xl bg-slate-900 px-4 py-4 text-sm font-semibold text-white"
            >
              Kembali ke Beranda
            </button>
          )}
        </div>
      );
    }

    return (
      <div className="space-y-5">
        <div className="rounded-3xl bg-emerald-50 p-4 text-emerald-900">
          <div className="text-xs font-medium text-emerald-700">
            Saldo Tersedia
          </div>
          <div className="mt-1 text-2xl font-bold">
            {formatToken(tokenBalance)} MBG Token
          </div>
        </div>

        {voucherMessage && (
          <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-800">
            {voucherMessage}
          </div>
        )}

        <div>
          <SectionTitle>Daftar Bahan Pangan</SectionTitle>
          <div className="mt-3 space-y-3">
            {REWARDS.map((reward) => (
              <RewardCard
                key={reward.id}
                reward={reward}
                onRedeem={requestRedeem}
                canRedeem={tokenBalance >= reward.price}
              />
            ))}
          </div>
        </div>

        <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
          💡 Penukaran memakai konfirmasi sebelum voucher QR
          diterbitkan.
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 p-6 md:p-10">
      <div className="mx-auto max-w-6xl">
        <div className="mb-8 grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
          <div>
            <div className="inline-flex rounded-full bg-emerald-100 px-3 py-1 text-xs font-semibold text-emerald-700">
              MBG Token Apps • Mock-Up
            </div>
            <h1 className="mt-3 text-3xl font-bold tracking-tight text-slate-900">
              Mock-up ini menunjukkan UI selama penggunaan aplikasi Token MBG
            </h1>
            <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-600">
              Mock-up ini menampilkan interaksi di tiap layar, termasuk scanner,
              jumlah input limbah yang mempengaruhi hasil token, dan modal
              konfirmasi saat penukaran.
            </p>
            {toast && (
              <div
                className={`mt-4 rounded-2xl border p-4 text-sm ${toastStyles[toast.tone]}`}
              >
                {toast.message}
              </div>
            )}
          </div>

          <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="text-sm font-semibold text-slate-800">
            Langkah Uji Coba Fitur MBG Token Apps
            </div>
            <div className="mt-4 space-y-3 text-sm leading-6 text-slate-600">
              <div className="rounded-2xl bg-slate-50 p-4">
                <div className="font-semibold text-slate-800">
                  1. Serah Terima dengan Kode QR
                </div>
                <div>
                  Buka layar Setor, tekan{" "}
                  <span className="font-medium">Pindai - Scan</span>,
                  untuk membuka Kamera lalu simulasikan QR terbaca.
                </div>
              </div>
              <div className="rounded-2xl bg-slate-50 p-4">
                <div className="font-semibold text-slate-800">
                  2. Verifikasi Data
                </div>
                <div>
                Sesuaikan lokasi, berat limbah, dan grade/kualitas,
                lalu perkiraan token akan berubah otomatis.
                </div>
              </div>
              <div className="rounded-2xl bg-slate-50 p-4">
                <div className="font-semibold text-slate-800">3. Penerbitan Token</div>
                <div>
                  Kirim batch ke algoritma Smart Contract dengan tekan{" "}
                  <span className="font-medium">
                    Eksekusi Smart Contract</span> lalu tekan <span className="font-medium">Setuju</span> bila kalkulasi selesai menghitung.
                  
                  
                </div>
              </div>
              <div className="rounded-2xl bg-slate-50 p-4">
                <div className="font-semibold text-slate-800">
                  4. Penukaran Token
                </div>
                <div>
                  Di layar Katalog, pilih barang yang ingin ditukar,lalu setujui pada kotak konfirmasi 
                  sebelum voucher dibuat.
                </div>
              </div>
            </div>

            <button
              onClick={resetDemo}
              className="mt-4 w-full rounded-2xl bg-slate-900 px-4 py-3 text-sm font-semibold text-white"
            >
              Reset Mock-Up
            </button>
          </div>
        </div>

        <div className="grid items-start gap-8 lg:grid-cols-[390px_1fr]">
          <PhoneFrame
            title={titleMap[activeScreen].title}
            subtitle={titleMap[activeScreen].subtitle}
            leftIcon={leftIcon}
            rightIcon={rightIcon}
            overlay={overlay}
            footer={
              <BottomNav activeScreen={activeScreen} onNavigate={navigateTo} />
            }
          >
            <AnimatePresence mode="wait" custom={direction}>
              <motion.div
                key={activeScreen}
                custom={direction}
                variants={screenTransition}
                initial="enter"
                animate="center"
                exit="exit"
                transition={{
                  type: "spring",
                  stiffness: 280,
                  damping: 28,
                  mass: 0.9,
                }}
              >
                {renderScreenContent()}
              </motion.div>
            </AnimatePresence>
          </PhoneFrame>

          <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="text-lg font-semibold text-slate-900">
              Ringkasan Simulasi
            </div>
            <div className="mt-4 grid grid-cols-2 gap-3">
              <div className="rounded-2xl bg-slate-50 p-3">
                <div className="text-xs text-slate-500">Layar aktif</div>
                <div className="mt-1 text-sm font-semibold capitalize text-slate-800">
                  {activeScreen}
                </div>
              </div>
              <div className="rounded-2xl bg-slate-50 p-3">
                <div className="text-xs text-slate-500">Saldo token</div>
                <div className="mt-1 text-sm font-semibold text-slate-800">
                  {formatToken(tokenBalance)} MBG
                </div>
              </div>
              <div className="rounded-2xl bg-slate-50 p-3">
                <div className="text-xs text-slate-500">Nomer Batch</div>
                <div className="mt-1 text-sm font-semibold text-slate-800">
                  {nextBatchId}
                </div>
              </div>
              <div className="rounded-2xl bg-slate-50 p-3">
                <div className="text-xs text-slate-500">
                  Kalkulasi token
                </div>
                <div className="mt-1 text-sm font-semibold text-emerald-800">
                  {formatToken(estimatedTokens)} MBG
                </div>
              </div>
            </div>

            <div className="mt-5 rounded-3xl border border-slate-200 p-4">
              <div className="text-sm font-semibold text-slate-800">
                Data Batch Limbah yang Tercatat Saat Ini
              </div>
              <div className="mt-3 grid grid-cols-3 gap-3 text-xs">
                <div className="rounded-2xl bg-slate-50 p-3">
                  <div className="text-slate-500">Berat</div>
                  <div className="mt-1 font-semibold text-slate-800">
                    {formatKg(weightValue)} kg
                  </div>
                </div>
                <div className="rounded-2xl bg-slate-50 p-3">
                  <div className="text-slate-500">Grade</div>
                  <div className="mt-1 font-semibold text-slate-800">
                    {gradeInput}
                  </div>
                </div>
                <div className="rounded-2xl bg-emerald-50 p-3">
                  <div className="text-emerald-700">Emisi</div>
                  <div className="mt-1 font-semibold text-emerald-800">
                    {formatKg(estimatedEmissions)} kg
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-5 space-y-3">
              <div className="text-sm font-semibold text-slate-800">
                Catatan
              </div>
              <div className="rounded-2xl bg-slate-50 p-4 text-sm leading-6 text-slate-600">
                Mock-up aplikasi MBG Token ini hanya sebagai referensi konsep visual tim WISE.
                Detail tampilan dapat berubah menyesuaikan integrasi smart contract dan API perangkat.
                Tata letak dan elemen visual akan terus dioptimalkan berdasarkan hasil pengujian pengguna.
                Produk final yang dirilis mungkin memiliki perbedaan signifikan dari desain wireframe ini.
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
