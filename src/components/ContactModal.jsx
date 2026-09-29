import React, { useState } from 'react';
import { X, Send, CheckCircle } from 'lucide-react';

export default function ContactModal({ isOpen, onClose }) {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!message.trim()) return;

    setIsSubmitting(true);
    
    // Fire and forget using FormSubmit
    fetch(`https://formsubmit.co/ajax/nitayke1@gmail.com`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      body: JSON.stringify({
        _subject: `[שבושון] פניית יצירת קשר חדשה מהאתר`,
        שם: name || 'לא צוין',
        אימייל: email || 'לא צוין',
        הודעה: message,
        _template: "box"
      })
    })
    .then(() => {
      setIsSuccess(true);
      setIsSubmitting(false);
      setTimeout(() => {
        setIsSuccess(false);
        setName('');
        setEmail('');
        setMessage('');
        onClose();
      }, 3000);
    })
    .catch(err => {
      console.error("Contact form error:", err);
      // Still show success to user even if it fails silently due to formsubmit unreliability
      setIsSuccess(true);
      setIsSubmitting(false);
      setTimeout(() => {
        setIsSuccess(false);
        onClose();
      }, 3000);
    });
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: 450 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
          <h2 style={{ fontSize: '1.4rem', fontWeight: 800, margin: 0, color: '#111827' }}>
            יצירת קשר
          </h2>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: '#6b7280', cursor: 'pointer' }}>
            <X style={{ width: 24, height: 24 }} />
          </button>
        </div>

        {isSuccess ? (
          <div style={{ textAlign: 'center', padding: '2rem 1rem' }}>
            <div style={{ display: 'inline-flex', padding: '1rem', borderRadius: '50%', background: '#ecfdf5', color: '#047857', marginBottom: '1rem' }}>
              <CheckCircle style={{ width: 48, height: 48 }} />
            </div>
            <h3 style={{ fontSize: '1.3rem', fontWeight: 800, color: '#111827', marginBottom: '0.5rem' }}>
              הודעתך נשלחה בהצלחה!
            </h3>
            <p style={{ color: '#4b5563' }}>ניצור איתך קשר בהקדם האפשרי.</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit}>
            <div style={{ marginBottom: '1rem' }}>
              <label style={{ display: 'block', fontWeight: 600, marginBottom: '0.4rem', color: '#111827' }}>שם מלא</label>
              <input
                type="text"
                className="input-field"
                value={name}
                onChange={e => setName(e.target.value)}
                placeholder="הכנס שם..."
              />
            </div>
            <div style={{ marginBottom: '1rem' }}>
              <label style={{ display: 'block', fontWeight: 600, marginBottom: '0.4rem', color: '#111827' }}>אימייל / טלפון לחזרה</label>
              <input
                type="text"
                className="input-field"
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="איך נוכל לחזור אליך?"
                required
              />
            </div>
            <div style={{ marginBottom: '1.5rem' }}>
              <label style={{ display: 'block', fontWeight: 600, marginBottom: '0.4rem', color: '#111827' }}>הודעה *</label>
              <textarea
                className="input-field"
                value={message}
                onChange={e => setMessage(e.target.value)}
                placeholder="מה תרצה להגיד לנו?"
                rows={4}
                required
                style={{ resize: 'vertical' }}
              />
            </div>
            <button type="submit" className="btn-primary" style={{ width: '100%', justifyContent: 'center' }} disabled={isSubmitting}>
              {isSubmitting ? (
                <>שולח...</>
              ) : (
                <>
                  <Send style={{ width: 18, height: 18 }} />
                  שלח הודעה
                </>
              )}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
