import React, { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { CreditCard, CheckCircle2, Download, ArrowUpRight, Building, Clock, FileText, Printer, RefreshCw } from "lucide-react";
import { paymentService } from "../../services/api";

const PaymentHistory = () => {
  const { t, i18n } = useTranslation();
  const isHindi = i18n.language === "hi";

  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadPayments = async () => {
      try {
        const res = await paymentService.getMy();
        if (res.success && res.data) {
          setPayments(res.data);
        }
      } catch (err) {
        console.error("Failed to load payments:", err);
      } finally {
        setLoading(false);
      }
    };
    loadPayments();
  }, []);

  const getCropName = (crop) => {
    if (!crop) return "";
    if (!isHindi) return crop;
    if (crop.toLowerCase().includes("wheat")) return "गेहूं";
    if (crop.toLowerCase().includes("paddy") || crop.toLowerCase().includes("rice")) return "धान/चावल";
    if (crop.toLowerCase().includes("mustard")) return "सरसों";
    if (crop.toLowerCase().includes("maize")) return "मक्का";
    return crop;
  };

  const getQtyText = (qty) => {
    if (!qty) return "";
    if (!isHindi) return qty;
    return String(qty).replace("Qtl", "क्विंटल").replace("Quintal", "क्विंटल");
  };

  const totalSettled = payments
    .filter(p => p.status === "SUCCESS")
    .reduce((acc, p) => acc + p.amount, 0);

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: '#F8FAFC' }}>
        <div style={{ textAlign: 'center' }}>
          <RefreshCw className="animate-spin" size={44} color="#059669" style={{ margin: '0 auto 1rem' }} />
          <div style={{ fontWeight: 700, color: '#475569' }}>{isHindi ? 'लोड हो रहा है...' : 'Loading Payment Statements...'}</div>
        </div>
      </div>
    );
  }

  return (
    <div style={{ minHeight: "100vh", background: "linear-gradient(180deg, #F0FDF4 0%, #F8FAFC 100%)", paddingBottom: "4rem" }}>

      <div className="container" style={{ marginTop: "2rem", maxWidth: "1100px" }}>

        {/* Modern Header Title */}
        <div style={{ marginBottom: "2rem", display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: "1.5rem" }}>
          <div style={{ textAlign: "left" }}>
            <span style={{ 
              background: "rgba(34, 197, 94, 0.12)", 
              color: "#166534", 
              padding: "4px 12px", 
              borderRadius: "20px", 
              fontSize: "0.75rem", 
              fontWeight: 700, 
              letterSpacing: "0.05em",
              textTransform: "uppercase",
              display: "inline-block",
              marginBottom: "0.5rem"
            }}>
              {isHindi ? "💰 प्रत्यक्ष बैंक हस्तांतरण (DBT)" : "💰 DIRECT BANK TRANSFER (DBT)"}
            </span>
            <h1 style={{ 
              fontSize: "2.5rem", 
              fontWeight: 900, 
              color: "#064E3B",
              margin: "0",
              fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
              letterSpacing: "-0.03em",
              lineHeight: 1.15
            }}>
              {isHindi ? "भुगतान इतिहास और रसीदें" : "Payment History & Receipts"}
            </h1>
            <p style={{ color: "#64748B", fontSize: "0.95rem", marginTop: "0.5rem", marginBlockEnd: 0, lineHeight: 1.45 }}>
              {isHindi 
                ? "आपके आधार-लिंक्ड बैंक खाते में क्रेडिट किए गए प्रत्यक्ष एमएसपी खरीद भुगतान" 
                : "Direct MSP procurement payments credited to your Aadhaar-linked bank account"}
            </p>
          </div>
          <div style={{ 
            background: "#FFFFFF", 
            border: "1px solid #E2E8F0",
            boxShadow: "0 4px 10px rgba(0,0,0,0.03)",
            padding: "0.8rem 1.4rem", 
            borderRadius: "16px", 
            textAlign: "right" 
          }}>
            <div style={{ fontSize: "0.75rem", color: "#64748B", fontWeight: 700 }}>
              {isHindi ? "कुल एमएसपी निपटान" : "Total MSP Settled"}
            </div>
            <div style={{ fontSize: "1.5rem", fontWeight: 900, color: "#166534", marginTop: "0.1rem" }}>
              ₹{totalSettled.toLocaleString("en-IN")}
            </div>
          </div>
        </div>

        {/* DBT Payment Statements */}
        <h3 style={{ fontSize: "1.15rem", fontWeight: 800, color: "#14532D", marginBottom: "1rem" }}>
          {isHindi ? "📜 लेनदेन विवरण एवं जे-फॉर्म" : "📜 Transaction Statements & J-Forms"}
        </h3>

        <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
          {payments.length === 0 ? (
            <div className="card" style={{ textAlign: "center", padding: "3.5rem 2rem", color: "#64748B" }}>
              {isHindi ? "कोई भुगतान लेनदेन रिकॉर्ड नहीं मिला।" : "No payment transaction records found."}
            </div>
          ) : (
            payments.map((p) => {
              const isPaid = p.status === "SUCCESS";
              const isProcessing = p.status === "PENDING";
              return (
                <div key={p.id} className="card" style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "1rem" }}>
                  <div>
                    <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", flexWrap: "wrap" }}>
                      <span className={isPaid ? "badge-green" : isProcessing ? "badge-blue" : "badge-red"}>
                        {isPaid 
                          ? (isHindi ? "● डीबीटी अंतरित (Paid)" : "● Paid via DBT") 
                          : isProcessing 
                            ? (isHindi ? "🔄 प्रक्रियाधीन (PFMS)" : "🔄 Processing") 
                            : (isHindi ? "❌ असफल (Failed)" : "❌ Failed")}
                      </span>
                      <span style={{ fontSize: "0.78rem", color: "#64748B" }}>{p.date}</span>
                      <span style={{ background: "#F1F5F9", border: "1px solid #E2E8F0", padding: "1px 6px", borderRadius: "4px", fontSize: "0.72rem", fontWeight: 700 }}>
                        {p.transactionId || `PAY-${p.id}`}
                      </span>
                    </div>
                    <div style={{ fontWeight: 800, fontSize: "1.15rem", color: "#1E293B", marginTop: "0.45rem" }}>
                      {getCropName(p.crop)} ({getQtyText(p.quantity)})
                    </div>
                    <div style={{ fontSize: "0.8rem", color: "#64748B", marginTop: "0.2rem" }}>
                      {isHindi ? "केंद्र:" : "Centre:"} <strong>{p.centre}</strong>
                      {p.referenceId && <span> • DBT Txn: <strong>{p.referenceId}</strong></span>}
                    </div>
                  </div>

                  <div style={{ textAlign: "right" }}>
                    <div style={{ fontSize: "1.45rem", fontWeight: 900, color: isPaid ? "#15803D" : "#1E293B" }}>
                      ₹{p.amount.toLocaleString()}
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        if (isPaid) {
                          window.print();
                        } else {
                          alert(isHindi ? "भुगतान पूर्ण होने के बाद ही जे-फॉर्म उपलब्ध होगा।" : "J-Form will be available after payment completion.");
                        }
                      }}
                      style={{
                        background: isPaid ? "#F0FDF4" : "#F8FAFC",
                        color: isPaid ? "#15803D" : "#94A3B8",
                        border: `1px solid ${isPaid ? "#86EFAC" : "#E2E8F0"}`,
                        borderRadius: "8px",
                        padding: "0.4rem 0.9rem",
                        fontSize: "0.78rem",
                        fontWeight: 800,
                        cursor: isPaid ? "pointer" : "not-allowed",
                        marginTop: "0.4rem",
                        display: "inline-flex",
                        alignItems: "center",
                        gap: "0.35rem",
                      }}
                      disabled={!isPaid}
                    >
                      <Printer size={13} /> {isHindi ? "जे-फॉर्म डाउनलोड" : "Download J-Form"}
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
};

export default PaymentHistory;
