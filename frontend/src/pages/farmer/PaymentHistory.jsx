import React from 'react';
import { useTranslation } from 'react-i18next';
import { CreditCard, CheckCircle2, Download, ArrowUpRight, Building } from 'lucide-react';
import { mockPayments } from '../../data/mockData';

const PaymentHistory = () => {
  const { t, i18n } = useTranslation();
  const isHindi = i18n.language === 'hi';

  const getCropName = (crop) => {
    if (!isHindi) return crop;
    if (crop.toLowerCase().includes('wheat')) return 'गेहूं';
    if (crop.toLowerCase().includes('paddy')) return 'धान';
    if (crop.toLowerCase().includes('mustard')) return 'सरसों';
    return crop;
  };

  const getQtyText = (qty) => {
    if (!isHindi) return qty;
    return qty.replace('Qtl', 'क्विंटल');
  };

  return (
    <div style={{ minHeight: '100vh', background: 'linear-gradient(180deg, #F0FDF4 0%, #F8FAFC 100%)', paddingBottom: '4rem' }}>

      <div className="container" style={{ marginTop: '2rem', maxWidth: '1100px' }}>

        {/* Modern Header Title */}
        <div style={{ marginBottom: '2rem', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1.5rem' }}>
          <div style={{ textAlign: 'left' }}>
            <span style={{ 
              background: 'rgba(34, 197, 94, 0.12)', 
              color: '#166534', 
              padding: '4px 12px', 
              borderRadius: '20px', 
              fontSize: '0.75rem', 
              fontWeight: 700, 
              letterSpacing: '0.05em',
              textTransform: 'uppercase',
              display: 'inline-block',
              marginBottom: '0.5rem'
            }}>
              {isHindi ? '💰 प्रत्यक्ष बैंक हस्तांतरण (DBT)' : '💰 DIRECT BANK TRANSFER (DBT)'}
            </span>
            <h1 style={{ 
              fontSize: '2.5rem', 
              fontWeight: 900, 
              color: '#064E3B',
              margin: '0',
              fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
              letterSpacing: '-0.03em',
              lineHeight: 1.15
            }}>
              {isHindi ? 'भुगतान इतिहास और रसीदें' : 'Payment History & Receipts'}
            </h1>
            <p style={{ color: '#64748B', fontSize: '0.95rem', marginTop: '0.5rem', marginBlockEnd: 0, lineHeight: 1.45 }}>
              {isHindi 
                ? 'आपके आधार-लिंक्ड बैंक खाते में क्रेडिट किए गए प्रत्यक्ष एमएसपी खरीद भुगतान' 
                : 'Direct MSP procurement payments credited to your Aadhaar-linked bank account'}
            </p>
          </div>
          <div style={{ 
            background: '#FFFFFF', 
            border: '1px solid #E2E8F0',
            boxShadow: '0 4px 10px rgba(0,0,0,0.03)',
            padding: '0.8rem 1.4rem', 
            borderRadius: '16px', 
            textAlign: 'right' 
          }}>
            <div style={{ fontSize: '0.75rem', color: '#64748B', fontWeight: 700 }}>
              {isHindi ? 'कुल एमएसपी निपटान' : 'Total MSP Settled'}
            </div>
            <div style={{ fontSize: '1.5rem', fontWeight: 900, color: '#166534', marginTop: '0.1rem' }}>₹1,85,450</div>
          </div>
        </div>



        {/* Payment Records List */}
        <h3 style={{ fontSize: '1.15rem', fontWeight: 800, color: '#14532D', marginBottom: '1rem' }}>
          {isHindi ? '📜 लेनदेन विवरण' : '📜 Transaction Statements'}
        </h3>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {mockPayments.map((p) => (
            <div key={p.id} className="card" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <span className="badge-green">
                    {isHindi ? '● डीबीटी के माध्यम से भुगतान किया गया' : '● Paid via DBT'}
                  </span>
                  <span style={{ fontSize: '0.78rem', color: '#64748B' }}>{p.date}</span>
                </div>
                <div style={{ fontWeight: 800, fontSize: '1.1rem', color: '#1E293B', marginTop: '0.4rem' }}>
                  {getCropName(p.crop)} ({getQtyText(p.quantity)})
                </div>
                <div style={{ fontSize: '0.8rem', color: '#64748B', marginTop: '0.1rem' }}>
                  {isHindi ? 'केंद्र:' : 'Centre:'} {p.centre} • {isHindi ? 'संदर्भ आईडी:' : 'Ref ID:'} <strong>{p.txnId}</strong>
                </div>
              </div>

              <div style={{ textAlign: 'right' }}>
                <div style={{ fontSize: '1.3rem', fontWeight: 900, color: '#15803D' }}>
                  ₹{p.amount.toLocaleString()}
                </div>
                <button
                  type="button"
                  onClick={() => alert(`Downloading payment receipt for Txn: ${p.txnId}`)}
                  style={{
                    background: '#F0FDF4', color: '#15803D', border: '1px solid #86EFAC',
                    borderRadius: '8px', padding: '0.35rem 0.8rem', fontSize: '0.78rem',
                    fontWeight: 700, cursor: 'pointer', marginTop: '0.4rem', display: 'inline-flex', alignItems: 'center', gap: '0.3rem'
                  }}
                >
                  <Download size={13} /> {isHindi ? 'रसीद पीडीएफ' : 'Receipt PDF'}
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default PaymentHistory;
