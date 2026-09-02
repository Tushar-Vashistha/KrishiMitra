import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useAuth } from "../../hooks/useAuth";
import { centreService, queueService, procurementService } from "../../services/api";
import { mockBookings, mockSlots, mockMandiRates } from "../../data/mockData";
import { pushFarmerNotification } from "../../data/notifications";
import {
  Building2,
  CalendarCheck2,
  Activity,
  CheckCircle2,
  Clock,
  Layers,
  MapPin,
  ShieldCheck,
  CreditCard,
  Zap,
  ArrowRight,
  Users,
  FileText,
  Upload,
  Sparkles,
  ChevronRight,
  AlertCircle,
  Search,
  Filter,
  Check,
  Phone,
  X,
  Plus,
  Scale,
  FlaskConical,
  Download,
  Printer,
  Calendar,
  AlertTriangle,
  RotateCcw,
  CheckCircle,
  UserCheck,
  XCircle,
  ArrowUpRight,
  Info,
  Sliders,
  DollarSign,
  UserX,
  Truck,
  Eye,
  CheckSquare,
  RefreshCw,
  BadgeCheck,
  PhoneCall,
  CheckCheck,
  ChevronDown
} from "lucide-react";

const CROP_MSP = {
  "Wheat": 2275,
  "Paddy": 2183,
  "Mustard": 5650,
  "Maize": 2090,
  "Sugarcane": 315,
  "Soybean": 4600,
  "Chana": 5440,
  "Groundnut": 6377
};

