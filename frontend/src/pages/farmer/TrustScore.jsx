import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { ShieldCheck, Award, TrendingUp, AlertCircle, HelpCircle } from 'lucide-react';
import { farmerService } from '../../services/api';
import { useAuth } from '../../hooks/useAuth';

const TrustScore = () => {
  const { t, i18n } = useTranslation();
  const { user } = useAuth();
  const isHindi = i18n.language === 'hi';

  const [trustData, setTrustData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;
    const fetchTrustData = async () => {
      try {
        const res = await farmerService.getTrustScore();
        if (isMounted && res.success && res.data) {
          setTrustData(res.data);
        }
      } catch (err) {
        console.error('Failed to fetch trust score data:', err);
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    fetchTrustData();
    return () => {
      isMounted = false;
    };
  }, []);

  const score = trustData?.score ?? (user?.trustScore ?? 100);
  const historyLogs = trustData?.history || [];

  const formatEvent = (event) => {
    if (!isHindi) return event;
    if (event.includes('Arrived on time')) {
      return event.replace('Arrived on time', 'समय पर पहुंचे');
    }
    if (event.includes('Absent on booked slot')) {
      return event.replace('Absent on booked slot', 'बुक स्लॉट पर अनुपस्थित');
    }
    return event;
  };

  // Determine color theme based on score value
  let circleBg = 'linear-gradient(135deg, #DCFCE7 0%, #86EFAC 100%)';
  let circleBorder = '#16A34A';
  let scoreColor = '#14532D';
  let labelColor = '#15803D';
  let shadowColor = 'rgba(34,197,94,0.25)';

  let descriptionText = "";
  let descriptionColor = '#475569'; // Darker professional slate color
  let descriptionWeight = '700';

  if (score >= 100) {
    descriptionText = "You’re a Star Farmer ⭐ Keep going!";
  } else if (score >= 80) {
    descriptionText = "Your next on-time arrival can make a difference! 🌾";
  } else if (score >= 60) {
    descriptionText = "Your Trust Score dropped a little. Be on time to improve it!";
  } else if (score <= 25) {
    descriptionText = "You are BLACKLISTED";
    descriptionColor = '#DC2626'; // Red color
    descriptionWeight = '900'; // Extra bold
  } else {
    descriptionText = "Your Trust Score is low. Arrive on time for slot bookings to improve your score.";
  }

  if (score <= 25) {
    circleBg = 'linear-gradient(135deg, #FEE2E2 0%, #FECACA 100%)';
    circleBorder = '#DC2626';
    scoreColor = '#7F1D1D';
    labelColor = '#B91C1C';
    shadowColor = 'rgba(220, 38, 38, 0.25)';
  } else if (score < 75) {
    circleBg = 'linear-gradient(135deg, #FEF3C7 0%, #FDE68A 100%)';
    circleBorder = '#D97706';
    scoreColor = '#78350F';
    labelColor = '#B45309';
    shadowColor = 'rgba(217, 119, 6, 0.25)';
  }

  return (
    <div style={{ minHeight: '100vh', background: 'linear-gradient(180deg, #F0FDF4 0%, #F8FAFC 100%)', paddingBottom: '4rem' }}>

      <div className="container" style={{ marginTop: '2rem', maxWidth: '1100px' }}>

        {/* Modern Header Title */}
        <div style={{ marginBottom: '2rem', textAlign: 'left' }}>
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
            {isHindi ? '🛡️ किसान विश्वास प्रणाली' : '🛡️ FARMER TRUST SYSTEM'}
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
            {isHindi ? 'विश्वास स्कोर डैशबोर्ड' : 'Trust Score Dashboard'}
          </h1>
        </div>

        {/* Top Card: Gauge Circle and Description Side-by-Side */}
        <div className="card" style={{ 
          display: 'flex', 
          flexDirection: 'row', 
          alignItems: 'center', 
          gap: '2.5rem', 
          flexWrap: 'wrap', 
          padding: '3rem 2.5rem', 
          background: '#FFFFFF', 
          border: '1px solid rgba(34,197,94,0.2)', 
          boxShadow: '0 15px 35px -10px rgba(21,128,61,0.15)',
          justifyContent: 'flex-start'
        }}>
          {/* Gauge Circle */}
          <div style={{
            width: 160, height: 160, borderRadius: '50%',
            background: circleBg,
            border: `6px solid ${circleBorder}`,
            display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
            margin: '0', boxShadow: `0 12px 30px ${shadowColor}`,
            flexShrink: 0
          }}>
            <div style={{ fontSize: '3rem', fontWeight: 900, color: scoreColor, lineHeight: 1 }}>{score}</div>
            <div style={{ fontSize: '0.72rem', fontWeight: 700, color: labelColor, letterSpacing: '0.05em', marginTop: '0.2rem' }}>
              {isHindi ? 'विश्वास स्कोर' : 'TRUST SCORE'}
            </div>
          </div>

          {/* Dynamic Message Description */}
          <div style={{ flex: 1, minWidth: '300px', textAlign: 'left' }}>
            <p style={{ color: descriptionColor, fontSize: '1.65rem', margin: 0, lineHeight: 1.35, fontWeight: descriptionWeight }}>
              {descriptionText}
            </p>
            <p style={{ color: '#64748B', fontSize: '0.95rem', marginTop: '0.75rem', marginBlockEnd: 0, lineHeight: 1.5 }}>
              {isHindi 
                ? 'सभी किसानों का प्रारंभिक विश्वास स्कोर 100 होता है। बुक किए गए स्लॉट के लिए समय पर आने पर अंक मिलते हैं, जबकि अनुपस्थित होने पर यह घट जाता है। 25 या उससे कम स्कोर होने पर सामान्य बुकिंग प्रतिबंधित कर दी जाती है।' 
                : 'All farmers start with a default Trust Score of 100. Timely arrivals for booked slots earn points, while absents decrease it. Scores of 25 or below blacklist users from general bookings.'}
            </p>
          </div>
        </div>

        {/* Breakdown Stats Grid */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
          gap: '1.25rem',
          marginTop: '1.75rem',
          marginBottom: '0.25rem'
        }}>
          <div style={{ background: '#FFFFFF', padding: '1.25rem 1.5rem', borderRadius: '16px', border: '1px solid #E2E8F0', boxShadow: '0 4px 12px rgba(0,0,0,0.03)' }}>
            <div style={{ fontSize: '0.8rem', fontWeight: 700, color: '#64748B', textTransform: 'uppercase' }}>
              {isHindi ? 'कुल बुकिंग' : 'Total Bookings'}
            </div>
            <div style={{ fontSize: '1.8rem', fontWeight: 900, color: '#1E293B', marginTop: '0.25rem' }}>
              {trustData?.totalBookings ?? 0}
            </div>
          </div>

          <div style={{ background: '#FFFFFF', padding: '1.25rem 1.5rem', borderRadius: '16px', border: '1px solid #E2E8F0', boxShadow: '0 4px 12px rgba(0,0,0,0.03)' }}>
            <div style={{ fontSize: '0.8rem', fontWeight: 700, color: '#166534', textTransform: 'uppercase' }}>
              {isHindi ? 'पूर्ण स्लॉट' : 'Completed Slots'}
            </div>
            <div style={{ fontSize: '1.8rem', fontWeight: 900, color: '#15803D', marginTop: '0.25rem' }}>
              {trustData?.completedBookings ?? 0}
            </div>
          </div>

          <div style={{ background: '#FFFFFF', padding: '1.25rem 1.5rem', borderRadius: '16px', border: '1px solid #E2E8F0', boxShadow: '0 4px 12px rgba(0,0,0,0.03)' }}>
            <div style={{ fontSize: '0.8rem', fontWeight: 700, color: '#0369A1', textTransform: 'uppercase' }}>
              {isHindi ? 'समय पर दर' : 'On-Time Rate'}
            </div>
            <div style={{ fontSize: '1.8rem', fontWeight: 900, color: '#0284C7', marginTop: '0.25rem' }}>
              {trustData?.onTimeRate ?? 100}%
            </div>
          </div>

          <div style={{ background: '#FFFFFF', padding: '1.25rem 1.5rem', borderRadius: '16px', border: '1px solid #E2E8F0', boxShadow: '0 4px 12px rgba(0,0,0,0.03)' }}>
            <div style={{ fontSize: '0.8rem', fontWeight: 700, color: '#991B1B', textTransform: 'uppercase' }}>
              {isHindi ? 'अनुपस्थिति दर' : 'No-Show Rate'}
            </div>
            <div style={{ fontSize: '1.8rem', fontWeight: 900, color: '#DC2626', marginTop: '0.25rem' }}>
              {trustData?.noShowRate ?? 0}%
            </div>
          </div>
        </div>

        {/* Bottom Split Row (History Log on Left, Guidelines on Right) */}
        <div style={{ 
          display: 'grid', 
          gridTemplateColumns: 'repeat(auto-fit, minmax(380px, 1fr))', 
          gap: '2rem', 
          marginTop: '2rem' 
        }}>
          {/* 1. History Log Card (Left Column) */}
          <div className="card" style={{ 
            padding: '2.5rem 2.25rem', 
            background: '#FFFFFF', 
            border: '1px solid rgba(34,197,94,0.18)', 
            boxShadow: '0 10px 25px -5px rgba(21,128,61,0.08)',
            margin: 0
          }}>
            <h3 style={{ 
              fontSize: '1.3rem', 
              fontWeight: 800, 
              color: '#14532D', 
              marginBottom: '1.5rem', 
              display: 'flex', 
              alignItems: 'center', 
              gap: '0.5rem',
              borderBottom: '1px solid #F1F5F9',
              paddingBottom: '0.75rem'
            }}>
              <span>🔄</span> {isHindi ? 'विश्वास स्कोर इतिहास लॉग' : 'Trust Score History Log'}
            </h3>

            {loading ? (
              <div style={{ padding: '2rem', textAlign: 'center', color: '#64748B' }}>
                {isHindi ? 'स्कोर इतिहास लोड हो रहा है...' : 'Loading trust history...'}
              </div>
            ) : historyLogs.length === 0 ? (
              <div style={{
                textAlign: 'center',
                padding: '2.5rem 1.25rem',
                background: '#F8FAFC',
                borderRadius: '16px',
                border: '1px solid #E2E8F0',
                color: '#64748B'
              }}>
                <div style={{ fontSize: '2.2rem', marginBottom: '0.5rem' }}>📜</div>
                <div style={{ fontWeight: 800, fontSize: '1rem', color: '#334155', marginBottom: '0.3rem' }}>
                  {isHindi ? 'कोई स्कोर इतिहास दर्ज नहीं है' : 'No Trust Score History Yet'}
                </div>
                <div style={{ fontSize: '0.85rem', color: '#64748B', lineHeight: 1.45 }}>
                  {isHindi
                    ? 'आपके द्वारा स्लॉट पर पहुंचने या अनुपस्थित रहने पर आपका रियल-टाइम स्कोर इतिहास यहां दिखाई देगा।'
                    : 'Your score history will update here automatically as you complete or miss your booked procurement slots.'}
                </div>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                {historyLogs.map((log, i) => {
                  const pointsStr = typeof log.points === 'number'
                    ? (log.points >= 0 ? `+${log.points}` : `${log.points}`)
                    : String(log.points);
                  const isPositive = !pointsStr.startsWith('-');

                  return (
                    <div key={log.id || i} style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      padding: '1rem 1.25rem',
                      borderRadius: '14px',
                      background: '#F8FAFC',
                      border: '1px solid #E2E8F0',
                    }}>
                      <div>
                        <div style={{ fontWeight: 700, fontSize: '0.95rem', color: '#1E293B', lineHeight: 1.35 }}>
                          {formatEvent(log.event)}
                        </div>
                        <div style={{ fontSize: '0.8rem', color: '#64748B', marginTop: '0.25rem' }}>
                          {isHindi ? 'दिनांक' : 'Date'}: {log.date}
                        </div>
                      </div>

                      <div style={{
                        fontWeight: 800,
                        fontSize: '0.95rem',
                        padding: '6px 12px',
                        borderRadius: '10px',
                        color: isPositive ? '#166534' : '#991B1B',
                        background: isPositive ? '#DCFCE7' : '#FEE2E2',
                        border: `1px solid ${isPositive ? '#BBF7D0' : '#FCA5A5'}`,
                        flexShrink: 0
                      }}>
                        {pointsStr}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* 2. Guidelines & Rules Card (Right Column) */}
          <div className="card" style={{ 
            padding: '2.5rem 2.25rem', 
            background: '#FFFFFF', 
            border: '1px solid rgba(34,197,94,0.18)', 
            boxShadow: '0 10px 25px -5px rgba(21,128,61,0.08)',
            margin: 0
          }}>
            <h3 style={{ 
              fontSize: '1.3rem', 
              fontWeight: 800, 
              color: '#14532D', 
              marginBottom: '1.5rem', 
              display: 'flex', 
              alignItems: 'center', 
              gap: '0.5rem',
              borderBottom: '1px solid #F1F5F9',
              paddingBottom: '0.75rem'
            }}>
              <span>📋</span> {isHindi ? 'विश्वास स्कोर दिशानिर्देश और नियम' : 'Trust Score Guidelines & Rules'}
            </h3>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              <div style={{ display: 'flex', gap: '1rem', alignItems: 'flex-start' }}>
                <span style={{ 
                  background: '#DCFCE7', 
                  color: '#15803D', 
                  borderRadius: '50%', 
                  width: '28px', 
                  height: '28px', 
                  display: 'flex', 
                  alignItems: 'center', 
                  justifyContent: 'center', 
                  fontWeight: 700, 
                  fontSize: '0.9rem',
                  flexShrink: 0
                }}>1</span>
                <p style={{ margin: 0, fontSize: '0.95rem', color: '#334155', lineHeight: 1.5 }}>
                  <strong>{isHindi ? 'समय पर आगमन:' : 'On-time Arrival:'}</strong>{' '}
                  {isHindi 
                    ? 'यदि कोई व्यक्ति समय पर पहुंचता है, तो विश्वास स्कोर 10 बढ़ जाएगा।' 
                    : 'If a Person arrives on time, Trust score will increase by 10.'}
                </p>
              </div>

              <div style={{ display: 'flex', gap: '1rem', alignItems: 'flex-start' }}>
                <span style={{ 
                  background: '#FEE2E2', 
                  color: '#EF4444', 
                  borderRadius: '50%', 
                  width: '28px', 
                  height: '28px', 
                  display: 'flex', 
                  alignItems: 'center', 
                  justifyContent: 'center', 
                  fontWeight: 700, 
                  fontSize: '0.95rem',
                  flexShrink: 0
                }}>2</span>
                <p style={{ margin: 0, fontSize: '0.95rem', color: '#334155', lineHeight: 1.5 }}>
                  <strong>{isHindi ? 'अनुपस्थिति:' : 'Absenteeism:'}</strong>{' '}
                  {isHindi 
                    ? 'यदि कोई व्यक्ति स्लॉट बुकिंग के दिन अनुपस्थित रहता है, तो उनका विश्वास स्कोर 25 घट जाएगा।' 
                    : 'If a Person absent on the day of slot booked, their trust score will decrease by 25.'}
                </p>
              </div>

              <div style={{ display: 'flex', gap: '1rem', alignItems: 'flex-start' }}>
                <span style={{ 
                  background: '#FEF3C7', 
                  color: '#D97706', 
                  borderRadius: '50%', 
                  width: '28px', 
                  height: '28px', 
                  display: 'flex', 
                  alignItems: 'center', 
                  justifyContent: 'center', 
                  fontWeight: 700, 
                  fontSize: '0.95rem',
                  flexShrink: 0
                }}>3</span>
                <p style={{ margin: 0, fontSize: '0.95rem', color: '#334155', lineHeight: 1.5 }}>
                  <strong>{isHindi ? 'ब्लैकलिस्ट नीति:' : 'Blacklist Policy:'}</strong>{' '}
                  {isHindi 
                    ? 'यदि किसी किसान का विश्वास स्कोर 25 या उससे कम है तो उन्हें आगे की स्लॉट बुकिंग के लिए ब्लैकलिस्ट कर दिया जाएगा। और फिर उन्हें केवल दिन का अंतिम स्लॉट (यदि उपलब्ध हो) मिलेगा।' 
                    : 'If a farmer\'s trust score is less than or equal to 25 then he/she will be blacklisted for further Slot Bookings. And then they will get only last slot of the day if available.'}
                </p>
              </div>

              <div style={{ display: 'flex', gap: '1rem', alignItems: 'flex-start' }}>
                <span style={{ 
                  background: '#F1F5F9', 
                  color: '#64748B', 
                  borderRadius: '50%', 
                  width: '28px', 
                  height: '28px', 
                  display: 'flex', 
                  alignItems: 'center', 
                  justifyContent: 'center', 
                  fontWeight: 700, 
                  fontSize: '0.95rem',
                  flexShrink: 0
                }}>4</span>
                <p style={{ margin: 0, fontSize: '0.95rem', color: '#334155', lineHeight: 1.5 }}>
                  <strong>{isHindi ? 'अंतिम स्लॉट की सीमाएं:' : 'Last Slot Limits:'}</strong>{' '}
                  {isHindi 
                    ? 'प्रतिदिन केवल दो ब्लैकलिस्टेड किसानों को ही अंतिम स्लॉट मिलेगा।' 
                    : 'Only two blacklisted Farmer\'s got the last slot per day.'}
                </p>
              </div>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
};

export default TrustScore;
