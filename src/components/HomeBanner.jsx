import React, { useEffect, useState } from 'react';
import { Globe, Phone } from 'lucide-react';
import { bannerStatus, websiteUrl } from '../listing';
import { getManagerContactDB, whatsappUrl, telUrl, contactMessage } from '../manager';
import { REGION_TRANSLATIONS, TYPE_TRANSLATIONS } from '../knn';
import WhatsAppIcon from './WhatsAppIcon';
import BannerArt from './BannerArt';

// The paid main banner, at the bottom of the home page. Shows whoever holds the current booking.
export default function HomeBanner({ yeshivotList }) {
  const current = bannerStatus(yeshivotList || []).current;
  const yeshiva = current ? (yeshivotList || []).find(y => y.id === current.yeshivaId) : null;
  const [contact, setContact] = useState(null);

  useEffect(() => {
    if (!yeshiva) return;
    let cancelled = false;
    getManagerContactDB(yeshiva.id)
      .then(c => { if (!cancelled) setContact(c); })
      .catch(err => console.error('Banner contact load error:', err));
    return () => { cancelled = true; };
  }, [yeshiva?.id]);

  if (!yeshiva) return null;
  const site = websiteUrl(yeshiva.website);
  const meta = [TYPE_TRANSLATIONS[yeshiva.type], REGION_TRANSLATIONS[yeshiva.region]].filter(Boolean).join(' · ');

  return (
    <div className="home-banner fade-in">
      <BannerArt id="home-banner" />
      <div className="home-banner-body">
        {yeshiva.banner_text && <div className="home-banner-kicker">{yeshiva.banner_text}</div>}
        <div className="home-banner-name">{yeshiva.name}</div>
        {meta && <div className="home-banner-meta">{meta}</div>}
        {(site || contact?.phone) && (
          <div className="home-banner-actions">
            {site && (
              <a href={site} target="_blank" rel="noopener noreferrer" className="home-banner-btn primary">
                <Globe style={{ width: 16, height: 16 }} />
                לפרטים והרשמה
              </a>
            )}
            {contact?.phone && (contact.hasWhatsapp ? (
              <a href={whatsappUrl(contact.phone, contactMessage(contact.name))} target="_blank" rel="noopener noreferrer" className="home-banner-btn">
                <WhatsAppIcon size={16} />
                ווצאפ
              </a>
            ) : (
              <a href={telUrl(contact.phone)} className="home-banner-btn">
                <Phone style={{ width: 16, height: 16 }} />
                טלפון
              </a>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