const CentreDashboard = () => {
  const { t, i18n } = useTranslation();
  const { user } = useAuth();
  const navigate = useNavigate();
  const isHindi = i18n.language === "hi";

  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);

  // Tomorrow Centre Operation Schedule state
  const [tomorrowSchedule, setTomorrowSchedule] = useState(() => {
    const saved = localStorage.getItem("krishimitra_tomorrow_schedule");
    return saved ? JSON.parse(saved) : {
      isOpen: true,
      openTime: "07:00 AM",
      closeTime: "08:00 PM",
      slotCapacity: 25,
      announcement: isHindi ? "कल केंद्र सामान्य रूप से खुला रहेगा। 5 से 8 स्लॉट तत्काल कोटा है।" : "Centre will operate normally tomorrow across all 4 slots. 5 to 8 PM is Tatkaal quota."
    };
  });

  // Selected slot filter: "all" | "7-10" | "10-1" | "2-5" | "5-8"
  const [selectedSlot, setSelectedSlot] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all"); // "all" | "Booked" | "Arrived" | "Processing" | "Procured" | "Cancelled"
  const [searchQuery, setSearchQuery] = useState("");

  // Modals state
  const [showFarmerDetailModal, setShowFarmerDetailModal] = useState(false);
  const [showTomorrowModal, setShowTomorrowModal] = useState(false);
  const [showBillModal, setShowBillModal] = useState(false);
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [showViewReceiptModal, setShowViewReceiptModal] = useState(false);

  // Active item for modal actions
  const [activeBooking, setActiveBooking] = useState(null);
  const [toastMessage, setToastMessage] = useState(null);

  // Form for Bill Generation
  const [billForm, setBillForm] = useState({
    crop: "Wheat",
    qualityGrade: "FAQ Grade-I",
    moisture: 11.4,
    grossWeight: 85.0,
    tareWeight: 60.0,
    netWeight: 25.0,
    mspRate: 2275,
    deductions: 0,
    totalAmount: 56875,
    paymentStatus: "Processing", // "Due" | "Processing" | "Paid"
    bankName: "State Bank of India",
    accountNo: "XXXX-XXXX-5678",
    ifsc: "SBIN0001234",
    weighmentSlipNo: `WS-2026-${Math.floor(1000 + Math.random() * 9000)}`,
  });

  // Form for Cancel Slot
  const [cancelReason, setCancelReason] = useState("Farmer did not arrive within designated slot window");
  const [releaseToTatkaal, setReleaseToTatkaal] = useState(true);

  // Temporary form state for tomorrow schedule edit
  const [tempSchedule, setTempSchedule] = useState(tomorrowSchedule);

  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3800);
  };

  const fetchDashboardData = async () => {
    if (!user || !user.centreId) return;
    try {
      const res = await centreService.getDashboard(user.centreId);
      if (res.success && res.data) {
        const backendBookings = res.data.todayBookings.map(b => {
          let statusText = "Booked";
          if (b.status === "ARRIVED") statusText = "Arrived";
          else if (b.status === "PROCESSING") statusText = "Processing";
          else if (b.status === "COMPLETED") statusText = "Procured";
          else if (b.status === "CANCELLED" || b.status === "NO_SHOW") statusText = "Cancelled";
          
          return {
            id: b.id,
            token: b.queueToken?.tokenNumber || b.token || '00',
            queueTokenId: b.queueToken?.id,
            farmer: b.farmerName,
            mobile: b.farmerMobile,
            crop: b.cropName,
            cropHi: b.cropNameHi || b.cropName,
            weight: b.weight,
            status: statusText,
            slotTime: b.slotTime,
            isTatkaal: b.isTatkaal || false,
            aadhaar: b.farmerAadhaar || "XXXX-XXXX-XXXX",
            slotCode: b.slotTime.includes("07:") ? "7-10" : b.slotTime.includes("10:") ? "10-1" : b.slotTime.includes("14:") || b.slotTime.includes("02:") ? "2-5" : "5-8"
          };
        });
        setBookings(backendBookings);
      }
    } catch (err) {
      console.error("Failed to fetch dashboard data:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user && user.centreId) {
      fetchDashboardData();
    } else {
      setLoading(false);
    }
  }, [user]);

  // EXACTLY 4 SLOTS: Slot 4 (5:00 PM - 8:00 PM) IS the Tatkaal Slot
  const SLOTS_CONFIG = [
    {
      id: "7-10",
      code: "7-10",
      label: isHindi ? "स्लॉट 1: सुबह 7:00 - 10:00" : "Slot 1 (07:00 - 10:00 AM)",
      time: "07:00 AM - 10:00 AM",
      icon: "🌅",
      maxCapacity: 20,
      isTatkaal: false,
    },
    {
      id: "10-1",
      code: "10-1",
      label: isHindi ? "स्लॉट 2: सुबह 10:00 - दोपहर 1:00" : "Slot 2 (10:00 AM - 01:00 PM)",
      time: "10:00 AM - 01:00 PM",
      icon: "☀️",
      maxCapacity: 25,
      isTatkaal: false,
    },
    {
      id: "2-5",
      code: "2-5",
      label: isHindi ? "स्लॉट 3: दोपहर 2:00 - शाम 5:00" : "Slot 3 (02:00 - 05:00 PM)",
      time: "02:00 PM - 05:00 PM",
      icon: "⛅",
      maxCapacity: 20,
      isTatkaal: false,
    },
    {
      id: "5-8",
      code: "5-8",
      label: isHindi ? "स्लॉट 4: शाम 5:00 - 8:00 (⚡ तत्काल)" : "Slot 4 (05:00 - 08:00 PM ⚡ Tatkaal)",
      time: isHindi ? "05:00 PM - 08:00 PM (⚡ तत्काल कोटा)" : "05:00 PM - 08:00 PM (⚡ Tatkaal)",
      icon: "⚡",
      maxCapacity: 15,
      isTatkaal: true,
    }
  ];

  // Compute counts per slot
  const slotStats = SLOTS_CONFIG.map(slot => {
    const slotBookings = bookings.filter(b => b.slotCode === slot.code);
    const arrived = slotBookings.filter(b => b.status === "Arrived" || b.status === "Processing" || b.status === "Procured").length;
    const procured = slotBookings.filter(b => b.status === "Procured").length;
    const cancelled = slotBookings.filter(b => b.status === "Cancelled").length;
    const activeTotal = slotBookings.filter(b => b.status !== "Cancelled").length;

    return {
      ...slot,
      totalBooked: slotBookings.length,
      activeTotal,
      arrived,
      procured,
      cancelled,
      pending: Math.max(0, activeTotal - arrived)
    };
  });

  // Action: Open Detailed Farmer & Crop Modal
  const handleOpenFarmerDetails = (booking) => {
    setActiveBooking(booking);
    setShowFarmerDetailModal(true);
  };

  // Action: Mark Farmer Absent / Cancel
  const handleMarkAbsent = (bookingId, reason = "Farmer absent / No-show") => {
    const booking = bookings.find(b => b.id === bookingId);
    if (booking) {
      setBookings(prev => prev.map(b => b.id === bookingId ? { ...b, status: 'Cancelled', paymentStatus: 'Cancelled' } : b));
      showToast(isHindi ? `टोकन #${booking.token} को अनुपस्थित (Absent) चिह्नित किया गया!` : `Farmer token #${booking.token} marked as Absent!`);
      if (booking.queueTokenId) {
        queueService.noShow(booking.queueTokenId).catch(console.error);
      }
    }
  };

  // Action: Mark Farmer Arrived
  const handleMarkArrived = (bookingId) => {
    const booking = bookings.find(b => b.id === bookingId);
    if (booking) {
      setBookings(prev => prev.map(b => b.id === bookingId ? { ...b, status: 'Arrived' } : b));
      showToast(isHindi ? `टोकन #${booking.token} की उपस्थिति (Arrived) दर्ज कर ली गई है!` : `Farmer token #${booking.token} marked as Arrived!`);
      if (booking.queueTokenId) {
        queueService.arrive(booking.queueTokenId).catch(console.error);
      }
    }
  };

  // Action: Mark Farmer Processing (Weighbridge / Quality Lab)
  const handleMarkProcessing = (bookingId) => {
    const booking = bookings.find(b => b.id === bookingId);
    if (booking) {
      setBookings(prev => prev.map(b => b.id === bookingId ? { ...b, status: 'Processing' } : b));
      showToast(isHindi ? `टोकन #${booking.token} तौल व गुणवत्ता जांच (Processing) में भेजा गया!` : `Farmer token #${booking.token} marked as Processing!`);
      if (booking.queueTokenId) {
        queueService.start(booking.queueTokenId, 1).catch(console.error);
      }
    }
  };

  // Action: Mark Procurement Completed
  const handleMarkProcured = (bookingId) => {
    const booking = bookings.find(b => b.id === bookingId);
    if (booking) {
      handleOpenBillModal(booking);
    }
  };

  // Action: Open Bill Generator Modal
  const handleOpenBillModal = (booking) => {
    setActiveBooking(booking);
    const cropRate = CROP_MSP[booking.crop] || 2275;
    const weight = Number(booking.weight) || 25.0;
    const gross = weight + 60.0;
    const net = weight;
    const total = net * cropRate;

    setBillForm({
      crop: booking.crop || "Wheat",
      qualityGrade: booking.qualityGrade || "FAQ Grade-I",
      moisture: booking.moisture || 11.4,
      grossWeight: gross,
      tareWeight: 60.0,
      netWeight: net,
      mspRate: cropRate,
      deductions: 0,
      totalAmount: total,
      paymentStatus: booking.paymentStatus || "Processing",
      bankName: booking.bankName || "State Bank of India",
      accountNo: booking.accountNo || "XXXX-XXXX-5678",
      ifsc: booking.ifsc || "SBIN0001234",
      weighmentSlipNo: `WS-2026-${Math.floor(1000 + Math.random() * 9000)}`,
    });
    setShowBillModal(true);
  };

  // Action: Submit Generated Bill
  const handleSubmitBill = async (e) => {
    if (e) e.preventDefault();
    if (!activeBooking) return;
    try {
      // Step 1: Create/Get procurement transaction
      const pRes = await procurementService.create({ bookingId: activeBooking.id });
      if (!pRes.success || !pRes.data) {
        throw new Error('Failed to initialize procurement transaction');
      }
      const txId = pRes.data.id;

      // Step 2: Register weighing
      const weighRes = await procurementService.registerWeighing(txId, {
        grossWeight: parseFloat(billForm.grossWeight),
        tareWeight: parseFloat(billForm.tareWeight),
      });
      if (!weighRes.success) {
        throw new Error('Failed to register weighing record');
      }

      // Step 3: Register quality inspection
      const qualRes = await procurementService.registerQuality(txId, {
        moisture: parseFloat(billForm.moisture),
        foreignMatter: parseFloat(billForm.deductions || 0),
        grade: billForm.qualityGrade,
        result: 'PASSED',
      });
      if (!qualRes.success) {
        throw new Error('Failed to register quality check');
      }

      showToast(isHindi ? `विधेयक और जे-फॉर्म सफलतापूर्वक उत्पन्न!` : `J-Form generated successfully!`);
      setShowBillModal(false);
      fetchDashboardData();
    } catch (err) {
      console.error(err);
      alert(err.message || 'Failed to process J-Form and bill.');
    }
  };

  // Action: Open Cancel Slot Modal
  const handleOpenCancelModal = (booking) => {
    setActiveBooking(booking);
    setCancelReason("Farmer did not arrive within designated slot window");
    setReleaseToTatkaal(true);
    setShowCancelModal(true);
  };

  // Action: Confirm Cancel Slot
  const handleConfirmCancel = () => {
    if (!activeBooking) return;
    setBookings(prev => prev.map(b => {
      if (b.id === activeBooking.id) {
        const updated = {
          ...b,
          status: "Cancelled",
          cancelReason: cancelReason
        };
        if (activeBooking && activeBooking.id === b.id) {
          setActiveBooking(updated);
        }
        return updated;
      }
      return b;
    }));

    pushFarmerNotification({
      title: isHindi ? `⚠️ स्लॉट #${activeBooking.token || activeBooking.id} रद्द किया गया` : `⚠️ Slot #${activeBooking.token || activeBooking.id} Cancelled`,
      titleEn: `⚠️ Slot #${activeBooking.token || activeBooking.id} Cancelled`,
      message: isHindi ? `स्लॉट रद्द करने का कारण: "${cancelReason}"। आप 5-8 बजे तत्काल कोटा में आवेदन कर सकते हैं।` : `Cancellation recorded: "${cancelReason}". You may book via 5-8 PM Tatkaal quota.`,
      messageEn: `Cancellation recorded: "${cancelReason}". You may book via 5-8 PM Tatkaal quota.`,
      centreName: user?.name || "Govt. Procurement Centre",
      tokenId: activeBooking.token,
      type: "cancelled",
      status: "Cancelled",
      link: "/farmer/tatkaal"
    });

    if (releaseToTatkaal) {
      // release to Tatkaal pool in localStorage
      const tatkaalItem = {
        id: `TAT-${Math.floor(100 + Math.random() * 900)}`,
        originCancelledSlot: `${activeBooking.slot} (${activeBooking.farmer} - ${activeBooking.crop})`,
        timeSlot: "05:00 PM - 08:00 PM (⚡ Tatkaal)",
        status: "Available",
        assignedTo: null,
        mobile: null,
        crop: activeBooking.crop,
        weight: activeBooking.weight,
        allocatedAt: null,
        allocatedBy: null
      };
      const existingTatkaal = JSON.parse(localStorage.getItem("krishimitra_tatkaal_pool") || "[]");
      localStorage.setItem("krishimitra_tatkaal_pool", JSON.stringify([tatkaalItem, ...existingTatkaal]));
    }

    setShowCancelModal(false);
    showToast(isHindi ? `स्लॉट #${activeBooking.id} रद्द कर दिया गया ${releaseToTatkaal ? "और 5-8 तत्काल में जारी किया गया।" : ""}` : `Slot #${activeBooking.id} cancelled.`);
  };

  // Action: Save Tomorrow Schedule
  const handleSaveTomorrowSchedule = (e) => {
    if (e) e.preventDefault();
    setTomorrowSchedule(tempSchedule);
    localStorage.setItem("krishimitra_tomorrow_schedule", JSON.stringify(tempSchedule));
    setShowTomorrowModal(false);
    showToast(isHindi ? "कल के संचालन का शेड्यूल सफलतापूर्वक अपडेट हो गया!" : "Tomorrow operating schedule saved successfully!");
  };

  // Filter queue
  const filteredQueue = bookings.filter(item => {
    const matchesSlot = selectedSlot === "all" ? true : item.slotCode === selectedSlot;
    const matchesStatus = statusFilter === "all" ? true : item.status === statusFilter;
    const matchesSearch = item.farmer.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          item.crop.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          item.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          item.mobile.includes(searchQuery) ||
                          (item.vehicleNo && item.vehicleNo.toLowerCase().includes(searchQuery.toLowerCase()));
    return matchesSlot && matchesStatus && matchesSearch;
  });

  const totalBookingsCount = bookings.length;
  const totalArrivedCount = bookings.filter(b => b.status === "Arrived").length;
  const totalProcessingCount = bookings.filter(b => b.status === "Processing").length;
  const totalProcuredCount = bookings.filter(b => b.status === "Procured").length;
  const totalCancelledCount = bookings.filter(b => b.status === "Cancelled").length;

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: '#F8FAFC' }}>
        <div style={{ textAlign: 'center' }}>
          <RefreshCw className="animate-spin" size={44} color="#059669" style={{ margin: '0 auto 1rem' }} />
          <div style={{ fontWeight: 700, color: '#475569' }}>{isHindi ? 'लोड हो रहा है...' : 'Loading Centre Dashboard...'}</div>
        </div>
      </div>
    );
  }

  return (
    <div style={{ minHeight: "100vh", background: "linear-gradient(180deg, #F0FDF4 0%, #F8FAFC 100%)", paddingBottom: "5rem" }}>

      {/* Floating Toast Notification */}
      {toastMessage && (
        <div style={{
          position: "fixed",
          top: "24px",
          left: "50%",
          transform: "translateX(-50%)",
          background: "#064E3B",
          color: "#FFFFFF",
          padding: "0.85rem 1.75rem",
          borderRadius: "14px",
          boxShadow: "0 20px 35px -10px rgba(6, 78, 59, 0.4)",
          zIndex: 9999,
          display: "flex",
          alignItems: "center",
          gap: "0.75rem",
          fontWeight: 700,
          fontSize: "0.95rem",
          animation: "fadeIn 0.25s ease-out"
        }}>
          <Sparkles size={18} color="#FBBF24" />
          {toastMessage}
        </div>
      )}

      {/* TOP PROCUREMENT CENTRE BANNER */}
      <div style={{
        background: "linear-gradient(135deg, #064E3B 0%, #047857 55%, #0284C7 100%)",
        color: "#FFFFFF",
        padding: "2.5rem 1rem 2rem",
        boxShadow: "0 10px 30px -10px rgba(6, 78, 59, 0.35)",
        position: "relative",
        overflow: "hidden"
      }}>
        <div className="container" style={{ maxWidth: "1200px", margin: "0 auto" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "1.25rem" }}>
            
            {/* Centre Branding & Info */}
            <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
              <div style={{
                width: 58,
                height: 58,
                borderRadius: "18px",
                background: "#FFFFFF",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                boxShadow: "0 6px 16px rgba(0,0,0,0.18)",
                flexShrink: 0
              }}>
                <Building2 size={32} color="#047857" />
              </div>
              <div>
                <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", flexWrap: "wrap" }}>
                  <span style={{
                    background: "rgba(255, 255, 255, 0.2)",
                    color: "#FEF3C7",
                    padding: "2px 10px",
                    borderRadius: "12px",
                    fontSize: "0.72rem",
                    fontWeight: 800,
                    textTransform: "uppercase",
                    letterSpacing: "0.04em"
                  }}>
                    🏛️ {user?.centreType || "Government"} Procurement Centre
                  </span>
                  <span style={{
                    background: "rgba(0, 0, 0, 0.25)",
                    color: "#A7F3D0",
                    padding: "2px 8px",
                    borderRadius: "8px",
                    fontSize: "0.72rem",
                    fontWeight: 700
                  }}>
                    ID: {user?.centreId || "UP-LKO-001"}
                  </span>
                </div>
                <h1 style={{ fontSize: "1.75rem", fontWeight: 900, margin: "0.35rem 0 0.15rem", letterSpacing: "-0.02em", lineHeight: 1.2 }}>
                  {user?.name || (isHindi ? "सरकारी कृषि खरीद केंद्र" : "Govt. Procurement Centre")}
                </h1>
                <div style={{ fontSize: "0.85rem", opacity: 0.9, display: "flex", alignItems: "center", gap: "1rem", flexWrap: "wrap" }}>
                  <span>📍 {user?.district || "Lucknow"}, {user?.state || "Uttar Pradesh"}</span>
                  <span>👤 {user?.manager || "Anil Verma"} ({user?.designation || "Centre Manager"})</span>
                  <span>📞 +91 {user?.mobile || "9876500001"}</span>
                </div>
              </div>
            </div>

            {/* Quick Action Button: Tomorrow Opening/Closing Details */}
            <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", flexWrap: "wrap" }}>
              <button
                onClick={() => {
                  setTempSchedule(tomorrowSchedule);
                  setShowTomorrowModal(true);
                }}
                style={{
                  background: tomorrowSchedule.isOpen
                    ? "linear-gradient(135deg, #10B981 0%, #059669 100%)"
                    : "linear-gradient(135deg, #EF4444 0%, #DC2626 100%)",
                  border: "2px solid rgba(255, 255, 255, 0.4)",
                  color: "#FFFFFF",
                  padding: "0.75rem 1.25rem",
                  borderRadius: "14px",
                  fontWeight: 800,
                  fontSize: "0.9rem",
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  gap: "0.5rem",
                  boxShadow: "0 8px 20px rgba(0,0,0,0.25)",
                  transition: "transform 0.15s"
                }}
              >
                <Calendar size={18} />
                <span>
                  {isHindi ? "⚡ कल का संचालन शेड्यूल (Open/Close)" : "⚡ Tomorrow Centre Schedule"}
                </span>
                <span style={{
                  background: "rgba(0, 0, 0, 0.25)",
                  padding: "2px 8px",
                  borderRadius: "8px",
                  fontSize: "0.75rem",
                  fontWeight: 900
                }}>
                  {tomorrowSchedule.isOpen ? (isHindi ? "🟢 खुला रहेगा" : "🟢 Open") : (isHindi ? "🔴 बंद रहेगा" : "🔴 Closed")}
                </span>
              </button>

              <Link
                to="/centre/tatkaal"
                style={{
                  background: "rgba(255, 255, 255, 0.15)",
                  backdropFilter: "blur(8px)",
                  border: "1px solid rgba(255, 255, 255, 0.3)",
                  color: "#FFFFFF",
                  padding: "0.75rem 1.1rem",
                  borderRadius: "14px",
                  fontWeight: 700,
                  fontSize: "0.88rem",
                  textDecoration: "none",
                  display: "flex",
                  alignItems: "center",
                  gap: "0.4rem"
                }}
              >
                <Zap size={16} color="#FBBF24" />
                {isHindi ? "तत्काल प्रबंधन" : "Tatkaal Desk"}
              </Link>
            </div>

          </div>

          {/* Tomorrow Live Active Announcement Strip */}
          <div style={{
            background: "rgba(0, 0, 0, 0.2)",
            borderRadius: "12px",
            padding: "0.6rem 1rem",
            marginTop: "1.25rem",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            flexWrap: "wrap",
            gap: "0.5rem",
            border: "1px solid rgba(255, 255, 255, 0.15)",
            fontSize: "0.82rem"
          }}>
            <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
              <span style={{ fontWeight: 800, color: "#FEF3C7" }}>📢 {isHindi ? "कल के लिए सूचना:" : "Tomorrow Notice:"}</span>
              <span style={{ opacity: 0.95 }}>
                {tomorrowSchedule.isOpen
                  ? `${isHindi ? "समय" : "Timings"}: ${tomorrowSchedule.openTime} - ${tomorrowSchedule.closeTime} • ${tomorrowSchedule.announcement}`
                  : `${isHindi ? "कल केंद्र बंद रहेगा" : "Centre Closed Tomorrow"}: ${tomorrowSchedule.announcement}`}
              </span>
            </div>
            <button
              onClick={() => {
                setTempSchedule(tomorrowSchedule);
                setShowTomorrowModal(true);
              }}
              style={{
                background: "transparent",
                border: "none",
                color: "#A7F3D0",
                fontWeight: 700,
                cursor: "pointer",
                fontSize: "0.78rem",
                textDecoration: "underline"
              }}
            >
              {isHindi ? "शेड्यूल बदलें" : "Edit Schedule"}
            </button>
          </div>
        </div>
      </div>

      <div className="container" style={{ maxWidth: "1200px", margin: "1.75rem auto 0", padding: "0 1rem" }}>

        {/* METRIC SUMMARY CARDS */}
        <div style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
          gap: "1rem",
          marginBottom: "2rem"
        }}>
          {/* Card 1: Total Bookings */}
          <div style={{ background: "#FFFFFF", padding: "1.25rem", borderRadius: "18px", border: "1px solid #E2E8F0", boxShadow: "0 4px 12px rgba(0,0,0,0.03)" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <span style={{ fontSize: "0.78rem", fontWeight: 700, color: "#64748B", textTransform: "uppercase" }}>
                {isHindi ? "आज की कुल बुकिंग" : "Today Bookings"}
              </span>
              <div style={{ width: 34, height: 34, borderRadius: "10px", background: "#ECFDF5", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <CalendarCheck2 size={18} color="#047857" />
              </div>
            </div>
            <div style={{ fontSize: "1.85rem", fontWeight: 900, color: "#0F172A", marginTop: "0.35rem" }}>
              {totalBookingsCount}
            </div>
            <div style={{ fontSize: "0.75rem", color: "#059669", fontWeight: 700, marginTop: "2px" }}>
              {isHindi ? "4 स्लॉट (5-8 तत्काल सहित)" : "4 Slots (5-8 PM Tatkaal)"}
            </div>
          </div>

          {/* Card 2: Arrived Farmers */}
          <div style={{ background: "#FFFFFF", padding: "1.25rem", borderRadius: "18px", border: "1px solid #E2E8F0", boxShadow: "0 4px 12px rgba(0,0,0,0.03)" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <span style={{ fontSize: "0.78rem", fontWeight: 700, color: "#64748B", textTransform: "uppercase" }}>
                {isHindi ? "उपस्थित / गेट इन" : "Arrived / Gate-In"}
              </span>
              <div style={{ width: 34, height: 34, borderRadius: "10px", background: "#EFF6FF", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <UserCheck size={18} color="#2563EB" />
              </div>
            </div>
            <div style={{ fontSize: "1.85rem", fontWeight: 900, color: "#1E40AF", marginTop: "0.35rem" }}>
              {totalArrivedCount}
            </div>
            <div style={{ fontSize: "0.75rem", color: "#3B82F6", fontWeight: 700, marginTop: "2px" }}>
              {isHindi ? "गेट इन सत्यापन पूर्ण" : "Checked-in at Gate"}
            </div>
          </div>

          {/* Card 3: Processing / Testing */}
          <div style={{ background: "#FFFFFF", padding: "1.25rem", borderRadius: "18px", border: "1px solid #E2E8F0", boxShadow: "0 4px 12px rgba(0,0,0,0.03)" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <span style={{ fontSize: "0.78rem", fontWeight: 700, color: "#64748B", textTransform: "uppercase" }}>
                {isHindi ? "प्रक्रियाधीन / तौल जांच" : "In Processing / Lab"}
              </span>
              <div style={{ width: 34, height: 34, borderRadius: "10px", background: "#FEF3C7", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <Activity size={18} color="#D97706" />
              </div>
            </div>
            <div style={{ fontSize: "1.85rem", fontWeight: 900, color: "#D97706", marginTop: "0.35rem" }}>
              {totalProcessingCount}
            </div>
            <div style={{ fontSize: "0.75rem", color: "#B45309", fontWeight: 700, marginTop: "2px" }}>
              {isHindi ? "कांटा व गुणवत्ता परीक्षण" : "Weighbridge & Quality"}
            </div>
          </div>

          {/* Card 4: Procurement Completed */}
          <div style={{ background: "#FFFFFF", padding: "1.25rem", borderRadius: "18px", border: "1px solid #E2E8F0", boxShadow: "0 4px 12px rgba(0,0,0,0.03)" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <span style={{ fontSize: "0.78rem", fontWeight: 700, color: "#64748B", textTransform: "uppercase" }}>
                {isHindi ? "खरीद पूर्ण (बिल जारी)" : "Procurement Done"}
              </span>
              <div style={{ width: 34, height: 34, borderRadius: "10px", background: "#DCFCE7", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <CheckCircle size={18} color="#166534" />
              </div>
            </div>
            <div style={{ fontSize: "1.85rem", fontWeight: 900, color: "#166534", marginTop: "0.35rem" }}>
              {totalProcuredCount}
            </div>
            <div style={{ fontSize: "0.75rem", color: "#15803D", fontWeight: 700, marginTop: "2px" }}>
              {isHindi ? "J-Form रसीदें सत्यापित" : "J-Form Bills Generated"}
            </div>
          </div>

          {/* Card 5: Cancelled / Absent */}
          <div style={{ background: "#FFFFFF", padding: "1.25rem", borderRadius: "18px", border: "1px solid #E2E8F0", boxShadow: "0 4px 12px rgba(0,0,0,0.03)" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <span style={{ fontSize: "0.78rem", fontWeight: 700, color: "#64748B", textTransform: "uppercase" }}>
                {isHindi ? "रद्द / अनुपस्थित (Absent)" : "Cancelled / Absent"}
              </span>
              <div style={{ width: 34, height: 34, borderRadius: "10px", background: "#FEE2E2", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <XCircle size={18} color="#DC2626" />
              </div>
            </div>
            <div style={{ fontSize: "1.85rem", fontWeight: 900, color: "#DC2626", marginTop: "0.35rem" }}>
              {totalCancelledCount}
            </div>
            <div style={{ fontSize: "0.75rem", color: "#B91C1C", fontWeight: 700, marginTop: "2px" }}>
              {isHindi ? "5-8 तत्काल में पुनः उपलब्ध" : "Released to 5-8 Tatkaal"}
            </div>
          </div>
        </div>

        {/* EXACTLY 4 SLOTS BREAKDOWN (5 to 8 is Tatkaal) */}
        <div style={{
          background: "#FFFFFF",
          borderRadius: "20px",
          padding: "1.5rem",
          border: "1px solid #E2E8F0",
          boxShadow: "0 8px 24px rgba(0,0,0,0.04)",
          marginBottom: "2rem"
        }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "0.75rem", marginBottom: "1.25rem" }}>
            <div>
              <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                <span style={{ background: "#ECFDF5", color: "#047857", padding: "3px 10px", borderRadius: "8px", fontSize: "0.75rem", fontWeight: 800 }}>
                  4 SLOTS ONLY (5-8 PM IS TATKAAL)
                </span>
                <h2 style={{ fontSize: "1.25rem", fontWeight: 900, color: "#0F172A", margin: 0 }}>
                  {isHindi ? "4 स्लॉट-वार किसान संख्या (5-8 तत्काल कोटा)" : "4-Slot Farmer Breakdown (5:00 - 8:00 PM is Tatkaal)"}
                </h2>
              </div>
              <p style={{ margin: "0.25rem 0 0", color: "#64748B", fontSize: "0.82rem" }}>
                {isHindi ? "स्लॉट 1 (7-10), स्लॉट 2 (10-1), स्लॉट 3 (2-5), तथा स्लॉट 4 (5-8 तत्काल कोटा)" : "Slot 1 (7-10), Slot 2 (10-1), Slot 3 (2-5), and Slot 4 (5-8 PM Tatkaal / Emergency Quota)"}
              </p>
            </div>

            {selectedSlot !== "all" && (
              <button
                onClick={() => setSelectedSlot("all")}
                style={{
                  background: "#F1F5F9",
                  border: "1px solid #CBD5E1",
                  color: "#475569",
                  padding: "0.35rem 0.85rem",
                  borderRadius: "8px",
                  fontSize: "0.78rem",
                  fontWeight: 700,
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  gap: "0.3rem"
                }}
              >
                <RotateCcw size={13} /> {isHindi ? "सभी स्लॉट देखें" : "View All Slots"}
              </button>
            )}
          </div>

          {/* EXACTLY 4 SLOTS IN GRID */}
          <div style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))",
            gap: "1rem"
          }}>
            {slotStats.map(s => {
              const isSelected = selectedSlot === s.code;
              const isTatkaal = s.isTatkaal;

              return (
                <div
                  key={s.id}
                  onClick={() => setSelectedSlot(selectedSlot === s.code ? "all" : s.code)}
                  style={{
                    background: isSelected
                      ? (isTatkaal ? "#FEF3C7" : "#ECFDF5")
                      : (isTatkaal ? "#FFFBEB" : "#F8FAFC"),
                    border: isSelected
                      ? (isTatkaal ? "2.5px solid #D97706" : "2.5px solid #059669")
                      : (isTatkaal ? "2px dashed #F59E0B" : "1.5px solid #E2E8F0"),
                    borderRadius: "18px",
                    padding: "1.2rem 1.1rem",
                    cursor: "pointer",
                    transition: "all 0.2s",
                    boxShadow: isSelected ? "0 6px 16px rgba(5, 150, 105, 0.15)" : "none",
                    position: "relative"
                  }}
                >
                  {/* Top Row: Icon & Farmer count badge */}
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "0.5rem" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "0.4rem" }}>
                      <span style={{ fontSize: "1.4rem" }}>{s.icon}</span>
                      {isTatkaal && (
                        <span style={{
                          background: "#F59E0B",
                          color: "#FFFFFF",
                          padding: "2px 7px",
                          borderRadius: "6px",
                          fontSize: "0.68rem",
                          fontWeight: 900,
                          textTransform: "uppercase"
                        }}>
                          TATKAAL
                        </span>
                      )}
                    </div>

                    <span style={{
                      background: isSelected ? (isTatkaal ? "#D97706" : "#059669") : (isTatkaal ? "#FEF3C7" : "#E2E8F0"),
                      color: isSelected ? "#FFFFFF" : (isTatkaal ? "#92400E" : "#475569"),
                      padding: "2px 9px",
                      borderRadius: "8px",
                      fontSize: "0.76rem",
                      fontWeight: 800
                    }}>
                      {s.totalBooked} {isHindi ? "किसान" : "Farmers"}
                    </span>
                  </div>

                  {/* Slot Title / Time */}
                  <div style={{ fontWeight: 900, fontSize: "0.98rem", color: isSelected ? (isTatkaal ? "#92400E" : "#065F46") : "#1E293B" }}>
                    {s.time}
                  </div>

                  <div style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    marginTop: "0.65rem",
                    fontSize: "0.76rem",
                    color: "#64748B",
                    fontWeight: 600
                  }}>
                    <span>✓ {s.arrived} {isHindi ? "उपस्थित" : "Arrived"}</span>
                    <span>⏳ {s.pending} {isHindi ? "शेष" : "Pending"}</span>
                  </div>

                  {/* Slot progress bar */}
                  <div style={{ height: "5px", background: "#E2E8F0", borderRadius: "3px", marginTop: "0.5rem", overflow: "hidden" }}>
                    <div style={{
                      height: "100%",
                      width: `${Math.min(100, (s.totalBooked / s.maxCapacity) * 100)}%`,
                      background: isTatkaal ? "#D97706" : "#059669",
                      borderRadius: "3px"
                    }} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* TODAY FARMER QUEUE & OPERATIONS DESK */}
        <div style={{
          background: "#FFFFFF",
          borderRadius: "20px",
          padding: "1.75rem",
          border: "1px solid #E2E8F0",
          boxShadow: "0 8px 24px rgba(0,0,0,0.04)"
        }}>

          {/* Queue Header & Filter Controls */}
          <div style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            flexWrap: "wrap",
            gap: "1rem",
            paddingBottom: "1.25rem",
            borderBottom: "1px solid #F1F5F9",
            marginBottom: "1.25rem"
          }}>
            <div>
              <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                <Users size={22} color="#047857" />
                <h2 style={{ fontSize: "1.35rem", fontWeight: 900, color: "#0F172A", margin: 0 }}>
                  {isHindi ? "आज की किसान कतार (Today Farmer Queue)" : "Today Farmer Queue & Dispatch Desk"}
                </h2>
              </div>
              <p style={{ margin: "0.2rem 0 0", color: "#64748B", fontSize: "0.84rem" }}>
                {isHindi
                  ? "किसान पर क्लिक करके फसल विवरण देखें एवं उपस्थिति, प्रोसेसिंग, खरीद पूर्ण या बिल जारी करें"
                  : "Click on any farmer to view detailed crop parameters, update stage (Absent, Arrived, Processing, Procured), or generate bills"}
              </p>
            </div>

            {/* Live Search Input */}
            <div style={{ position: "relative", width: "100%", maxWidth: "320px" }}>
              <Search size={16} color="#94A3B8" style={{ position: "absolute", left: "12px", top: "50%", transform: "translateY(-50%)" }} />
              <input
                type="text"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                placeholder={isHindi ? "किसान, टोकन, फसल या मोबाइल खोजें..." : "Search farmer, token, crop, mobile..."}
                style={{
                  width: "100%",
                  padding: "0.55rem 0.85rem 0.55rem 36px",
                  borderRadius: "12px",
                  border: "1.5px solid #CBD5E1",
                  fontSize: "0.85rem",
                  outline: "none",
                  boxSizing: "border-box"
                }}
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery("")}
                  style={{ position: "absolute", right: "10px", top: "50%", transform: "translateY(-50%)", background: "none", border: "none", cursor: "pointer", color: "#94A3B8" }}
                >
                  <X size={14} />
                </button>
              )}
            </div>
          </div>

          {/* Filter Tabs: Status Pill Selectors */}
          <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap", marginBottom: "1.25rem" }}>
            {[
              { id: "all", label: isHindi ? "सभी किसान" : "All Farmers", count: bookings.length },
              { id: "Booked", label: isHindi ? "⏳ प्रतीक्षा में (Awaiting)" : "⏳ Awaiting Arrival", count: bookings.filter(b => b.status === "Booked").length },
              { id: "Arrived", label: isHindi ? "🔵 उपस्थित (Arrived)" : "🔵 Arrived", count: bookings.filter(b => b.status === "Arrived").length },
              { id: "Processing", label: isHindi ? "⚙️ प्रक्रियाधीन (Processing)" : "⚙️ In Processing", count: bookings.filter(b => b.status === "Processing").length },
              { id: "Procured", label: isHindi ? "🟢 खरीद पूर्ण (Procured)" : "🟢 Procurement Completed", count: bookings.filter(b => b.status === "Procured").length },
              { id: "Cancelled", label: isHindi ? "🔴 रद्द / अनुपस्थित" : "🔴 Cancelled / Absent", count: bookings.filter(b => b.status === "Cancelled").length },
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setStatusFilter(tab.id)}
                style={{
                  padding: "0.45rem 0.9rem",
                  borderRadius: "10px",
                  fontWeight: 700,
                  fontSize: "0.82rem",
                  cursor: "pointer",
                  border: statusFilter === tab.id ? "1.5px solid #059669" : "1px solid #E2E8F0",
                  background: statusFilter === tab.id ? "#ECFDF5" : "#FFFFFF",
                  color: statusFilter === tab.id ? "#065F46" : "#64748B",
                  display: "flex",
                  alignItems: "center",
                  gap: "0.4rem",
                  transition: "all 0.15s"
                }}
              >
                <span>{tab.label}</span>
                <span style={{
                  background: statusFilter === tab.id ? "#059669" : "#F1F5F9",
                  color: statusFilter === tab.id ? "#FFFFFF" : "#64748B",
                  padding: "1px 6px",
                  borderRadius: "6px",
                  fontSize: "0.72rem",
                  fontWeight: 800
                }}>
                  {tab.count}
                </span>
              </button>
            ))}
          </div>

          {/* Farmer Queue List */}
          {filteredQueue.length === 0 ? (
            <div style={{ textAlign: "center", padding: "3.5rem 1rem", background: "#F8FAFC", borderRadius: "16px", border: "1px dashed #CBD5E1" }}>
              <Users size={36} color="#94A3B8" style={{ margin: "0 auto 0.75rem" }} />
              <h3 style={{ fontSize: "1.1rem", fontWeight: 800, color: "#334155", margin: 0 }}>
                {isHindi ? "कोई किसान नहीं मिला" : "No farmers found matching filters"}
              </h3>
              <p style={{ color: "#64748B", fontSize: "0.85rem", margin: "0.35rem 0 1rem" }}>
                {isHindi ? "फ़िल्टर या खोज शब्द बदलकर पुनः प्रयास करें" : "Try clearing your search query or selecting a different slot"}
              </p>
              <button
                onClick={() => {
                  setSelectedSlot("all");
                  setStatusFilter("all");
                  setSearchQuery("");
                }}
                style={{
                  background: "#047857",
                  color: "#FFFFFF",
                  border: "none",
                  padding: "0.55rem 1.25rem",
                  borderRadius: "10px",
                  fontWeight: 700,
                  fontSize: "0.85rem",
                  cursor: "pointer"
                }}
              >
                {isHindi ? "सभी फ़िल्टर साफ़ करें" : "Reset All Filters"}
              </button>
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: "0.85rem" }}>
              {filteredQueue.map(item => {
                const isArrived = item.status === "Arrived";
                const isProcessing = item.status === "Processing";
                const isProcured = item.status === "Procured";
                const isCancelled = item.status === "Cancelled";
                const isBooked = item.status === "Booked";

                return (
                  <div
                    key={item.id}
                    onClick={() => handleOpenFarmerDetails(item)}
                    title={isHindi ? "फसल विवरण व कार्रवाई हेतु क्लिक करें" : "Click to view crop details and lifecycle actions"}
                    style={{
                      background: isProcured ? "#F0FDF4" : isCancelled ? "#FEF2F2" : isProcessing ? "#FFFBEB" : isArrived ? "#F0F9FF" : "#FFFFFF",
                      border: isProcured ? "1.5px solid #86EFAC" : isCancelled ? "1.5px solid #FECACA" : isProcessing ? "1.5px solid #FDE68A" : isArrived ? "1.5px solid #BAE6FD" : "1px solid #E2E8F0",
                      borderRadius: "16px",
                      padding: "1.15rem 1.25rem",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      flexWrap: "wrap",
                      gap: "1rem",
                      transition: "all 0.18s ease",
                      cursor: "pointer",
                      boxShadow: "0 2px 6px rgba(0,0,0,0.02)"
                    }}
                    onMouseEnter={e => {
                      e.currentTarget.style.transform = "translateY(-2px)";
                      e.currentTarget.style.boxShadow = "0 8px 20px rgba(0,0,0,0.06)";
                    }}
                    onMouseLeave={e => {
                      e.currentTarget.style.transform = "none";
                      e.currentTarget.style.boxShadow = "0 2px 6px rgba(0,0,0,0.02)";
                    }}
                  >
                    {/* Left: Token & Farmer Identity */}
                    <div style={{ display: "flex", alignItems: "center", gap: "1rem", flex: "1 1 300px" }}>
                      {/* Token Badge */}
                      <div style={{
                        width: 52,
                        height: 52,
                        borderRadius: "14px",
                        background: isProcured ? "#059669" : isCancelled ? "#DC2626" : isProcessing ? "#D97706" : isArrived ? "#0284C7" : "#475569",
                        color: "#FFFFFF",
                        display: "flex",
                        flexDirection: "column",
                        alignItems: "center",
                        justifyContent: "center",
                        flexShrink: 0,
                        fontWeight: 900,
                        boxShadow: "0 4px 10px rgba(0,0,0,0.1)"
                      }}>
                        <span style={{ fontSize: "0.62rem", letterSpacing: "0.04em", textTransform: "uppercase", opacity: 0.85 }}>TOKEN</span>
                        <span style={{ fontSize: "1.25rem", lineHeight: 1 }}>#{item.token || item.id.slice(-3)}</span>
                      </div>

                      {/* Name & Metadata */}
                      <div>
                        <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", flexWrap: "wrap" }}>
                          <h4 style={{ margin: 0, fontSize: "1.05rem", fontWeight: 800, color: "#0F172A" }}>
                            {item.farmer}
                          </h4>
                          <span style={{
                            background: "#F1F5F9",
                            color: "#475569",
                            padding: "2px 8px",
                            borderRadius: "6px",
                            fontSize: "0.72rem",
                            fontWeight: 700
                          }}>
                            {item.village || "Village"}
                          </span>
                          <span style={{
                            background: "#ECFDF5",
                            color: "#047857",
                            padding: "2px 8px",
                            borderRadius: "6px",
                            fontSize: "0.68rem",
                            fontWeight: 800,
                            display: "inline-flex",
                            alignItems: "center",
                            gap: "0.25rem"
                          }}>
                            <Eye size={11} /> {isHindi ? "फसल विवरण देखें" : "Crop Details"}
                          </span>
                        </div>

                        <div style={{ fontSize: "0.78rem", color: "#64748B", marginTop: "3px", display: "flex", alignItems: "center", gap: "0.85rem", flexWrap: "wrap" }}>
                          <span>📞 +91 {item.mobile}</span>
                          <span>🆔 {item.aadhaar || "XXXX-XXXX-1234"}</span>
                          <span>🚜 {item.vehicleNo || "Tractor Trolley"}</span>
                        </div>
                      </div>
                    </div>

                    {/* Middle: Crop & Slot Info */}
                    <div style={{ flex: "1 1 200px", display: "flex", flexDirection: "column", gap: "3px" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: "0.4rem" }}>
                        <span style={{ fontWeight: 800, fontSize: "0.95rem", color: "#0F172A" }}>
                          🌾 {item.crop}
                        </span>
                        <span style={{ background: "#ECFDF5", color: "#047857", padding: "2px 8px", borderRadius: "6px", fontSize: "0.75rem", fontWeight: 800 }}>
                          {item.weight} Qtl
                        </span>
                        <span style={{ background: "#FEF3C7", color: "#92400E", padding: "2px 6px", borderRadius: "6px", fontSize: "0.7rem", fontWeight: 700 }}>
                          ₹{CROP_MSP[item.crop] || 2275}/Qtl
                        </span>
                      </div>
                      <div style={{ fontSize: "0.76rem", color: "#64748B", display: "flex", alignItems: "center", gap: "0.35rem" }}>
                        <Clock size={12} color="#059669" />
                        <span>{item.slot}</span>
                      </div>
                      {item.arrivedAt && (
                        <div style={{ fontSize: "0.72rem", color: "#0284C7", fontWeight: 700 }}>
                          ⏱️ {isHindi ? `आगमन: ${item.arrivedAt}` : `Arrived at ${item.arrivedAt}`}
                        </div>
                      )}
                    </div>

                    {/* Status Badge */}
                    <div style={{ flex: "0 0 150px" }}>
                      {isBooked && (
                        <span style={{ background: "#FEF3C7", color: "#B45309", padding: "4px 10px", borderRadius: "8px", fontSize: "0.78rem", fontWeight: 800, display: "inline-flex", alignItems: "center", gap: "0.3rem" }}>
                          <Clock size={13} /> {isHindi ? "प्रतीक्षा में" : "Awaiting Arrival"}
                        </span>
                      )}
                      {isArrived && (
                        <span style={{ background: "#E0F2FE", color: "#0369A1", padding: "4px 10px", borderRadius: "8px", fontSize: "0.78rem", fontWeight: 800, display: "inline-flex", alignItems: "center", gap: "0.3rem" }}>
                          <UserCheck size={13} /> {isHindi ? "उपस्थित / गेट इन" : "Arrived (Gate-In)"}
                        </span>
                      )}
                      {isProcessing && (
                        <span style={{ background: "#FEF3C7", color: "#B45309", padding: "4px 10px", borderRadius: "8px", fontSize: "0.78rem", fontWeight: 800, display: "inline-flex", alignItems: "center", gap: "0.3rem" }}>
                          <Activity size={13} /> {isHindi ? "तौल व गुणवत्ता जांच" : "Processing / Testing"}
                        </span>
                      )}
                      {isProcured && (
                        <div style={{ display: "flex", flexDirection: "column", gap: "2px" }}>
                          <span style={{ background: "#DCFCE7", color: "#15803D", padding: "4px 10px", borderRadius: "8px", fontSize: "0.78rem", fontWeight: 800, display: "inline-flex", alignItems: "center", gap: "0.3rem" }}>
                            <CheckCircle2 size={13} /> {isHindi ? "खरीद पूर्ण" : "Procured & Billed"}
                          </span>
                          <span style={{ fontSize: "0.72rem", color: item.paymentStatus === "Paid" ? "#15803D" : "#D97706", fontWeight: 700 }}>
                            {item.paymentStatus === "Paid" ? "💰 DBT Paid" : item.paymentStatus === "Processing" ? "🔄 Payment Processing" : "⏳ Payment Due"}
                          </span>
                        </div>
                      )}
                      {isCancelled && (
                        <div style={{ display: "flex", flexDirection: "column", gap: "2px" }}>
                          <span style={{ background: "#FEE2E2", color: "#B91C1C", padding: "4px 10px", borderRadius: "8px", fontSize: "0.78rem", fontWeight: 800, display: "inline-flex", alignItems: "center", gap: "0.3rem" }}>
                            <XCircle size={13} /> {isHindi ? "रद्द / अनुपस्थित" : "Cancelled / Absent"}
                          </span>
                          <span style={{ fontSize: "0.68rem", color: "#991B1B" }}>
                            {item.cancelReason || "No-show on time"}
                          </span>
                        </div>
                      )}
                    </div>

                    {/* Right: Operational Action Buttons */}
                    <div style={{ display: "flex", alignItems: "center", gap: "0.45rem", flexWrap: "wrap" }} onClick={e => e.stopPropagation()}>
                      {/* Button 1: Mark Arrived (if Booked) */}
                      {isBooked && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleMarkArrived(item.id);
                          }}
                          style={{
                            background: "#047857",
                            color: "#FFFFFF",
                            border: "none",
                            padding: "0.55rem 0.95rem",
                            borderRadius: "10px",
                            fontWeight: 800,
                            fontSize: "0.82rem",
                            cursor: "pointer",
                            display: "flex",
                            alignItems: "center",
                            gap: "0.35rem",
                            boxShadow: "0 2px 8px rgba(4, 120, 87, 0.25)"
                          }}
                        >
                          <Check size={15} />
                          {isHindi ? "उपस्थिति दर्ज करें" : "Mark Arrived"}
                        </button>
                      )}

                      {/* Button 2: Mark Processing (if Arrived) */}
                      {isArrived && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleMarkProcessing(item.id);
                          }}
                          style={{
                            background: "#D97706",
                            color: "#FFFFFF",
                            border: "none",
                            padding: "0.55rem 0.9rem",
                            borderRadius: "10px",
                            fontWeight: 800,
                            fontSize: "0.82rem",
                            cursor: "pointer",
                            display: "flex",
                            alignItems: "center",
                            gap: "0.35rem",
                            boxShadow: "0 2px 8px rgba(217, 119, 6, 0.25)"
                          }}
                        >
                          <Activity size={14} />
                          {isHindi ? "तौल/जांच शुरू करें" : "Start Processing"}
                        </button>
                      )}

                      {/* Button 3: Generate Bill / Procurement Completed */}
                      {(isBooked || isArrived || isProcessing) && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleOpenBillModal(item);
                          }}
                          style={{
                            background: "linear-gradient(135deg, #0284C7 0%, #0369A1 100%)",
                            color: "#FFFFFF",
                            border: "none",
                            padding: "0.55rem 1rem",
                            borderRadius: "10px",
                            fontWeight: 800,
                            fontSize: "0.82rem",
                            cursor: "pointer",
                            display: "flex",
                            alignItems: "center",
                            gap: "0.35rem",
                            boxShadow: "0 2px 8px rgba(2, 132, 199, 0.25)"
                          }}
                        >
                          <FileText size={15} />
                          {isHindi ? "बिल (J-Form) बनाएं" : "Generate Bill"}
                        </button>
                      )}

                      {/* Button 4: View Bill if already procured */}
                      {isProcured && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setActiveBooking(item);
                            setShowViewReceiptModal(true);
                          }}
                          style={{
                            background: "#FFFFFF",
                            border: "1.5px solid #059669",
                            color: "#059669",
                            padding: "0.5rem 0.9rem",
                            borderRadius: "10px",
                            fontWeight: 800,
                            fontSize: "0.82rem",
                            cursor: "pointer",
                            display: "flex",
                            alignItems: "center",
                            gap: "0.35rem"
                          }}
                        >
                          <Printer size={14} />
                          {isHindi ? "रसीद देखें" : "View Receipt"}
                        </button>
                      )}

                      {/* Button 5: Cancel Slot (If not yet procured) */}
                      {!isProcured && !isCancelled && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleOpenCancelModal(item);
                          }}
                          style={{
                            background: "#FFF1F2",
                            border: "1px solid #FECDD3",
                            color: "#E11D48",
                            padding: "0.5rem 0.85rem",
                            borderRadius: "10px",
                            fontWeight: 700,
                            fontSize: "0.8rem",
                            cursor: "pointer",
                            display: "flex",
                            alignItems: "center",
                            gap: "0.25rem"
                          }}
                        >
                          <X size={14} />
                          {isHindi ? "अनुपस्थित/रद्द" : "Mark Absent"}
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

      </div>

      {/* MODAL 0: DETAILED FARMER & CROPS SPECIFICATION & LIFECYCLE ACTION DESK */}
      {showFarmerDetailModal && activeBooking && (
        <div style={{
          position: "fixed",
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: "rgba(15, 23, 42, 0.7)",
          backdropFilter: "blur(5px)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          zIndex: 999,
          padding: "1rem"
        }}>
          <div style={{
            background: "#FFFFFF",
            borderRadius: "24px",
            maxWidth: "760px",
            width: "100%",
            maxHeight: "92vh",
            overflowY: "auto",
            boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.35)",
            animation: "fadeIn 0.2s ease-out"
          }}>
            {/* Modal Header */}
            <div style={{
              background: "linear-gradient(135deg, #064E3B 0%, #047857 55%, #0284C7 100%)",
              color: "#FFFFFF",
              padding: "1.5rem 1.75rem",
              position: "relative"
            }}>
              <button
                onClick={() => setShowFarmerDetailModal(false)}
                style={{
                  position: "absolute",
                  right: 18,
                  top: 18,
                  background: "rgba(255, 255, 255, 0.2)",
                  border: "none",
                  color: "#FFFFFF",
                  borderRadius: "50%",
                  width: 34,
                  height: 34,
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  transition: "background 0.15s"
                }}
              >
                <X size={18} />
              </button>

              <div style={{ display: "flex", alignItems: "center", gap: "1rem", flexWrap: "wrap" }}>
                {/* Large Token Badge */}
                <div style={{
                  width: 60,
                  height: 60,
                  borderRadius: "16px",
                  background: "#FFFFFF",
                  color: "#064E3B",
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  justifyContent: "center",
                  fontWeight: 900,
                  boxShadow: "0 4px 14px rgba(0,0,0,0.15)",
                  flexShrink: 0
                }}>
                  <span style={{ fontSize: "0.62rem", letterSpacing: "0.04em", textTransform: "uppercase", color: "#047857" }}>TOKEN</span>
                  <span style={{ fontSize: "1.4rem", lineHeight: 1 }}>#{activeBooking.token || activeBooking.id.slice(-3)}</span>
                </div>

                <div>
                  <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", flexWrap: "wrap" }}>
                    <h3 style={{ margin: 0, fontSize: "1.45rem", fontWeight: 900 }}>
                      {activeBooking.farmer}
                    </h3>
                    <span style={{
                      background: "rgba(255, 255, 255, 0.25)",
                      color: "#FEF3C7",
                      padding: "2px 10px",
                      borderRadius: "10px",
                      fontSize: "0.75rem",
                      fontWeight: 800
                    }}>
                      📍 {activeBooking.village || "Centre Location"}, Lucknow
                    </span>
                    <span style={{
                      background: "rgba(0, 0, 0, 0.25)",
                      color: "#A7F3D0",
                      padding: "2px 8px",
                      borderRadius: "8px",
                      fontSize: "0.72rem",
                      fontWeight: 700
                    }}>
                      ID: {activeBooking.farmerId || "FARM-UP-9021"}
                    </span>
                  </div>

                  <div style={{ display: "flex", alignItems: "center", gap: "1rem", marginTop: "0.35rem", fontSize: "0.85rem", opacity: 0.95, flexWrap: "wrap" }}>
                    <a
                      href={`tel:${activeBooking.mobile}`}
                      style={{
                        color: "#FFFFFF",
                        background: "rgba(255, 255, 255, 0.2)",
                        padding: "3px 10px",
                        borderRadius: "8px",
                        textDecoration: "none",
                        fontWeight: 800,
                        display: "inline-flex",
                        alignItems: "center",
                        gap: "0.35rem"
                      }}
                    >
                      <PhoneCall size={13} color="#A7F3D0" /> +91 {activeBooking.mobile}
                    </a>
                    <span>🆔 Aadhaar: {activeBooking.aadhaar || "XXXX-XXXX-1234"}</span>
                    <span>🚜 {activeBooking.vehicleNo || "Tractor Trolley"}</span>
                  </div>
                </div>
              </div>
            </div>

            <div style={{ padding: "1.75rem", display: "flex", flexDirection: "column", gap: "1.5rem" }}>

              {/* Status & Lifecycle Timeline Tracker */}
              <div style={{
                background: "#F8FAFC",
                border: "1.5px solid #E2E8F0",
                borderRadius: "18px",
                padding: "1.1rem 1.25rem"
              }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.85rem", flexWrap: "wrap", gap: "0.5rem" }}>
                  <span style={{ fontSize: "0.8rem", fontWeight: 800, color: "#475569", textTransform: "uppercase", letterSpacing: "0.04em" }}>
                    {isHindi ? "लाइव स्थिति व चरण ट्रैकर" : "Procurement Workflow Status"}
                  </span>
                  
                  {/* Current Active Status Tag */}
                  <span style={{
                    background: activeBooking.status === "Procured" ? "#DCFCE7" : activeBooking.status === "Cancelled" ? "#FEE2E2" : activeBooking.status === "Processing" ? "#FEF3C7" : activeBooking.status === "Arrived" ? "#E0F2FE" : "#F1F5F9",
                    color: activeBooking.status === "Procured" ? "#15803D" : activeBooking.status === "Cancelled" ? "#B91C1C" : activeBooking.status === "Processing" ? "#92400E" : activeBooking.status === "Arrived" ? "#0369A1" : "#475569",
                    border: "1px solid currentColor",
                    padding: "3px 12px",
                    borderRadius: "20px",
                    fontSize: "0.78rem",
                    fontWeight: 900
                  }}>
                    ● {activeBooking.status === "Procured" ? (isHindi ? "खरीद पूर्ण व बिल जारी" : "Procured & Billed") : activeBooking.status === "Cancelled" ? (isHindi ? "रद्द / अनुपस्थित (Absent)" : "Cancelled / Absent") : activeBooking.status === "Processing" ? (isHindi ? "तौल व गुणवत्ता जांच (Processing)" : "In Processing / Lab") : activeBooking.status === "Arrived" ? (isHindi ? "उपस्थित (Gate-In)" : "Arrived (Gate-In)") : (isHindi ? "प्रतीक्षा में (Awaiting Arrival)" : "Awaiting Arrival")}
                  </span>
                </div>

                {/* 4-Step Visual Progress Tracker */}
                {activeBooking.status === "Cancelled" ? (
                  <div style={{ background: "#FEF2F2", border: "1px solid #FECACA", borderRadius: "12px", padding: "0.75rem 1rem", color: "#991B1B", fontSize: "0.85rem", fontWeight: 700, display: "flex", alignItems: "center", gap: "0.5rem" }}>
                    <XCircle size={18} color="#DC2626" />
                    <span>
                      {isHindi ? `यह स्लॉट रद्द / अनुपस्थित चिह्नित है: "${activeBooking.cancelReason || "Farmer No-Show"}"` : `Slot marked Cancelled / Absent: "${activeBooking.cancelReason || "Farmer No-Show"}"`}
                    </span>
                  </div>
                ) : (
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(130px, 1fr))", gap: "0.5rem" }}>
                    {[
                      { step: 1, label: isHindi ? "1. स्लॉट बुक" : "1. Booked", done: true, active: activeBooking.status === "Booked" },
                      { step: 2, label: isHindi ? "2. आगमन (Gate-In)" : "2. Arrived", done: activeBooking.status === "Arrived" || activeBooking.status === "Processing" || activeBooking.status === "Procured", active: activeBooking.status === "Arrived" },
                      { step: 3, label: isHindi ? "3. तौल व जांच" : "3. Processing", done: activeBooking.status === "Processing" || activeBooking.status === "Procured", active: activeBooking.status === "Processing" },
                      { step: 4, label: isHindi ? "4. खरीद पूर्ण व बिल" : "4. Procured & Bill", done: activeBooking.status === "Procured", active: activeBooking.status === "Procured" }
                    ].map(st => (
                      <div
                        key={st.step}
                        style={{
                          background: st.active ? "#047857" : st.done ? "#ECFDF5" : "#FFFFFF",
                          color: st.active ? "#FFFFFF" : st.done ? "#065F46" : "#94A3B8",
                          border: st.active ? "1.5px solid #047857" : st.done ? "1.5px solid #86EFAC" : "1px solid #E2E8F0",
                          borderRadius: "12px",
                          padding: "0.6rem 0.75rem",
                          textAlign: "center",
                          fontSize: "0.76rem",
                          fontWeight: 800,
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          gap: "0.3rem"
                        }}
                      >
                        {st.done && !st.active && <Check size={14} color="#059669" />}
                        {st.active && <Sparkles size={14} color="#FBBF24" />}
                        <span>{st.label}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Crop & Procurement Detailed Specs Grid */}
              <div>
                <h4 style={{ margin: "0 0 0.85rem", fontSize: "1.05rem", fontWeight: 900, color: "#0F172A", display: "flex", alignItems: "center", gap: "0.45rem" }}>
                  🌾 {isHindi ? "किसान की फसल व खरीद विवरण" : "Farmer Crop & Weighment Specifications"}
                </h4>

                <div style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(auto-fit, minmax(210px, 1fr))",
                  gap: "0.85rem"
                }}>
                  {/* Card 1: Crop Name & MSP */}
                  <div style={{ background: "#F0FDF4", border: "1.5px solid #86EFAC", borderRadius: "14px", padding: "1rem" }}>
                    <span style={{ fontSize: "0.72rem", color: "#047857", fontWeight: 800, textTransform: "uppercase" }}>
                      {isHindi ? "फसल का नाम व MSP दर" : "Crop & Govt. MSP Rate"}
                    </span>
                    <div style={{ fontSize: "1.25rem", fontWeight: 900, color: "#064E3B", marginTop: "2px" }}>
                      🌾 {activeBooking.crop}
                    </div>
                    <div style={{ fontSize: "0.78rem", color: "#059669", fontWeight: 700, marginTop: "2px" }}>
                      MSP: ₹{CROP_MSP[activeBooking.crop] || 2275} / Quintal
                    </div>
                  </div>

                  {/* Card 2: Quantity / Weight */}
                  <div style={{ background: "#F8FAFC", border: "1.5px solid #CBD5E1", borderRadius: "14px", padding: "1rem" }}>
                    <span style={{ fontSize: "0.72rem", color: "#64748B", fontWeight: 800, textTransform: "uppercase" }}>
                      {isHindi ? "अनुमानित / तौल मात्रा" : "Verified Net Quantity"}
                    </span>
                    <div style={{ fontSize: "1.25rem", fontWeight: 900, color: "#0F172A", marginTop: "2px" }}>
                      ⚖️ {activeBooking.weight} <span style={{ fontSize: "0.88rem" }}>Quintals</span>
                    </div>
                    <div style={{ fontSize: "0.75rem", color: "#64748B", marginTop: "2px" }}>
                      Gross: ~{(Number(activeBooking.weight) + 60).toFixed(1)} Qtl • Tare: ~60 Qtl
                    </div>
                  </div>

                  {/* Card 3: Total Payable Amount */}
                  <div style={{ background: "linear-gradient(135deg, #ECFDF5 0%, #D1FAE5 100%)", border: "1.5px solid #6EE7B7", borderRadius: "14px", padding: "1rem" }}>
                    <span style={{ fontSize: "0.72rem", color: "#065F46", fontWeight: 800, textTransform: "uppercase" }}>
                      {isHindi ? "कुल देय राशि (Payable Amount)" : "Estimated Gross Payout"}
                    </span>
                    <div style={{ fontSize: "1.35rem", fontWeight: 900, color: "#047857", marginTop: "2px" }}>
                      ₹{((Number(activeBooking.weight) || 25) * (CROP_MSP[activeBooking.crop] || 2275)).toLocaleString("en-IN")}
                    </div>
                    <div style={{ fontSize: "0.74rem", color: "#065F46", fontWeight: 700 }}>
                      100% DBT Direct Bank Transfer
                    </div>
                  </div>

                  {/* Card 4: Quality Grade & Moisture */}
                  <div style={{ background: "#F8FAFC", border: "1.5px solid #CBD5E1", borderRadius: "14px", padding: "1rem" }}>
                    <span style={{ fontSize: "0.72rem", color: "#64748B", fontWeight: 800, textTransform: "uppercase" }}>
                      {isHindi ? "गुणवत्ता ग्रेड व नमी" : "Quality Grade & Moisture"}
                    </span>
                    <div style={{ fontSize: "1.05rem", fontWeight: 900, color: "#0F172A", marginTop: "2px" }}>
                      🏅 {activeBooking.qualityGrade || "FAQ Grade-I"}
                    </div>
                    <div style={{ fontSize: "0.76rem", color: (activeBooking.moisture || 11.4) <= 12 ? "#059669" : "#DC2626", fontWeight: 700, marginTop: "2px" }}>
                      💧 Moisture: {activeBooking.moisture || "11.4"}% (Limit ≤ 12%)
                    </div>
                  </div>

                  {/* Card 5: Slot Window & Timings */}
                  <div style={{ background: "#F8FAFC", border: "1.5px solid #CBD5E1", borderRadius: "14px", padding: "1rem" }}>
                    <span style={{ fontSize: "0.72rem", color: "#64748B", fontWeight: 800, textTransform: "uppercase" }}>
                      {isHindi ? "आवंटित समय स्लॉट" : "Assigned Slot & Window"}
                    </span>
                    <div style={{ fontSize: "1.05rem", fontWeight: 900, color: "#0F172A", marginTop: "2px" }}>
                      ⏰ {activeBooking.slot}
                    </div>
                    <div style={{ fontSize: "0.75rem", color: activeBooking.slotCode === "5-8" ? "#D97706" : "#059669", fontWeight: 700, marginTop: "2px" }}>
                      {activeBooking.slotCode === "5-8" ? "⚡ Tatkaal Quota Slot" : "Standard Mandi Quota"}
                    </div>
                  </div>

                  {/* Card 6: Vehicle & Transport */}
                  <div style={{ background: "#F8FAFC", border: "1.5px solid #CBD5E1", borderRadius: "14px", padding: "1rem" }}>
                    <span style={{ fontSize: "0.72rem", color: "#64748B", fontWeight: 800, textTransform: "uppercase" }}>
                      {isHindi ? "परिवहन वाहन व गेट इन" : "Transport & Arrival Time"}
                    </span>
                    <div style={{ fontSize: "1.05rem", fontWeight: 900, color: "#0F172A", marginTop: "2px" }}>
                      🚜 {activeBooking.vehicleNo || "Tractor Trolley"}
                    </div>
                    <div style={{ fontSize: "0.75rem", color: activeBooking.arrivedAt ? "#0284C7" : "#64748B", fontWeight: 700, marginTop: "2px" }}>
                      {activeBooking.arrivedAt ? `✓ Arrived at ${activeBooking.arrivedAt}` : "⏳ Not yet checked-in"}
                    </div>
                  </div>
                </div>

                {/* Bank Account DBT Details Strip */}
                <div style={{
                  background: "#F1F5F9",
                  borderRadius: "12px",
                  padding: "0.75rem 1rem",
                  marginTop: "0.85rem",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  flexWrap: "wrap",
                  gap: "0.5rem",
                  fontSize: "0.82rem",
                  color: "#334155"
                }}>
                  <div>
                    <span style={{ fontWeight: 800, color: "#0F172A" }}>🏦 DBT Bank: </span>
                    <span>{activeBooking.bankName || "State Bank of India"} • A/C: {activeBooking.accountNo || "XXXX-XXXX-5678"} • IFSC: {activeBooking.ifsc || "SBIN0001234"}</span>
                  </div>
                  <div>
                    <span style={{
                      background: activeBooking.paymentStatus === "Paid" ? "#DCFCE7" : activeBooking.paymentStatus === "Processing" ? "#EFF6FF" : "#FEF3C7",
                      color: activeBooking.paymentStatus === "Paid" ? "#15803D" : activeBooking.paymentStatus === "Processing" ? "#1D4ED8" : "#92400E",
                      padding: "2px 8px",
                      borderRadius: "6px",
                      fontWeight: 800,
                      fontSize: "0.74rem"
                    }}>
                      {activeBooking.paymentStatus === "Paid" ? "✓ DBT Paid" : activeBooking.paymentStatus === "Processing" ? "🔄 Payment Processing" : "⏳ Payment Due"}
                    </span>
                  </div>
                </div>
              </div>

              {/* ACTION CONTROL DESK: STATUS SWITCHER BUTTONS */}
              <div style={{
                background: "linear-gradient(180deg, #F8FAFC 0%, #F1F5F9 100%)",
                border: "2px solid #E2E8F0",
                borderRadius: "20px",
                padding: "1.25rem 1.35rem"
              }}>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "0.85rem", flexWrap: "wrap", gap: "0.5rem" }}>
                  <div>
                    <h4 style={{ margin: 0, fontSize: "1.05rem", fontWeight: 900, color: "#0F172A", display: "flex", alignItems: "center", gap: "0.4rem" }}>
                      ⚡ {isHindi ? "त्वरित स्थिति व खरीद नियंत्रण (Quick Status Actions)" : "Quick Status & Procurement Control Desk"}
                    </h4>
                    <p style={{ margin: "2px 0 0", fontSize: "0.78rem", color: "#64748B" }}>
                      {isHindi ? "किसी भी बटन पर क्लिक करके स्थिति बदलें या बिल जारी करें:" : "Click any button below to update farmer stage or issue weighment bill:"}
                    </p>
                  </div>
                </div>

                {/* 5 Prominent Action Buttons */}
                <div style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(auto-fit, minmax(135px, 1fr))",
                  gap: "0.65rem"
                }}>
                  {/* Button 1: Mark Absent / No-Show */}
                  <button
                    onClick={() => {
                      handleMarkAbsent(activeBooking.id, "Farmer did not show up on time");
                    }}
                    style={{
                      background: activeBooking.status === "Cancelled" ? "#FEE2E2" : "#FFFFFF",
                      border: activeBooking.status === "Cancelled" ? "2px solid #DC2626" : "1.5px solid #FECACA",
                      color: "#DC2626",
                      padding: "0.75rem 0.6rem",
                      borderRadius: "14px",
                      fontWeight: 800,
                      fontSize: "0.82rem",
                      cursor: "pointer",
                      display: "flex",
                      flexDirection: "column",
                      alignItems: "center",
                      gap: "0.3rem",
                      transition: "all 0.15s",
                      boxShadow: "0 2px 6px rgba(0,0,0,0.03)"
                    }}
                  >
                    <UserX size={18} color="#DC2626" />
                    <span>{isHindi ? "अनुपस्थित (Absent)" : "Mark Absent"}</span>
                    {activeBooking.status === "Cancelled" && (
                      <span style={{ fontSize: "0.65rem", background: "#DC2626", color: "#FFFFFF", padding: "1px 6px", borderRadius: "4px" }}>
                        ✓ Current
                      </span>
                    )}
                  </button>

                  {/* Button 2: Mark Arrived */}
                  <button
                    onClick={() => {
                      handleMarkArrived(activeBooking.id);
                    }}
                    style={{
                      background: activeBooking.status === "Arrived" ? "#E0F2FE" : "#FFFFFF",
                      border: activeBooking.status === "Arrived" ? "2px solid #0284C7" : "1.5px solid #BAE6FD",
                      color: "#0284C7",
                      padding: "0.75rem 0.6rem",
                      borderRadius: "14px",
                      fontWeight: 800,
                      fontSize: "0.82rem",
                      cursor: "pointer",
                      display: "flex",
                      flexDirection: "column",
                      alignItems: "center",
                      gap: "0.3rem",
                      transition: "all 0.15s",
                      boxShadow: "0 2px 6px rgba(0,0,0,0.03)"
                    }}
                  >
                    <UserCheck size={18} color="#0284C7" />
                    <span>{isHindi ? "उपस्थित (Arrived)" : "Mark Arrived"}</span>
                    {activeBooking.status === "Arrived" && (
                      <span style={{ fontSize: "0.65rem", background: "#0284C7", color: "#FFFFFF", padding: "1px 6px", borderRadius: "4px" }}>
                        ✓ Current
                      </span>
                    )}
                  </button>

                  {/* Button 3: Mark Processing / Testing */}
                  <button
                    onClick={() => {
                      handleMarkProcessing(activeBooking.id);
                    }}
                    style={{
                      background: activeBooking.status === "Processing" ? "#FEF3C7" : "#FFFFFF",
                      border: activeBooking.status === "Processing" ? "2px solid #D97706" : "1.5px solid #FDE68A",
                      color: "#D97706",
                      padding: "0.75rem 0.6rem",
                      borderRadius: "14px",
                      fontWeight: 800,
                      fontSize: "0.82rem",
                      cursor: "pointer",
                      display: "flex",
                      flexDirection: "column",
                      alignItems: "center",
                      gap: "0.3rem",
                      transition: "all 0.15s",
                      boxShadow: "0 2px 6px rgba(0,0,0,0.03)"
                    }}
                  >
                    <Activity size={18} color="#D97706" />
                    <span>{isHindi ? "तौल/जांच (Processing)" : "Mark Processing"}</span>
                    {activeBooking.status === "Processing" && (
                      <span style={{ fontSize: "0.65rem", background: "#D97706", color: "#FFFFFF", padding: "1px 6px", borderRadius: "4px" }}>
                        ✓ Current
                      </span>
                    )}
                  </button>

                  {/* Button 4: Mark Procurement Completed */}
                  <button
                    onClick={() => {
                      handleMarkProcured(activeBooking.id);
                    }}
                    style={{
                      background: activeBooking.status === "Procured" ? "#DCFCE7" : "#FFFFFF",
                      border: activeBooking.status === "Procured" ? "2px solid #166534" : "1.5px solid #86EFAC",
                      color: "#166534",
                      padding: "0.75rem 0.6rem",
                      borderRadius: "14px",
                      fontWeight: 800,
                      fontSize: "0.82rem",
                      cursor: "pointer",
                      display: "flex",
                      flexDirection: "column",
                      alignItems: "center",
                      gap: "0.3rem",
                      transition: "all 0.15s",
                      boxShadow: "0 2px 6px rgba(0,0,0,0.03)"
                    }}
                  >
                    <CheckCircle2 size={18} color="#166534" />
                    <span>{isHindi ? "खरीद पूर्ण (Procured)" : "Mark Completed"}</span>
                    {activeBooking.status === "Procured" && (
                      <span style={{ fontSize: "0.65rem", background: "#166534", color: "#FFFFFF", padding: "1px 6px", borderRadius: "4px" }}>
                        ✓ Current
                      </span>
                    )}
                  </button>

                  {/* Button 5: Generate / View Bill */}
                  <button
                    onClick={() => {
                      setShowFarmerDetailModal(false);
                      if (activeBooking.status === "Procured" && activeBooking.billGenerated) {
                        setShowViewReceiptModal(true);
                      } else {
                        handleOpenBillModal(activeBooking);
                      }
                    }}
                    style={{
                      background: "linear-gradient(135deg, #065F46 0%, #047857 100%)",
                      border: "none",
                      color: "#FFFFFF",
                      padding: "0.75rem 0.6rem",
                      borderRadius: "14px",
                      fontWeight: 800,
                      fontSize: "0.82rem",
                      cursor: "pointer",
                      display: "flex",
                      flexDirection: "column",
                      alignItems: "center",
                      gap: "0.3rem",
                      boxShadow: "0 4px 12px rgba(4, 120, 87, 0.3)"
                    }}
                  >
                    <FileText size={18} color="#A7F3D0" />
                    <span>{activeBooking.billGenerated ? (isHindi ? "रसीद देखें (View Bill)" : "View Receipt") : (isHindi ? "बिल बनाएं (J-Form)" : "Generate Bill")}</span>
                    <span style={{ fontSize: "0.65rem", background: "rgba(255,255,255,0.25)", color: "#FFFFFF", padding: "1px 6px", borderRadius: "4px" }}>
                      MSP Slip
                    </span>
                  </button>
                </div>
              </div>

              {/* Close Button */}
              <div style={{ display: "flex", justifyContent: "flex-end" }}>
                <button
                  onClick={() => setShowFarmerDetailModal(false)}
                  className="btn-outline"
                  style={{ padding: "0.6rem 1.75rem", borderRadius: "12px", fontWeight: 800 }}
                >
                  {isHindi ? "बंद करें (Close)" : "Close Details"}
                </button>
              </div>

            </div>
          </div>
        </div>
      )}

      {/* MODAL 1: TOMORROW OPENING / CLOSING SCHEDULE */}
      {showTomorrowModal && (
        <div style={{
          position: "fixed",
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: "rgba(15, 23, 42, 0.65)",
          backdropFilter: "blur(4px)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          zIndex: 999,
          padding: "1rem"
        }}>
          <div style={{
            background: "#FFFFFF",
            borderRadius: "24px",
            maxWidth: "560px",
            width: "100%",
            overflow: "hidden",
            boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.25)",
            animation: "fadeIn 0.2s ease-out"
          }}>
            {/* Modal Header */}
            <div style={{
              background: "linear-gradient(135deg, #064E3B 0%, #047857 100%)",
              color: "#FFFFFF",
              padding: "1.5rem",
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center"
            }}>
              <div style={{ display: "flex", alignItems: "center", gap: "0.6rem" }}>
                <Calendar size={22} color="#A7F3D0" />
                <h3 style={{ margin: 0, fontSize: "1.25rem", fontWeight: 900 }}>
                  {isHindi ? "कल के संचालन का शेड्यूल (Tomorrow Schedule)" : "Tomorrow Centre Operations Schedule"}
                </h3>
              </div>
              <button
                onClick={() => setShowTomorrowModal(false)}
                style={{ background: "rgba(255,255,255,0.2)", border: "none", color: "#FFFFFF", borderRadius: "50%", width: 32, height: 32, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}
              >
                <X size={18} />
              </button>
            </div>

            {/* Modal Form Body */}
            <form onSubmit={handleSaveTomorrowSchedule} style={{ padding: "1.75rem", display: "flex", flexDirection: "column", gap: "1.25rem" }}>
              
              {/* Toggle Open vs Closed */}
              <div>
                <label style={{ display: "block", fontWeight: 700, color: "#1E293B", marginBottom: "0.5rem", fontSize: "0.9rem" }}>
                  {isHindi ? "कल केंद्र की स्थिति (Open/Close Status)" : "Centre Status for Tomorrow"}
                </label>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.75rem" }}>
                  <button
                    type="button"
                    onClick={() => setTempSchedule(s => ({ ...s, isOpen: true }))}
                    style={{
                      background: tempSchedule.isOpen ? "#ECFDF5" : "#F8FAFC",
                      border: tempSchedule.isOpen ? "2px solid #059669" : "1px solid #E2E8F0",
                      color: tempSchedule.isOpen ? "#065F46" : "#64748B",
                      padding: "0.85rem",
                      borderRadius: "12px",
                      fontWeight: 800,
                      cursor: "pointer",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      gap: "0.4rem"
                    }}
                  >
                    <CheckCircle2 size={18} color={tempSchedule.isOpen ? "#059669" : "#94A3B8"} />
                    {isHindi ? "🟢 खुला रहेगा (Open)" : "🟢 Centre Open"}
                  </button>

                  <button
                    type="button"
                    onClick={() => setTempSchedule(s => ({ ...s, isOpen: false }))}
                    style={{
                      background: !tempSchedule.isOpen ? "#FEF2F2" : "#F8FAFC",
                      border: !tempSchedule.isOpen ? "2px solid #DC2626" : "1px solid #E2E8F0",
                      color: !tempSchedule.isOpen ? "#991B1B" : "#64748B",
                      padding: "0.85rem",
                      borderRadius: "12px",
                      fontWeight: 800,
                      cursor: "pointer",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      gap: "0.4rem"
                    }}
                  >
                    <XCircle size={18} color={!tempSchedule.isOpen ? "#DC2626" : "#94A3B8"} />
                    {isHindi ? "🔴 बंद रहेगा (Closed)" : "🔴 Centre Closed"}
                  </button>
                </div>
              </div>

              {/* Operating Timings (If Open) */}
              {tempSchedule.isOpen && (
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
                  <div>
                    <label style={{ display: "block", fontWeight: 700, color: "#1E293B", marginBottom: "0.35rem", fontSize: "0.85rem" }}>
                      {isHindi ? "खुलने का समय" : "Opening Time"}
                    </label>
                    <input
                      type="text"
                      value={tempSchedule.openTime}
                      onChange={e => setTempSchedule({ ...tempSchedule, openTime: e.target.value })}
                      className="input-field"
                      placeholder="07:00 AM"
                    />
                  </div>
                  <div>
                    <label style={{ display: "block", fontWeight: 700, color: "#1E293B", marginBottom: "0.35rem", fontSize: "0.85rem" }}>
                      {isHindi ? "बंद होने का समय" : "Closing Time"}
                    </label>
                    <input
                      type="text"
                      value={tempSchedule.closeTime}
                      onChange={e => setTempSchedule({ ...tempSchedule, closeTime: e.target.value })}
                      className="input-field"
                      placeholder="08:00 PM"
                    />
                  </div>
                </div>
              )}

              {/* Slot Capacity per slot */}
              <div>
                <label style={{ display: "block", fontWeight: 700, color: "#1E293B", marginBottom: "0.35rem", fontSize: "0.85rem" }}>
                  {isHindi ? "प्रति स्लॉट वाहन/किसान क्षमता" : "Vehicle Quota Per Slot"}
                </label>
                <input
                  type="number"
                  value={tempSchedule.slotCapacity}
                  onChange={e => setTempSchedule({ ...tempSchedule, slotCapacity: Number(e.target.value) })}
                  className="input-field"
                  min="5"
                  max="100"
                />
              </div>

              {/* Announcement / Broadcast for Farmers */}
              <div>
                <label style={{ display: "block", fontWeight: 700, color: "#1E293B", marginBottom: "0.35rem", fontSize: "0.85rem" }}>
                  {isHindi ? "किसानों के लिए सार्वजनिक सूचना" : "Farmer Broadcast Notice"}
                </label>
                <textarea
                  value={tempSchedule.announcement}
                  onChange={e => setTempSchedule({ ...tempSchedule, announcement: e.target.value })}
                  className="input-field"
                  rows={3}
                  placeholder="e.g. Centre operates normally across all 4 slots. 5 to 8 PM is reserved for Tatkaal quota."
                />
              </div>

              {/* Buttons */}
              <div style={{ display: "flex", gap: "0.75rem", marginTop: "0.5rem" }}>
                <button
                  type="button"
                  onClick={() => setShowTomorrowModal(false)}
                  className="btn-outline"
                  style={{ flex: 1, justifyContent: "center" }}
                >
                  {isHindi ? "रद्द करें" : "Cancel"}
                </button>
                <button
                  type="submit"
                  className="btn-primary"
                  style={{ flex: 2, justifyContent: "center", background: "#047857" }}
                >
                  <Check size={16} />
                  {isHindi ? "शेड्यूल सहेजें व लागू करें" : "Save & Publish Schedule"}
                </button>
              </div>

            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: OFFICIAL PROCUREMENT BILL GENERATOR (J-FORM / P-RECEIPT) */}
      {showBillModal && activeBooking && (
        <div style={{
          position: "fixed",
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: "rgba(15, 23, 42, 0.7)",
          backdropFilter: "blur(4px)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          zIndex: 999,
          padding: "1rem"
        }}>
          <div style={{
            background: "#FFFFFF",
            borderRadius: "24px",
            maxWidth: "680px",
            width: "100%",
            maxHeight: "90vh",
            overflowY: "auto",
            boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.3)",
            animation: "fadeIn 0.2s ease-out"
          }}>
            {/* Modal Header */}
            <div style={{
              background: "linear-gradient(135deg, #065F46 0%, #047857 60%, #0284C7 100%)",
              color: "#FFFFFF",
              padding: "1.5rem",
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center"
            }}>
              <div>
                <span style={{
                  background: "rgba(255, 255, 255, 0.2)",
                  color: "#FEF3C7",
                  padding: "2px 10px",
                  borderRadius: "12px",
                  fontSize: "0.72rem",
                  fontWeight: 800,
                  textTransform: "uppercase"
                }}>
                  MSP PROCUREMENT BILLING DESK
                </span>
                <h3 style={{ margin: "0.2rem 0 0", fontSize: "1.35rem", fontWeight: 900 }}>
                  {isHindi ? "खरीद बिल एवं तौल पर्ची (जे-फार्म)" : "MSP Procurement Bill & J-Form Receipt"}
                </h3>
              </div>
              <button
                onClick={() => setShowBillModal(false)}
                style={{ background: "rgba(255,255,255,0.2)", border: "none", color: "#FFFFFF", borderRadius: "50%", width: 32, height: 32, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}
              >
                <X size={18} />
              </button>
            </div>

            {/* Bill Form Body */}
            <form onSubmit={handleSubmitBill} style={{ padding: "1.75rem", display: "flex", flexDirection: "column", gap: "1.25rem" }}>
              
              {/* Farmer Summary Box */}
              <div style={{
                background: "#F8FAFC",
                border: "1.5px dashed #CBD5E1",
                borderRadius: "14px",
                padding: "1rem",
                display: "grid",
                gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
                gap: "0.65rem",
                fontSize: "0.84rem"
              }}>
                <div>
                  <span style={{ color: "#64748B", fontSize: "0.74rem" }}>{isHindi ? "किसान का नाम" : "Farmer Name"}:</span>
                  <div style={{ fontWeight: 800, color: "#0F172A" }}>{activeBooking.farmer}</div>
                </div>
                <div>
                  <span style={{ color: "#64748B", fontSize: "0.74rem" }}>{isHindi ? "टोकन संख्या" : "Token ID"}:</span>
                  <div style={{ fontWeight: 800, color: "#047857" }}>#{activeBooking.token} ({activeBooking.id})</div>
                </div>
                <div>
                  <span style={{ color: "#64748B", fontSize: "0.74rem" }}>{isHindi ? "मोबाइल" : "Mobile"}:</span>
                  <div style={{ fontWeight: 700, color: "#1E293B" }}>+91 {activeBooking.mobile}</div>
                </div>
                <div>
                  <span style={{ color: "#64748B", fontSize: "0.74rem" }}>{isHindi ? "आधार" : "Aadhaar"}:</span>
                  <div style={{ fontWeight: 700, color: "#1E293B" }}>{activeBooking.aadhaar}</div>
                </div>
              </div>

              {/* Crop & Quality Parameters */}
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
                <div>
                  <label style={{ display: "block", fontWeight: 700, color: "#1E293B", marginBottom: "0.35rem", fontSize: "0.85rem" }}>
                    {isHindi ? "फसल का नाम" : "Crop Name"}
                  </label>
                  <select
                    value={billForm.crop}
                    onChange={e => {
                      const newCrop = e.target.value;
                      const newRate = CROP_MSP[newCrop] || 2275;
                      setBillForm(b => ({
                        ...b,
                        crop: newCrop,
                        mspRate: newRate,
                        totalAmount: b.netWeight * newRate - b.deductions
                      }));
                    }}
                    className="input-field"
                  >
                    {Object.keys(CROP_MSP).map(cr => (
                      <option key={cr} value={cr}>{cr} (MSP ₹{CROP_MSP[cr]}/Qtl)</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label style={{ display: "block", fontWeight: 700, color: "#1E293B", marginBottom: "0.35rem", fontSize: "0.85rem" }}>
                    {isHindi ? "गुणवत्ता ग्रेड" : "Quality Grade"}
                  </label>
                  <select
                    value={billForm.qualityGrade}
                    onChange={e => setBillForm({ ...billForm, qualityGrade: e.target.value })}
                    className="input-field"
                  >
                    <option value="FAQ Grade-I">FAQ Grade-I (Premium)</option>
                    <option value="FAQ Grade-II">FAQ Grade-II (Standard)</option>
                    <option value="Fair Average">Fair Average Quality</option>
                  </select>
                </div>
              </div>

              {/* Moisture & Weighbridge Gross/Tare/Net */}
              <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "0.85rem" }}>
                <div>
                  <label style={{ display: "block", fontWeight: 700, color: "#1E293B", marginBottom: "0.35rem", fontSize: "0.82rem" }}>
                    {isHindi ? "नमी %" : "Moisture %"}
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    value={billForm.moisture}
                    onChange={e => setBillForm({ ...billForm, moisture: Number(e.target.value) })}
                    className="input-field"
                  />
                  <span style={{ fontSize: "0.7rem", color: billForm.moisture <= 12 ? "#059669" : "#DC2626" }}>
                    {billForm.moisture <= 12 ? "✓ Within Limit (≤12%)" : "⚠️ High Moisture"}
                  </span>
                </div>

                <div>
                  <label style={{ display: "block", fontWeight: 700, color: "#1E293B", marginBottom: "0.35rem", fontSize: "0.82rem" }}>
                    {isHindi ? "सकल वजन (क्विंटल)" : "Gross Weight (Qtl)"}
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    value={billForm.grossWeight}
                    onChange={e => {
                      const g = Number(e.target.value);
                      const net = Math.max(0, g - billForm.tareWeight);
                      setBillForm(b => ({
                        ...b,
                        grossWeight: g,
                        netWeight: net,
                        totalAmount: net * b.mspRate - b.deductions
                      }));
                    }}
                    className="input-field"
                  />
                </div>

                <div>
                  <label style={{ display: "block", fontWeight: 700, color: "#1E293B", marginBottom: "0.35rem", fontSize: "0.82rem" }}>
                    {isHindi ? "खाली वाहन का वजन (क्विंटल)" : "Tare Weight (Qtl)"}
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    value={billForm.tareWeight}
                    onChange={e => {
                      const t = Number(e.target.value);
                      const net = Math.max(0, billForm.grossWeight - t);
                      setBillForm(b => ({
                        ...b,
                        tareWeight: t,
                        netWeight: net,
                        totalAmount: net * b.mspRate - b.deductions
                      }));
                    }}
                    className="input-field"
                  />
                </div>
              </div>

              {/* Net Weight & Rate Calculation Highlight Card */}
              <div style={{
                background: "linear-gradient(135deg, #ECFDF5 0%, #D1FAE5 100%)",
                border: "1.5px solid #6EE7B7",
                borderRadius: "16px",
                padding: "1.1rem",
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                flexWrap: "wrap",
                gap: "1rem"
              }}>
                <div>
                  <span style={{ fontSize: "0.75rem", fontWeight: 800, color: "#065F46", textTransform: "uppercase" }}>
                    {isHindi ? "शुद्ध फसल वजन" : "Net Crop Weight"}
                  </span>
                  <div style={{ fontSize: "1.6rem", fontWeight: 900, color: "#064E3B" }}>
                    {billForm.netWeight.toFixed(1)} <span style={{ fontSize: "1rem" }}>Quintal</span>
                  </div>
                  <div style={{ fontSize: "0.78rem", color: "#047857" }}>
                    MSP Rate: ₹{billForm.mspRate.toLocaleString("en-IN")}/Qtl
                  </div>
                </div>

                <div style={{ textAlign: "right" }}>
                  <span style={{ fontSize: "0.75rem", fontWeight: 800, color: "#065F46", textTransform: "uppercase" }}>
                    {isHindi ? "कुल भुगतान राशि" : "Total Payable Amount"}
                  </span>
                  <div style={{ fontSize: "1.85rem", fontWeight: 900, color: "#047857" }}>
                    ₹{billForm.totalAmount.toLocaleString("en-IN")}
                  </div>
                  <div style={{ fontSize: "0.75rem", color: "#065F46", fontWeight: 700 }}>
                    {isHindi ? "100% प्रत्यक्ष बैंक अंतरण (डीबीटी)" : "100% Direct Benefit Transfer"}
                  </div>
                </div>
              </div>

              {/* Payment Process Status Selector */}
              <div>
                <label style={{ display: "block", fontWeight: 700, color: "#1E293B", marginBottom: "0.45rem", fontSize: "0.88rem" }}>
                  {isHindi ? "भुगतान स्थिति (डीबीटी)" : "Payment Processing Status"}
                </label>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "0.5rem" }}>
                  {[
                    { id: "Due", label: isHindi ? "⏳ भुगतान देय" : "⏳ Payment Due", color: "#D97706", bg: "#FEF3C7" },
                    { id: "Processing", label: isHindi ? "🔄 प्रक्रियाधीन" : "🔄 Processing (DBT)", color: "#2563EB", bg: "#EFF6FF" },
                    { id: "Paid", label: isHindi ? "✓ खाते में अंतरित (सफल)" : "✓ Paid / Transferred", color: "#059669", bg: "#DCFCE7" },
                  ].map(pst => (
                    <button
                      key={pst.id}
                      type="button"
                      onClick={() => setBillForm({ ...billForm, paymentStatus: pst.id })}
                      style={{
                        padding: "0.65rem 0.5rem",
                        borderRadius: "10px",
                        border: billForm.paymentStatus === pst.id ? `2px solid ${pst.color}` : "1px solid #E2E8F0",
                        background: billForm.paymentStatus === pst.id ? pst.bg : "#F8FAFC",
                        color: billForm.paymentStatus === pst.id ? pst.color : "#64748B",
                        fontWeight: 800,
                        fontSize: "0.78rem",
                        cursor: "pointer",
                        textAlign: "center"
                      }}
                    >
                      {pst.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Action Buttons */}
              <div style={{ display: "flex", gap: "0.75rem", marginTop: "0.75rem" }}>
                <button
                  type="button"
                  onClick={() => setShowBillModal(false)}
                  className="btn-outline"
                  style={{ flex: 1, justifyContent: "center" }}
                >
                  {isHindi ? "रद्द करें" : "Cancel"}
                </button>
                <button
                  type="submit"
                  className="btn-primary"
                  style={{
                    flex: 2,
                    justifyContent: "center",
                    background: "linear-gradient(135deg, #065F46 0%, #047857 50%, #059669 100%)",
                    boxShadow: "0 4px 14px rgba(4, 120, 87, 0.3)"
                  }}
                >
                  <CheckCircle size={18} />
                  {isHindi ? "खरीद बिल जमा करें" : "Submit Bill & Sync Receipt"}
                </button>
              </div>

            </form>
          </div>
        </div>
      )}

      {/* MODAL 3: CANCEL SLOT / NO-SHOW REASON */}
      {showCancelModal && activeBooking && (
        <div style={{
          position: "fixed",
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: "rgba(15, 23, 42, 0.65)",
          backdropFilter: "blur(4px)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          zIndex: 999,
          padding: "1rem"
        }}>
          <div style={{
            background: "#FFFFFF",
            borderRadius: "24px",
            maxWidth: "520px",
            width: "100%",
            overflow: "hidden",
            boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.25)",
            animation: "fadeIn 0.2s ease-out"
          }}>
            <div style={{
              background: "#DC2626",
              color: "#FFFFFF",
              padding: "1.5rem",
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center"
            }}>
              <div style={{ display: "flex", alignItems: "center", gap: "0.6rem" }}>
                <AlertTriangle size={22} color="#FEE2E2" />
                <h3 style={{ margin: 0, fontSize: "1.2rem", fontWeight: 900 }}>
                  {isHindi ? "स्लॉट रद्द करें" : "Cancel Booking / Record No-Show"}
                </h3>
              </div>
              <button
                onClick={() => setShowCancelModal(false)}
                style={{ background: "rgba(255,255,255,0.2)", border: "none", color: "#FFFFFF", borderRadius: "50%", width: 32, height: 32, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}
              >
                <X size={18} />
              </button>
            </div>

            <div style={{ padding: "1.75rem", display: "flex", flexDirection: "column", gap: "1.25rem" }}>
              <p style={{ margin: 0, fontSize: "0.9rem", color: "#475569", lineHeight: 1.45 }}>
                {isHindi
                  ? `आप किसान ${activeBooking.farmer} (टोकन #${activeBooking.token || activeBooking.id}) का स्लॉट रद्द कर रहे हैं।`
                  : `You are cancelling the slot for ${activeBooking.farmer} (Token #${activeBooking.token || activeBooking.id}).`}
              </p>

              <div>
                <label style={{ display: "block", fontWeight: 700, color: "#1E293B", marginBottom: "0.35rem", fontSize: "0.85rem" }}>
                  {isHindi ? "रद्द करने का कारण" : "Reason for Cancellation"}
                </label>
                <select
                  value={cancelReason}
                  onChange={e => setCancelReason(e.target.value)}
                  className="input-field"
                >
                  <option value="Farmer did not arrive within designated slot window">Farmer did not arrive within designated slot window</option>
                  <option value="No response on mobile call / Absent">No response on mobile call / Absent</option>
                  <option value="Crop quality rejected (High moisture/admixture)">Crop quality rejected (High moisture/admixture)</option>
                  <option value="Farmer requested cancellation / Emergency">Farmer requested cancellation / Emergency</option>
                  <option value="Duplicate booking / Incorrect crop quota">Duplicate booking / Incorrect crop quota</option>
                </select>
              </div>

              {/* Re-release slot to Tatkaal pool */}
              <div style={{
                background: "#FEF3C7",
                border: "1px solid #FDE68A",
                borderRadius: "12px",
                padding: "0.85rem",
                display: "flex",
                alignItems: "center",
                gap: "0.65rem"
              }}>
                <input
                  type="checkbox"
                  id="tatkaalRel"
                  checked={releaseToTatkaal}
                  onChange={e => setReleaseToTatkaal(e.target.checked)}
                  style={{ width: "18px", height: "18px", cursor: "pointer" }}
                />
                <label htmlFor="tatkaalRel" style={{ fontSize: "0.82rem", color: "#92400E", fontWeight: 700, cursor: "pointer" }}>
                  {isHindi ? "⚡ इस स्लॉट को 5 से 8 बजे के तत्काल कोटा में तुरंत जारी करें" : "⚡ Immediately release this freed slot to the 5:00 - 8:00 PM Tatkaal Quota"}
                </label>
              </div>

              <div style={{ display: "flex", gap: "0.75rem", marginTop: "0.5rem" }}>
                <button
                  type="button"
                  onClick={() => setShowCancelModal(false)}
                  className="btn-outline"
                  style={{ flex: 1, justifyContent: "center" }}
                >
                  {isHindi ? "वापस" : "Keep Booking"}
                </button>
                <button
                  type="button"
                  onClick={handleConfirmCancel}
                  style={{
                    flex: 1,
                    background: "#DC2626",
                    color: "#FFFFFF",
                    border: "none",
                    borderRadius: "12px",
                    fontWeight: 800,
                    fontSize: "0.9rem",
                    cursor: "pointer",
                    padding: "0.75rem",
                    boxShadow: "0 4px 12px rgba(220, 38, 38, 0.25)"
                  }}
                >
                  {isHindi ? "रद्द करें" : "Confirm Cancel"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 4: VIEW PRINTABLE J-FORM RECEIPT */}
      {showViewReceiptModal && activeBooking && (
        <div style={{
          position: "fixed",
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: "rgba(15, 23, 42, 0.7)",
          backdropFilter: "blur(4px)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          zIndex: 999,
          padding: "1rem"
        }}>
          <div style={{
            background: "#FFFFFF",
            borderRadius: "24px",
            maxWidth: "580px",
            width: "100%",
            overflow: "hidden",
            boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.3)",
            animation: "fadeIn 0.2s ease-out"
          }}>
            {/* Certificate Header */}
            <div style={{
              background: "linear-gradient(135deg, #064E3B 0%, #047857 100%)",
              color: "#FFFFFF",
              padding: "1.75rem",
              textAlign: "center",
              position: "relative"
            }}>
              <button
                onClick={() => setShowViewReceiptModal(false)}
                style={{ position: "absolute", right: 16, top: 16, background: "rgba(255,255,255,0.2)", border: "none", color: "#FFFFFF", borderRadius: "50%", width: 32, height: 32, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}
              >
                <X size={18} />
              </button>
              <div style={{ fontSize: "0.75rem", fontWeight: 800, letterSpacing: "0.05em", color: "#FEF3C7", textTransform: "uppercase" }}>
                GOVERNMENT OF INDIA • MSP PROCUREMENT SYSTEM
              </div>
              <h2 style={{ fontSize: "1.4rem", fontWeight: 900, margin: "0.25rem 0 0.25rem" }}>
                {isHindi ? "आधिकारिक जे-फार्म खरीद रसीद" : "Official J-Form Weighment Receipt"}
              </h2>
              <div style={{ fontSize: "0.82rem", color: "#A7F3D0" }}>
                Bill ID: {activeBooking.billId || `BILL-2026-${activeBooking.token}`}
              </div>
            </div>

            {/* Slip Details */}
            <div style={{ padding: "1.75rem" }}>
              <div style={{
                background: "#F8FAFC",
                border: "1.5px dashed #CBD5E1",
                borderRadius: "16px",
                padding: "1.25rem",
                marginBottom: "1.5rem",
                display: "grid",
                gridTemplateColumns: "1fr 1fr",
                gap: "0.85rem",
                fontSize: "0.85rem"
              }}>
                <div>
                  <span style={{ color: "#64748B", fontSize: "0.74rem" }}>{isHindi ? "किसान" : "Farmer"}:</span>
                  <div style={{ fontWeight: 800, color: "#0F172A" }}>{activeBooking.farmer}</div>
                </div>
                <div>
                  <span style={{ color: "#64748B", fontSize: "0.74rem" }}>{isHindi ? "खरीद केंद्र" : "Centre"}:</span>
                  <div style={{ fontWeight: 800, color: "#047857" }}>{user?.name || "Govt. Centre"}</div>
                </div>
                <div>
                  <span style={{ color: "#64748B", fontSize: "0.74rem" }}>{isHindi ? "फसल व ग्रेड" : "Crop & Grade"}:</span>
                  <div style={{ fontWeight: 700, color: "#0F172A" }}>{activeBooking.crop} ({activeBooking.qualityGrade || "FAQ Grade-I"})</div>
                </div>
                <div>
                  <span style={{ color: "#64748B", fontSize: "0.74rem" }}>{isHindi ? "तौल वजन" : "Verified Weight"}:</span>
                  <div style={{ fontWeight: 800, color: "#0F172A" }}>{activeBooking.weight} Quintals</div>
                </div>
                <div>
                  <span style={{ color: "#64748B", fontSize: "0.74rem" }}>{isHindi ? "नमी %" : "Moisture Content"}:</span>
                  <div style={{ fontWeight: 700, color: "#059669" }}>{activeBooking.moisture || 11.4}% (Pass)</div>
                </div>
                <div>
                  <span style={{ color: "#64748B", fontSize: "0.74rem" }}>{isHindi ? "एमएसपी दर" : "MSP Rate"}:</span>
                  <div style={{ fontWeight: 700, color: "#0F172A" }}>₹{activeBooking.mspRate || 2275}/Qtl</div>
                </div>
                <div style={{ gridColumn: "1 / -1", paddingTop: "0.5rem", borderTop: "1px solid #E2E8F0", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <span style={{ fontWeight: 800, color: "#064E3B" }}>{isHindi ? "कुल राशि (Total Amount)" : "Total Payable"}:</span>
                  <span style={{ fontSize: "1.35rem", fontWeight: 900, color: "#047857" }}>
                    ₹{(activeBooking.totalAmount || (activeBooking.weight * 2275)).toLocaleString("en-IN")}
                  </span>
                </div>
              </div>

              <div style={{ display: "flex", gap: "0.75rem" }}>
                <button
                  onClick={() => window.print()}
                  style={{
                    flex: 1,
                    background: "#047857",
                    color: "#FFFFFF",
                    border: "none",
                    padding: "0.75rem",
                    borderRadius: "12px",
                    fontWeight: 800,
                    fontSize: "0.9rem",
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: "0.4rem",
                    boxShadow: "0 4px 12px rgba(4, 120, 87, 0.25)"
                  }}
                >
                  <Printer size={16} />
                  {isHindi ? "रसीद प्रिंट / डाउनलोड करें" : "Print / Download J-Form"}
                </button>
                <button
                  onClick={() => setShowViewReceiptModal(false)}
                  className="btn-outline"
                  style={{ flex: 1, justifyContent: "center" }}
                >
                  {isHindi ? "बंद करें" : "Close"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default CentreDashboard;
