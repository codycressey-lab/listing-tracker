import React, { useState, useEffect, useRef } from 'react';
import { supabase } from './supabaseClient';
import './App.css';

// ─── Constants ───────────────────────────────────────────────────────────────

const STATUSES = ['rehabbing', 'preparing', 'listed', 'pending', 'sold'];
const SLABELS = {
  rehabbing: 'Rehabbing',
  preparing: 'Prep for Listing',
  listed: 'Listed',
  pending: 'Pending',
  sold: 'Sold',
};
const SC = {
  rehabbing: { bg: '#fff3e0', tx: '#7a3f0a' },
  preparing: { bg: '#e3f2fd', tx: '#1a3a5c' },
  listed: { bg: '#f3e5f5', tx: '#4a1060' },
  pending: { bg: '#e8f5e9', tx: '#1a4d2a' },
  sold: { bg: '#f0f0f0', tx: '#444' },
};
const EMOJIS = ['❤️', '👍', '✅', '🔥', '👀'];

const DC = {
  rehabbing: ['Target completion date'],
  preparing: [
    'Yard & landscaping presentable for listing',
    'Final walkthrough with contractor',
    'Final clean scheduled',
    'Final clean done',
    'Staging scheduled',
    'Staging done',
    'Photos scheduled',
    'Photos done',
    'Listing go-live target date',
  ],
  listed: [
    'MLS live',
    'Lockbox installed',
    'Sign out front',
    'BYHB lockbox still on site (location in notes)',
  ],
  pending: [
    'Offer accepted',
    'Inspection scheduled',
    'Inspection complete',
    'Appraisal scheduled',
    'Appraisal complete',
    '35R working with BYHB',
    'Clear to close',
    'Close target date',
  ],
  sold: ['Closed'],
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

function isOverdue(dateStr) {
  if (!dateStr) return false;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return new Date(dateStr) < today;
}

function isDueSoon(dateStr) {
  if (!dateStr) return false;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const due = new Date(dateStr);
  const diff = (due - today) / (1000 * 60 * 60 * 24);
  return diff >= 0 && diff <= 3;
}

function formatDate(dateStr) {
  if (!dateStr) return '';
  return new Date(dateStr + 'T00:00:00').toLocaleDateString('en-US', {
    month: 'short', day: 'numeric',
  });
}

async function sendSMS(to, message) {
  if (!to) return;
  try {
    await supabase.functions.invoke('send-sms', { body: { to, message } });
  } catch (err) {
    console.error('SMS error:', err);
  }
}

// ─── Auth Screen ──────────────────────────────────────────────────────────────

function AuthScreen({ onAuth }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [mode, setMode] = useState('login'); // 'login' | 'reset'
  const [error, setError] = useState('');
  const [info, setInfo] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleLogin(e) {
    e.preventDefault();
    setError(''); setInfo('');
    setLoading(true);
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    setLoading(false);
    if (error) return setError(error.message);
    onAuth(data.session);
  }

  async function handleReset(e) {
    e.preventDefault();
    setError(''); setInfo('');
    setLoading(true);
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: window.location.origin,
    });
    setLoading(false);
    if (error) return setError(error.message);
    setInfo('Check your email for a reset link.');
  }

  const inp = {
    width: '100%', padding: '10px 12px', borderRadius: 8, border: '1.5px solid #e0e0e0',
    fontSize: 14, boxSizing: 'border-box', fontFamily: 'system-ui', outline: 'none', marginBottom: 12,
  };

  return (
    <div style={{ minHeight: '100vh', background: '#f0ede8', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ background: 'white', borderRadius: 14, padding: 32, width: 360, boxShadow: '0 4px 24px rgba(0,0,0,0.08)' }}>
        <div style={{ marginBottom: 24, textAlign: 'center' }}>
          <div style={{ fontSize: 20, fontWeight: 700, color: '#1a2744' }}>Backyard Home Buyers</div>
          <div style={{ fontSize: 12, color: '#aaa', marginTop: 4 }}>
            {mode === 'login' ? 'Sign in to your account' : 'Reset your password'}
          </div>
        </div>

        {error && (
          <div style={{ background: '#fff5f5', border: '1px solid #ffcdd2', borderRadius: 8, padding: '8px 12px', fontSize: 12, color: '#c62828', marginBottom: 14 }}>
            {error}
          </div>
        )}
        {info && (
          <div style={{ background: '#e8f5e9', border: '1px solid #c8e6c9', borderRadius: 8, padding: '8px 12px', fontSize: 12, color: '#2e7d32', marginBottom: 14 }}>
            {info}
          </div>
        )}

        <form onSubmit={mode === 'login' ? handleLogin : handleReset}>
          <input
            type="email" placeholder="Email" value={email}
            onChange={e => setEmail(e.target.value)} style={inp} required
          />
          {mode === 'login' && (
            <input
              type="password" placeholder="Password" value={password}
              onChange={e => setPassword(e.target.value)} style={inp} required
            />
          )}
          <button
            type="submit" disabled={loading}
            style={{ width: '100%', padding: '10px 0', borderRadius: 8, border: 'none', background: '#1a2744', color: 'white', fontSize: 14, fontWeight: 600, cursor: loading ? 'not-allowed' : 'pointer', opacity: loading ? 0.7 : 1 }}
          >
            {loading ? '...' : mode === 'login' ? 'Sign In' : 'Send Reset Link'}
          </button>
        </form>

        <div style={{ textAlign: 'center', marginTop: 14 }}>
          <button
            onClick={() => { setMode(mode === 'login' ? 'reset' : 'login'); setError(''); setInfo(''); }}
            style={{ background: 'none', border: 'none', fontSize: 12, color: '#1a2744', cursor: 'pointer', textDecoration: 'underline' }}
          >
            {mode === 'login' ? 'Forgot password?' : 'Back to sign in'}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── @ Mention Textarea ───────────────────────────────────────────────────────

function MentionTextarea({ value, onChange, profiles, placeholder, style }) {
  const [mentionOpen, setMentionOpen] = useState(false);
  const [mentionSearch, setMentionSearch] = useState('');
  const [mentionStart, setMentionStart] = useState(-1);
  const ref = useRef(null);

  function handleKey(e) {
    const v = e.target.value;
    const cursor = e.target.selectionStart;

    // Detect @ trigger
    if (e.key === '@' || (v[cursor - 1] === '@')) {
      setMentionStart(cursor);
      setMentionSearch('');
      setMentionOpen(true);
    }

    if (mentionOpen) {
      if (e.key === 'Escape') { setMentionOpen(false); return; }
    }
  }

  function handleChange(e) {
    const v = e.target.value;
    const cursor = e.target.selectionStart;
    onChange(e);

    // If we're in a mention, update search
    if (mentionOpen && mentionStart >= 0) {
      const after = v.slice(mentionStart, cursor);
      if (!after.startsWith('@') || after.includes(' ')) {
        setMentionOpen(false);
      } else {
        setMentionSearch(after.slice(1).toLowerCase());
      }
    }

    // Detect new @ typed
    const lastAt = v.lastIndexOf('@', cursor - 1);
    if (lastAt >= 0 && lastAt === cursor - 1) {
      setMentionStart(lastAt + 1);
      setMentionSearch('');
      setMentionOpen(true);
    }
  }

  function pickMention(profile) {
    const before = value.slice(0, mentionStart - 1);
    const after = value.slice(mentionStart + mentionSearch.length);
    const inserted = `@${profile.name} `;
    onChange({ target: { value: before + inserted + after } });
    setMentionOpen(false);
    setTimeout(() => ref.current?.focus(), 0);
  }

  const filtered = profiles.filter(p =>
    p.name.toLowerCase().includes(mentionSearch) ||
    p.initials?.toLowerCase().includes(mentionSearch)
  );

  return (
    <div style={{ position: 'relative' }}>
      <textarea
        ref={ref}
        value={value}
        onChange={handleChange}
        onKeyUp={handleKey}
        placeholder={placeholder}
        style={style}
      />
      {mentionOpen && filtered.length > 0 && (
        <div style={{
          position: 'absolute', bottom: '100%', left: 0, right: 0, marginBottom: 4,
          background: 'white', border: '1px solid #e0e0e0', borderRadius: 8,
          boxShadow: '0 4px 12px rgba(0,0,0,0.1)', overflow: 'hidden', zIndex: 50,
        }}>
          {filtered.map(p => (
            <div
              key={p.id}
              onMouseDown={() => pickMention(p)}
              style={{
                padding: '8px 12px', display: 'flex', alignItems: 'center', gap: 8,
                cursor: 'pointer', fontSize: 12,
              }}
              onMouseEnter={e => e.currentTarget.style.background = '#f5f5f5'}
              onMouseLeave={e => e.currentTarget.style.background = 'none'}
            >
              <div style={{
                width: 22, height: 22, borderRadius: '50%', background: '#1a2744',
                color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 8, fontWeight: 700, flexShrink: 0,
              }}>{p.initials}</div>
              <div>
                <div style={{ fontWeight: 600, color: '#333' }}>{p.name}</div>
                <div style={{ fontSize: 10, color: '#aaa' }}>{p.company}</div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Note Item ────────────────────────────────────────────────────────────────

function NoteItem({ n, noteReactions, profiles, onToggleReaction, onEditNote, onDeleteNote, currentUser }) {
  const [hovered, setHovered] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [editing, setEditing] = useState(false);
  const [editText, setEditText] = useState(n.body);
  const menuRef = useRef(null);

  useEffect(() => {
    function handleClick(e) {
      if (menuRef.current && !menuRef.current.contains(e.target)) setMenuOpen(false);
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  const isOwner = n.author_id === currentUser?.id;
  const authorProfile = profiles.find(p => p.id === n.author_id);

  const grouped = {};
  EMOJIS.forEach(e => { grouped[e] = noteReactions.filter(r => r.emoji === e); });
  const activeEmojis = EMOJIS.filter(e => grouped[e].length > 0);

  // Render body with highlighted @mentions
  function renderBody(text) {
    if (!text) return null;
    let result = [text];
    profiles.forEach(p => {
      const tag = '@' + p.name;
      result = result.flatMap(part => {
        if (typeof part !== 'string') return [part];
        const segments = part.split(tag);
        return segments.flatMap((seg, i) => {
          if (i === segments.length - 1) return [seg];
          return [seg, <span key={p.id + i} style={{ color: '#1a2744', fontWeight: 600, background: '#e3f2fd', borderRadius: 4, padding: '0 3px' }}>{tag}</span>];
        });
      });
    });
    return result;
  }

  return (
    <div
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => { setHovered(false); setMenuOpen(false); }}
      style={{ marginBottom: 12, background: '#fafafa', borderRadius: 9, padding: 10, border: '1px solid #f0f0f0', position: 'relative' }}
    >
      {hovered && !editing && (
        <div style={{ position: 'absolute', top: -14, right: 8, display: 'flex', alignItems: 'center', gap: 3, background: 'white', border: '1px solid #e5e5e5', borderRadius: 20, padding: '3px 6px', boxShadow: '0 2px 8px rgba(0,0,0,0.08)', zIndex: 10 }}>
          {EMOJIS.map(emoji => (
            <button key={emoji} onClick={() => onToggleReaction(n.id, emoji)}
              style={{ background: 'none', border: 'none', fontSize: 13, cursor: 'pointer', padding: '1px 2px', borderRadius: 4, lineHeight: 1 }}
              onMouseEnter={e => e.target.style.background = '#f0f0f0'}
              onMouseLeave={e => e.target.style.background = 'none'}
            >{emoji}</button>
          ))}
          {isOwner && (
            <div ref={menuRef} style={{ position: 'relative', borderLeft: '1px solid #eee', marginLeft: 2, paddingLeft: 2 }}>
              <button onClick={() => setMenuOpen(!menuOpen)}
                style={{ background: 'none', border: 'none', fontSize: 12, cursor: 'pointer', padding: '1px 5px', borderRadius: 4, color: '#888', lineHeight: 1 }}
                onMouseEnter={e => e.target.style.background = '#f0f0f0'}
                onMouseLeave={e => e.target.style.background = 'none'}
              >✎</button>
              {menuOpen && (
                <div style={{ position: 'absolute', top: 'calc(100% + 4px)', right: 0, background: 'white', border: '1px solid #e5e5e5', borderRadius: 8, boxShadow: '0 4px 12px rgba(0,0,0,0.1)', overflow: 'hidden', minWidth: 130, zIndex: 20 }}>
                  <button onClick={() => { setEditing(true); setMenuOpen(false); }}
                    style={{ display: 'block', width: '100%', padding: '8px 14px', fontSize: 12, background: 'none', border: 'none', cursor: 'pointer', textAlign: 'left', color: '#333' }}
                    onMouseEnter={e => e.target.style.background = '#f5f5f5'}
                    onMouseLeave={e => e.target.style.background = 'none'}
                  >Edit message</button>
                  <button onClick={() => { if (window.confirm('Delete this note?')) onDeleteNote(n.id); }}
                    style={{ display: 'block', width: '100%', padding: '8px 14px', fontSize: 12, background: 'none', border: 'none', cursor: 'pointer', textAlign: 'left', color: '#c62828' }}
                    onMouseEnter={e => e.target.style.background = '#fff5f5'}
                    onMouseLeave={e => e.target.style.background = 'none'}
                  >Delete message</button>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      <div style={{ display: 'flex', alignItems: 'center', gap: 7, marginBottom: 5 }}>
        <div style={{ width: 24, height: 24, borderRadius: '50%', background: '#1a2744', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 9, fontWeight: 700, flexShrink: 0, overflow: 'hidden' }}>
          {authorProfile?.avatar_url
            ? <img src={authorProfile.avatar_url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            : authorProfile?.initials || '??'
          }
        </div>
        <div>
          <div style={{ fontSize: 11, fontWeight: 600, color: '#333' }}>{authorProfile?.name || 'Unknown'}</div>
          <div style={{ fontSize: 9, color: '#aaa' }}>{new Date(n.created_at).toLocaleDateString()}</div>
        </div>
      </div>

      {editing ? (
        <div>
          <textarea value={editText} onChange={e => setEditText(e.target.value)}
            style={{ width: '100%', padding: '7px 9px', borderRadius: 7, border: '1px solid #e0e0e0', fontSize: 12, resize: 'none', height: 60, fontFamily: 'system-ui', outline: 'none', boxSizing: 'border-box' }}
          />
          <div style={{ display: 'flex', gap: 5, justifyContent: 'flex-end', marginTop: 5 }}>
            <button onClick={() => { setEditing(false); setEditText(n.body); }}
              style={{ padding: '4px 10px', borderRadius: 6, border: '1px solid #ddd', background: 'white', fontSize: 11, cursor: 'pointer' }}>Cancel</button>
            <button onClick={() => { onEditNote(n.id, editText); setEditing(false); }}
              style={{ padding: '4px 10px', borderRadius: 6, border: 'none', background: '#1a2744', color: 'white', fontSize: 11, cursor: 'pointer' }}>Save</button>
          </div>
        </div>
      ) : (
        <div style={{ fontSize: 12, color: '#333', lineHeight: 1.5 }}>{renderBody(n.body)}</div>
      )}

      {activeEmojis.length > 0 && (
        <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap', marginTop: 7 }}>
          {activeEmojis.map(emoji => {
            const users = grouped[emoji];
            const mine = users.some(r => r.author_id === currentUser?.id);
            const names = users.map(r => profiles.find(p => p.id === r.author_id)?.name || r.author_id).join(', ');
            return (
              <button key={emoji} onClick={() => onToggleReaction(n.id, emoji)} title={names}
                style={{ background: mine ? '#e3f2fd' : 'white', border: mine ? '1px solid #b0d4f0' : '1px solid #eee', borderRadius: 20, padding: '2px 6px', fontSize: 11, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 2 }}
              >
                {emoji}{users.length > 1 && <span style={{ fontSize: 10, fontWeight: 600, color: '#555' }}>{users.length}</span>}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ─── Phone formatting helper ──────────────────────────────────────────────────

function formatPhone(raw) {
  // Strip everything except digits
  const digits = raw.replace(/\D/g, '');
  // If they typed 10 digits, prepend +1
  if (digits.length === 10) return '+1' + digits;
  // If they typed 11 digits starting with 1, format as +1XXXXXXXXXX
  if (digits.length === 11 && digits.startsWith('1')) return '+' + digits;
  // If they already included +, keep as-is but ensure + prefix
  if (raw.trim().startsWith('+')) return '+' + digits;
  // Otherwise just prepend +1 to whatever they typed
  return digits ? '+1' + digits : '';
}

// ─── Avatar Upload helper ─────────────────────────────────────────────────────

async function uploadAvatar(userId, file) {
  const ext = file.name.split('.').pop();
  const path = `avatars/${userId}.${ext}`;
  const { error } = await supabase.storage.from('avatars').upload(path, file, { upsert: true });
  if (error) return null;
  const { data } = supabase.storage.from('avatars').getPublicUrl(path);
  return data.publicUrl;
}

// ─── Profile Setup Modal ──────────────────────────────────────────────────────

function ProfileSetup({ user, onComplete }) {
  const [name, setName] = useState('');
  const [initials, setInitials] = useState('');
  const [phone, setPhone] = useState('');
  const [company, setCompany] = useState('');
  const [avatarFile, setAvatarFile] = useState(null);
  const [avatarPreview, setAvatarPreview] = useState(null);
  const [saving, setSaving] = useState(false);
  const [phoneError, setPhoneError] = useState('');
  const fileRef = useRef(null);

  function handlePhoneChange(e) {
    setPhone(e.target.value);
    setPhoneError('');
  }

  function handleAvatarChange(e) {
    const file = e.target.files[0];
    if (!file) return;
    setAvatarFile(file);
    setAvatarPreview(URL.createObjectURL(file));
  }

  async function save() {
    if (!name.trim() || !initials.trim()) return;
    const formattedPhone = formatPhone(phone);
    if (phone.trim() && !formattedPhone.match(/^\+1\d{10}$/)) {
      setPhoneError('Enter a 10-digit US number e.g. 5095551234');
      return;
    }
    setSaving(true);
    let avatar_url = null;
    if (avatarFile) avatar_url = await uploadAvatar(user.id, avatarFile);
    await supabase.from('profiles').upsert({
      id: user.id,
      name: name.trim(),
      initials: initials.trim().toUpperCase().slice(0, 3),
      phone: formattedPhone,
      company: company.trim(),
      ...(avatar_url && { avatar_url }),
    });
    setSaving(false);
    onComplete();
  }

  const inp = { width: '100%', padding: '9px 12px', borderRadius: 8, border: '1px solid #ddd', marginBottom: 10, fontSize: 14, boxSizing: 'border-box', fontFamily: 'system-ui' };
  const lbl = { fontSize: 11, fontWeight: 600, color: '#888', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 5, display: 'block' };

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', zIndex: 200, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ background: 'white', borderRadius: 14, padding: 28, width: 400, maxHeight: '90vh', overflowY: 'auto' }}>
        <h2 style={{ fontSize: 16, fontWeight: 700, marginBottom: 6 }}>Set up your profile</h2>
        <p style={{ fontSize: 12, color: '#aaa', marginBottom: 20 }}>This is how you'll appear to your team.</p>

        {/* Avatar picker */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 20 }}>
          <div
            onClick={() => fileRef.current?.click()}
            style={{ width: 64, height: 64, borderRadius: '50%', background: avatarPreview ? 'transparent' : '#e8eaf0', border: '2px dashed #ccc', cursor: 'pointer', overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}
          >
            {avatarPreview
              ? <img src={avatarPreview} alt="avatar" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              : <span style={{ fontSize: 22 }}>📷</span>
            }
          </div>
          <div>
            <div style={{ fontSize: 13, fontWeight: 600, color: '#333', marginBottom: 3 }}>Profile photo</div>
            <button onClick={() => fileRef.current?.click()} style={{ fontSize: 12, color: '#1a2744', background: 'none', border: '1px solid #ddd', borderRadius: 6, padding: '4px 10px', cursor: 'pointer' }}>
              {avatarPreview ? 'Change photo' : 'Upload photo'}
            </button>
            <input ref={fileRef} type="file" accept="image/*" onChange={handleAvatarChange} style={{ display: 'none' }} />
          </div>
        </div>

        <label style={lbl}>Full name</label>
        <input value={name} onChange={e => setName(e.target.value)} placeholder="Cody Cressey" style={inp} />
        <label style={lbl}>Initials (2–3 chars)</label>
        <input value={initials} onChange={e => setInitials(e.target.value)} placeholder="CC" maxLength={3} style={inp} />
        <label style={lbl}>Phone number (for SMS alerts)</label>
        <input value={phone} onChange={handlePhoneChange} placeholder="5095551234 or +15095551234" style={{ ...inp, borderColor: phoneError ? '#e57373' : '#ddd' }} />
        {phoneError && <div style={{ fontSize: 11, color: '#e57373', marginTop: -8, marginBottom: 10 }}>{phoneError}</div>}
        <div style={{ fontSize: 11, color: '#aaa', marginTop: -6, marginBottom: 10 }}>US numbers only. We'll add +1 automatically.</div>
        <label style={lbl}>Company</label>
        <input value={company} onChange={e => setCompany(e.target.value)} placeholder="Backyard Home Buyers" style={inp} />
        <button onClick={save} disabled={saving}
          style={{ width: '100%', padding: '10px 0', borderRadius: 8, border: 'none', background: '#1a2744', color: 'white', fontWeight: 600, fontSize: 14, cursor: 'pointer', marginTop: 4 }}>
          {saving ? 'Saving...' : 'Save & continue'}
        </button>
      </div>
    </div>
  );
}

// ─── Edit Profile Modal ───────────────────────────────────────────────────────

function EditProfileModal({ profile, user, onClose, onSave }) {
  const [name, setName] = useState(profile.name || '');
  const [initials, setInitials] = useState(profile.initials || '');
  const [phone, setPhone] = useState(profile.phone || '');
  const [company, setCompany] = useState(profile.company || '');
  const [avatarFile, setAvatarFile] = useState(null);
  const [avatarPreview, setAvatarPreview] = useState(profile.avatar_url || null);
  const [saving, setSaving] = useState(false);
  const [phoneError, setPhoneError] = useState('');
  const fileRef = useRef(null);

  function handleAvatarChange(e) {
    const file = e.target.files[0];
    if (!file) return;
    setAvatarFile(file);
    setAvatarPreview(URL.createObjectURL(file));
  }

  async function save() {
    if (!name.trim()) return;
    const formattedPhone = formatPhone(phone);
    if (phone.trim() && !formattedPhone.match(/^\+1\d{10}$/)) {
      setPhoneError('Enter a 10-digit US number e.g. 5095551234');
      return;
    }
    setSaving(true);
    let avatar_url = profile.avatar_url;
    if (avatarFile) avatar_url = await uploadAvatar(user.id, avatarFile);
    await supabase.from('profiles').update({
      name: name.trim(),
      initials: initials.trim().toUpperCase().slice(0, 3),
      phone: formattedPhone,
      company: company.trim(),
      avatar_url,
    }).eq('id', user.id);
    setSaving(false);
    onSave();
    onClose();
  }

  const inp = { width: '100%', padding: '9px 12px', borderRadius: 8, border: '1px solid #ddd', marginBottom: 10, fontSize: 14, boxSizing: 'border-box', fontFamily: 'system-ui' };
  const lbl = { fontSize: 11, fontWeight: 600, color: '#888', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 5, display: 'block' };

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', zIndex: 200, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ background: 'white', borderRadius: 14, padding: 28, width: 400, maxHeight: '90vh', overflowY: 'auto' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
          <h2 style={{ fontSize: 16, fontWeight: 700 }}>Edit profile</h2>
          <button onClick={onClose} style={{ background: 'none', border: 'none', fontSize: 18, cursor: 'pointer', color: '#aaa' }}>✕</button>
        </div>

        {/* Avatar */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 20 }}>
          <div
            onClick={() => fileRef.current?.click()}
            style={{ width: 64, height: 64, borderRadius: '50%', background: '#e8eaf0', border: '2px dashed #ccc', cursor: 'pointer', overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}
          >
            {avatarPreview
              ? <img src={avatarPreview} alt="avatar" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              : <span style={{ fontSize: 24, fontWeight: 700, color: '#1a2744' }}>{initials || '?'}</span>
            }
          </div>
          <div>
            <div style={{ fontSize: 13, fontWeight: 600, color: '#333', marginBottom: 3 }}>Profile photo</div>
            <button onClick={() => fileRef.current?.click()} style={{ fontSize: 12, color: '#1a2744', background: 'none', border: '1px solid #ddd', borderRadius: 6, padding: '4px 10px', cursor: 'pointer' }}>
              {avatarPreview ? 'Change photo' : 'Upload photo'}
            </button>
            <input ref={fileRef} type="file" accept="image/*" onChange={handleAvatarChange} style={{ display: 'none' }} />
          </div>
        </div>

        <label style={lbl}>Full name</label>
        <input value={name} onChange={e => setName(e.target.value)} style={inp} />
        <label style={lbl}>Initials (2–3 chars)</label>
        <input value={initials} onChange={e => setInitials(e.target.value)} maxLength={3} style={inp} />
        <label style={lbl}>Phone number (SMS alerts)</label>
        <input value={phone} onChange={e => { setPhone(e.target.value); setPhoneError(''); }} placeholder="5095551234" style={{ ...inp, borderColor: phoneError ? '#e57373' : '#ddd' }} />
        {phoneError && <div style={{ fontSize: 11, color: '#e57373', marginTop: -8, marginBottom: 10 }}>{phoneError}</div>}
        <div style={{ fontSize: 11, color: '#aaa', marginTop: -6, marginBottom: 10 }}>US numbers — we'll add +1 automatically.</div>
        <label style={lbl}>Company</label>
        <input value={company} onChange={e => setCompany(e.target.value)} style={inp} />

        <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end', marginTop: 8 }}>
          <button onClick={onClose} style={{ padding: '8px 16px', borderRadius: 8, border: '1px solid #ddd', background: 'white', fontSize: 13, cursor: 'pointer' }}>Cancel</button>
          <button onClick={save} disabled={saving} style={{ padding: '8px 16px', borderRadius: 8, border: 'none', background: '#1a2744', color: 'white', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>
            {saving ? 'Saving...' : 'Save changes'}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Main App ─────────────────────────────────────────────────────────────────

function App() {
  const [session, setSession] = useState(null);
  const [currentProfile, setCurrentProfile] = useState(null);
  const [needsProfile, setNeedsProfile] = useState(false);
  const [profiles, setProfiles] = useState([]);

  const [properties, setProperties] = useState([]);
  const [checklist, setChecklist] = useState({});
  const [selected, setSelected] = useState(null);
  const [tab, setTab] = useState(0);
  const [showAdd, setShowAdd] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [showEdit, setShowEdit] = useState(false);
  const [showEditProfile, setShowEditProfile] = useState(false);
  const [editProp, setEditProp] = useState(null);
  const [newAddress, setNewAddress] = useState('');
  const [newPrice, setNewPrice] = useState('');
  const [loading, setLoading] = useState(true);
  const [notes, setNotes] = useState({});
  const [reactions, setReactions] = useState({});
  const [newNote, setNewNote] = useState('');
  const [newCheckLabel, setNewCheckLabel] = useState('');

  // Deep link handler — ?property=UUID auto-opens that property
  useEffect(() => {
    if (!properties.length) return;
    const params = new URLSearchParams(window.location.search);
    const propId = params.get('property');
    if (propId) {
      const match = properties.find(p => p.id === propId);
      if (match) { setSelected(match); setTab(0); }
      window.history.replaceState({}, '', window.location.pathname);
    }
  }, [properties]);

  // Auth listener
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      if (session) loadProfile(session.user);
    });
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_e, session) => {
      setSession(session);
      if (session) loadProfile(session.user);
      else { setCurrentProfile(null); setNeedsProfile(false); }
    });
    return () => subscription.unsubscribe();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  async function loadProfile(user) {
    const { data } = await supabase.from('profiles').select('*').eq('id', user.id).single();
    if (!data || !data.name) {
      setNeedsProfile(true);
    } else {
      setCurrentProfile(data);
      setNeedsProfile(false);
      fetchAll();
    }
    fetchProfiles();
  }

  async function fetchProfiles() {
    const { data } = await supabase.from('profiles').select('*');
    setProfiles(data || []);
  }

  async function fetchAll() {
    setLoading(true);
    const [{ data: props }, { data: checks }, { data: noteData }, { data: reactData }] = await Promise.all([
      supabase.from('properties').select('*').order('created_at', { ascending: false }),
      supabase.from('checklist_items').select('*'),
      supabase.from('notes').select('*').order('created_at', { ascending: false }),
      supabase.from('reactions').select('*'),
    ]);
    setProperties(props || []);
    const gc = {};
    (checks || []).forEach(c => { if (!gc[c.property_id]) gc[c.property_id] = []; gc[c.property_id].push(c); });
    setChecklist(gc);
    const gn = {};
    (noteData || []).forEach(n => { if (!gn[n.property_id]) gn[n.property_id] = []; gn[n.property_id].push(n); });
    setNotes(gn);
    const gr = {};
    (reactData || []).forEach(r => { if (!gr[r.note_id]) gr[r.note_id] = []; gr[r.note_id].push(r); });
    setReactions(gr);
    setLoading(false);
  }

  // ── Property CRUD ──

  async function addProperty() {
    if (!newAddress.trim()) return;
    const { data, error } = await supabase.from('properties').insert([{
      address: newAddress,
      status: 'rehabbing',
      price: newPrice ? 'Target list price ' + newPrice : '',
    }]).select().single();
    if (error || !data) return;
    const checks = DC['rehabbing'].map(l => ({ property_id: data.id, label: l, is_done: false, due_date: '', stage: 'rehabbing' }));
    await supabase.from('checklist_items').insert(checks);
    setNewAddress(''); setNewPrice(''); setShowAdd(false); fetchAll();
  }

  async function saveEdit() {
    if (!editProp.address.trim()) return;
    await supabase.from('properties').update({
      address: editProp.address, price: editProp.price, status: editProp.status,
    }).eq('id', editProp.id);
    setShowEdit(false); setEditProp(null);
    if (selected?.id === editProp.id) setSelected(prev => ({ ...prev, ...editProp }));
    fetchAll();
  }

  async function deleteProperty(id) {
    await supabase.from('properties').delete().eq('id', id);
    setSelected(null); setShowEdit(false); setEditProp(null); fetchAll();
  }

  async function moveStatus(property, direction) {
    const idx = STATUSES.indexOf(property.status);
    const newStatus = STATUSES[idx + direction];
    if (!newStatus) return;
    await supabase.from('properties').update({ status: newStatus }).eq('id', property.id);
    const existing = (checklist[property.id] || []).filter(c => c.stage === newStatus);
    if (!existing.length) {
      const nc = DC[newStatus].map(l => ({ property_id: property.id, label: l, is_done: false, due_date: '', stage: newStatus }));
      await supabase.from('checklist_items').insert(nc);
    }
    fetchAll();
    setSelected(prev => prev?.id === property.id ? { ...prev, status: newStatus } : prev);
  }

  // ── Checklist ──

  async function toggleCheck(check) {
    await supabase.from('checklist_items').update({ is_done: !check.is_done }).eq('id', check.id);
    fetchAll();
  }

  async function updateDueDate(check, date) {
    await supabase.from('checklist_items').update({ due_date: date }).eq('id', check.id);
    fetchAll();

    // Notify all users with a phone number when a date is set
    if (date && profiles.length) {
      const prop = properties.find(p => p.id === check.property_id);
      const link = `${window.location.origin}?property=${check.property_id}`;
      const msg = `📋 ${prop?.address || 'A property'}: "${check.label}" is scheduled for ${formatDate(date)}.\nView property: ${link}`;
      for (const p of profiles) {
        if (p.phone && p.id !== currentProfile?.id) {
          await sendSMS(p.phone, msg);
        }
      }
    }
  }

  async function addCheck(propertyId, status, label) {
    if (!label.trim()) return;
    await supabase.from('checklist_items').insert([{ property_id: propertyId, label, is_done: false, due_date: '', stage: status }]);
    fetchAll();
  }

  async function deleteCheckItem(checkId) {
    await supabase.from('checklist_items').delete().eq('id', checkId);
    fetchAll();
  }

  // ── Notes ──

  async function postNote(propertyId) {
    if (!newNote.trim() || !currentProfile) return;
    const prop = properties.find(p => p.id === propertyId);

    // Match against actual profile names — much more reliable than regex
    const mentionedProfiles = profiles.filter(p =>
      newNote.includes('@' + p.name)
    );
    const mentionIds = mentionedProfiles.map(p => p.id);

    await supabase.from('notes').insert([{
      property_id: propertyId,
      body: newNote,
      author_id: currentProfile.id,
      mentions: mentionIds,
    }]);

    // SMS mentioned users
    for (const mp of mentionedProfiles) {
      if (mp.phone && mp.id !== currentProfile.id) {
        const link = `${window.location.origin}?property=${propertyId}`;
        const msg = `🏠 ${currentProfile.name} mentioned you in ${prop?.address || 'a property'}: "${newNote.slice(0, 100)}"\nView property: ${link}`;
        await sendSMS(mp.phone, msg);
      }
    }

    setNewNote(''); fetchAll();
  }

  async function editNote(noteId, body) {
    if (!body.trim()) return;
    await supabase.from('notes').update({ body }).eq('id', noteId);
    fetchAll();
  }

  async function deleteNote(noteId) {
    await supabase.from('notes').delete().eq('id', noteId);
    fetchAll();
  }

  async function toggleReaction(noteId, emoji) {
    if (!currentProfile) return;
    const existing = (reactions[noteId] || []).find(r => r.author_id === currentProfile.id && r.emoji === emoji);
    if (existing) {
      await supabase.from('reactions').delete().eq('id', existing.id);
    } else {
      await supabase.from('reactions').insert([{ note_id: noteId, emoji, author_id: currentProfile.id }]);
    }
    fetchAll();
  }

  // ── Computed ──

  const selectedProp = selected ? properties.find(p => p.id === selected.id) : null;
  const selectedChecks = selectedProp ? (checklist[selectedProp.id] || []).filter(c => c.stage === selectedProp.status) : [];
  const selectedNotes = selectedProp ? (notes[selectedProp.id] || []) : [];

  function pct(propId, status) {
    const c = (checklist[propId] || []).filter(x => x.stage === status);
    if (!c.length) return 0;
    return Math.round(c.filter(x => x.is_done).length / c.length * 100);
  }

  const isAdmin = currentProfile?.role === 'admin';

  const overdueCount = Object.values(checklist).flat().filter(c => isOverdue(c.due_date) && !c.is_done).length;

  // ── Shared styles ──

  const modalStyle = { position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.35)', zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'center' };
  const cardStyle = { background: 'white', borderRadius: 12, padding: 24, width: 420, maxHeight: '90vh', overflowY: 'auto' };
  const inputStyle = { width: '100%', padding: '9px 12px', borderRadius: 8, border: '1px solid #ddd', marginBottom: 10, fontSize: 14, boxSizing: 'border-box', fontFamily: 'system-ui' };
  const labelStyle = { fontSize: 11, fontWeight: 600, color: '#888', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 5, display: 'block' };

  // ── Render gates ──

  if (!session) return <AuthScreen onAuth={setSession} />;
  if (needsProfile) return (
    <ProfileSetup
      user={session.user}
      onComplete={() => { setNeedsProfile(false); loadProfile(session.user); }}
    />
  );

  return (
    <div style={{ fontFamily: 'system-ui, sans-serif', background: '#f0ede8', minHeight: '100vh' }}>

      {/* Topbar */}
      <div style={{ background: '#1a2744', height: 58, padding: '0 20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <div style={{ color: 'white', fontSize: 13, fontWeight: 700 }}>Backyard Home Buyers</div>
          <div style={{ width: 1, height: 30, background: 'rgba(255,255,255,0.15)' }} />
          <div>
            <div style={{ color: 'rgba(255,255,255,0.4)', fontSize: 9 }}>Realtor partner</div>
            <div style={{ color: 'rgba(255,255,255,0.75)', fontSize: 12, fontWeight: 600 }}>Halstead Home Group</div>
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          {overdueCount > 0 && (
            <div style={{ background: '#c62828', color: 'white', borderRadius: 20, padding: '3px 10px', fontSize: 11, fontWeight: 700 }}>
              ⚠ {overdueCount} overdue
            </div>
          )}
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <div style={{ width: 28, height: 28, borderRadius: '50%', background: 'rgba(255,255,255,0.15)', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10, fontWeight: 700, overflow: 'hidden', flexShrink: 0 }}>
              {currentProfile?.avatar_url
                ? <img src={currentProfile.avatar_url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                : currentProfile?.initials || '?'
              }
            </div>
            <div style={{ color: 'rgba(255,255,255,0.75)', fontSize: 12 }}>{currentProfile?.name}</div>
          </div>
          <button onClick={() => setShowSettings(true)} style={{ background: 'rgba(255,255,255,0.1)', color: 'rgba(255,255,255,0.8)', border: 'none', borderRadius: 7, padding: '6px 12px', fontSize: 12, cursor: 'pointer' }}>⚙ Settings</button>
          {isAdmin && <button onClick={() => setShowAdd(true)} style={{ background: '#29a8e0', color: 'white', border: 'none', borderRadius: 7, padding: '6px 14px', fontSize: 12, fontWeight: 600, cursor: 'pointer' }}>+ New Property</button>}
          <button onClick={() => supabase.auth.signOut()} style={{ background: 'rgba(255,255,255,0.08)', color: 'rgba(255,255,255,0.6)', border: 'none', borderRadius: 7, padding: '6px 10px', fontSize: 11, cursor: 'pointer' }}>Sign out</button>
        </div>
      </div>

      {/* Add Modal */}
      {showAdd && (
        <div style={modalStyle}>
          <div style={cardStyle}>
            <h2 style={{ fontSize: 16, fontWeight: 700, marginBottom: 16 }}>Add new property</h2>
            <label style={labelStyle}>Address</label>
            <input value={newAddress} onChange={e => setNewAddress(e.target.value)} placeholder="123 Main St, Spokane WA" style={inputStyle} />
            <label style={labelStyle}>Target list price</label>
            <input value={newPrice} onChange={e => setNewPrice(e.target.value)} placeholder="e.g. $285k" style={inputStyle} />
            <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end', marginTop: 6 }}>
              <button onClick={() => setShowAdd(false)} style={{ padding: '7px 14px', borderRadius: 7, border: '1px solid #ddd', background: 'white', cursor: 'pointer', fontSize: 12 }}>Cancel</button>
              <button onClick={addProperty} style={{ padding: '7px 14px', borderRadius: 7, border: 'none', background: '#1a2744', color: 'white', cursor: 'pointer', fontSize: 12, fontWeight: 600 }}>Add Property</button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Modal */}
      {showEdit && editProp && (
        <div style={modalStyle}>
          <div style={cardStyle}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <h2 style={{ fontSize: 16, fontWeight: 700 }}>Edit property</h2>
              <span style={{ fontSize: 10, fontWeight: 700, padding: '2px 8px', borderRadius: 20, background: '#fff3e0', color: '#7a3f0a' }}>ADMIN ONLY</span>
            </div>
            <label style={labelStyle}>Address</label>
            <input value={editProp.address} onChange={e => setEditProp({ ...editProp, address: e.target.value })} style={inputStyle} />
            <label style={labelStyle}>Price</label>
            <input value={editProp.price || ''} onChange={e => setEditProp({ ...editProp, price: e.target.value })} placeholder="e.g. Target list price $285k" style={inputStyle} />
            <label style={labelStyle}>Status</label>
            <select value={editProp.status} onChange={e => setEditProp({ ...editProp, status: e.target.value })} style={{ ...inputStyle, marginBottom: 16 }}>
              {STATUSES.map(s => <option key={s} value={s}>{SLABELS[s]}</option>)}
            </select>
            <div style={{ borderTop: '1px solid #f0f0f0', paddingTop: 14, marginBottom: 14 }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: '#aaa', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 8 }}>Checklist items</div>
              {(checklist[editProp.id] || []).filter(c => c.stage === editProp.status).map(check => (
                <div key={check.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '6px 10px', background: '#fafafa', borderRadius: 7, marginBottom: 5, border: '1px solid #f0f0f0' }}>
                  <span style={{ fontSize: 12, color: '#333' }}>{check.label}</span>
                  <button onClick={() => deleteCheckItem(check.id)} style={{ background: 'none', border: 'none', color: '#e57373', cursor: 'pointer', fontSize: 16, lineHeight: 1 }}>×</button>
                </div>
              ))}
            </div>
            <div style={{ display: 'flex', gap: 8, justifyContent: 'space-between', marginTop: 6 }}>
              <button onClick={() => { if (window.confirm('Delete this property?')) deleteProperty(editProp.id); }} style={{ padding: '7px 14px', borderRadius: 7, border: '1px solid #ffcdd2', background: 'white', color: '#c62828', cursor: 'pointer', fontSize: 12 }}>Delete property</button>
              <div style={{ display: 'flex', gap: 8 }}>
                <button onClick={() => { setShowEdit(false); setEditProp(null); }} style={{ padding: '7px 14px', borderRadius: 7, border: '1px solid #ddd', background: 'white', cursor: 'pointer', fontSize: 12 }}>Cancel</button>
                <button onClick={saveEdit} style={{ padding: '7px 14px', borderRadius: 7, border: 'none', background: '#1a2744', color: 'white', cursor: 'pointer', fontSize: 12, fontWeight: 600 }}>Save changes</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Settings Modal */}
      {showSettings && (
        <div style={modalStyle}>
          <div style={{ ...cardStyle, width: 520 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
              <h2 style={{ fontSize: 16, fontWeight: 700 }}>Settings</h2>
              <button onClick={() => setShowSettings(false)} style={{ background: 'none', border: 'none', fontSize: 18, cursor: 'pointer', color: '#aaa' }}>✕</button>
            </div>

            {/* My profile */}
            <div style={{ marginBottom: 20, paddingBottom: 20, borderBottom: '1px solid #f0f0f0' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                <div style={{ fontSize: 11, fontWeight: 700, color: '#aaa', textTransform: 'uppercase', letterSpacing: '0.06em' }}>My profile</div>
                <button onClick={() => setShowEditProfile(true)} style={{ fontSize: 12, color: '#1a2744', background: 'none', border: '1px solid #ddd', borderRadius: 6, padding: '4px 10px', cursor: 'pointer' }}>✎ Edit</button>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 12 }}>
                <div style={{ width: 52, height: 52, borderRadius: '50%', background: '#1a2744', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16, fontWeight: 700, overflow: 'hidden', flexShrink: 0 }}>
                  {currentProfile?.avatar_url
                    ? <img src={currentProfile.avatar_url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    : currentProfile?.initials
                  }
                </div>
                <div>
                  <div style={{ fontSize: 14, fontWeight: 700, color: '#1a1a1a' }}>{currentProfile?.name}</div>
                  <div style={{ fontSize: 12, color: '#aaa' }}>{currentProfile?.company}</div>
                </div>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                <div style={{ padding: 12, background: '#f8f8f8', borderRadius: 8, border: '1px solid #eee' }}>
                  <div style={{ fontSize: 11, color: '#aaa', marginBottom: 4 }}>Email</div>
                  <div style={{ fontSize: 12, fontWeight: 600, color: '#1a2744' }}>{session?.user?.email}</div>
                </div>
                <div style={{ padding: 12, background: '#f8f8f8', borderRadius: 8, border: '1px solid #eee' }}>
                  <div style={{ fontSize: 11, color: '#aaa', marginBottom: 4 }}>Phone (SMS)</div>
                  <div style={{ fontSize: 12, fontWeight: 600, color: currentProfile?.phone ? '#1a2744' : '#e57373' }}>
                    {currentProfile?.phone || 'Not set'}
                  </div>
                </div>
              </div>
            </div>

            <div style={{ marginBottom: 20, paddingBottom: 20, borderBottom: '1px solid #f0f0f0' }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: '#aaa', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 12 }}>Branding</div>
              <div style={{ display: 'flex', gap: 12 }}>
                <div style={{ flex: 1, padding: 12, background: '#f8f8f8', borderRadius: 8, border: '1px solid #eee' }}>
                  <div style={{ fontSize: 11, color: '#aaa', marginBottom: 4 }}>Your company</div>
                  <div style={{ fontSize: 13, fontWeight: 600, color: '#1a2744' }}>Backyard Home Buyers</div>
                </div>
                <div style={{ flex: 1, padding: 12, background: '#f8f8f8', borderRadius: 8, border: '1px solid #eee' }}>
                  <div style={{ fontSize: 11, color: '#aaa', marginBottom: 4 }}>Realtor partner</div>
                  <div style={{ fontSize: 13, fontWeight: 600, color: '#1a2744' }}>Halstead Home Group</div>
                </div>
              </div>
            </div>

            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                <div style={{ fontSize: 11, fontWeight: 700, color: '#aaa', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Users & permissions</div>
              </div>
              {profiles.map(u => (
                <div key={u.id} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 12px', background: '#fafafa', borderRadius: 8, marginBottom: 6, border: '1px solid #f0f0f0' }}>
                  <div style={{ width: 32, height: 32, borderRadius: '50%', background: '#1a2744', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 700, flexShrink: 0, overflow: 'hidden' }}>
                    {u.avatar_url
                      ? <img src={u.avatar_url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                      : u.initials
                    }
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 13, fontWeight: 600, color: '#1a1a1a' }}>{u.name}</div>
                    <div style={{ fontSize: 11, color: '#aaa' }}>{u.company} {u.phone ? '· ' + u.phone : ''}</div>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span style={{ fontSize: 10, fontWeight: 700, padding: '2px 8px', borderRadius: 20, background: u.role === 'admin' ? '#1a2744' : '#e3f2fd', color: u.role === 'admin' ? 'white' : '#1a3a5c' }}>
                      {u.role === 'admin' ? 'Admin' : 'Member'}
                    </span>
                    {isAdmin && u.id !== currentProfile?.id && (
                      <button
                        onClick={async () => {
                          const newRole = u.role === 'admin' ? 'member' : 'admin';
                          await supabase.from('profiles').update({ role: newRole }).eq('id', u.id);
                          fetchProfiles();
                        }}
                        style={{ fontSize: 11, color: '#1a2744', background: 'none', border: '1px solid #ddd', borderRadius: 5, padding: '2px 8px', cursor: 'pointer' }}
                      >
                        {u.role === 'admin' ? 'Make member' : 'Make admin'}
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>

            <div style={{ marginTop: 20, padding: 12, background: '#f0f7ff', borderRadius: 8, border: '1px solid #d0e8ff' }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: '#1a3a5c', marginBottom: 3 }}>
                Signed in as {currentProfile?.role === 'admin' ? 'Admin' : 'Member'}
              </div>
              <div style={{ fontSize: 11, color: '#5a7a9c' }}>SMS alerts fire when you're @mentioned or a checklist date is set.</div>
            </div>
          </div>
        </div>
      )}

      {/* Edit Profile Modal */}
      {showEditProfile && currentProfile && (
        <EditProfileModal
          profile={currentProfile}
          user={session.user}
          onClose={() => setShowEditProfile(false)}
          onSave={() => { loadProfile(session.user); fetchProfiles(); }}
        />
      )}

      {/* Main Layout */}
      <div style={{ display: 'flex', height: 'calc(100vh - 58px)' }}>

        {/* Pipeline Board */}
        <div style={{ flex: 1, overflowX: 'auto', padding: 14, display: 'flex', gap: 10, alignItems: 'flex-start', minWidth: 0 }}>
          {loading ? <div style={{ padding: 40, color: '#aaa' }}>Loading...</div> : STATUSES.map(st => {
            const cols = properties.filter(p => p.status === st);
            const s = SC[st];
            return (
              <div key={st} style={{ flex: '0 0 190px' }}>
                <div style={{ background: s.bg, borderRadius: 8, padding: '7px 10px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 7 }}>
                  <span style={{ fontSize: 11, fontWeight: 700, color: s.tx }}>{SLABELS[st]}</span>
                  <span style={{ fontSize: 10, fontWeight: 700, color: s.tx, width: 18, height: 18, borderRadius: '50%', background: 'rgba(0,0,0,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>{cols.length}</span>
                </div>
                {cols.map(p => {
                  const pc = pct(p.id, p.status);
                  const stageChecks = (checklist[p.id] || []).filter(c => c.stage === p.status);
                  const done = stageChecks.filter(c => c.is_done).length;
                  const hasOverdue = stageChecks.some(c => isOverdue(c.due_date) && !c.is_done);
                  return (
                    <div key={p.id}
                      style={{
                        background: 'white',
                        border: selected?.id === p.id ? '2px solid #1a2744' : hasOverdue ? '1.5px solid #e57373' : '1.5px solid #ebebeb',
                        borderRadius: 10, padding: 12, cursor: 'pointer', marginBottom: 7, position: 'relative',
                      }}
                    >
                      {hasOverdue && (
                        <div style={{ position: 'absolute', top: 8, left: 8, width: 7, height: 7, borderRadius: '50%', background: '#e57373' }} />
                      )}
                      {isAdmin && (
                        <button onClick={e => { e.stopPropagation(); setEditProp(p); setShowEdit(true); }}
                          style={{ position: 'absolute', top: 8, right: 8, background: 'none', border: 'none', cursor: 'pointer', color: '#ccc', fontSize: 14, padding: 2 }} title="Edit property">✎</button>
                      )}
                      <div onClick={() => { setSelected(p); setTab(0); }}>
                        <div style={{ fontSize: 12, fontWeight: 600, marginBottom: 2, paddingRight: 20, paddingLeft: hasOverdue ? 12 : 0 }}>{p.address}</div>
                        {p.price && <div style={{ fontSize: 10, color: '#1a2744', fontWeight: 500, marginBottom: 7 }}>{p.price}</div>}
                        <div style={{ height: 3, background: '#f0f0f0', borderRadius: 2, marginBottom: 6 }}>
                          <div style={{ height: 3, width: pc + '%', background: '#1a2744', borderRadius: 2 }} />
                        </div>
                        <div style={{ fontSize: 10, color: hasOverdue ? '#e57373' : '#aaa' }}>
                          {hasOverdue ? '⚠ Overdue item' : `${done}/${stageChecks.length} done`}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            );
          })}
        </div>

        {/* Activity Feed */}
        {selectedProp && (
          <div style={{ width: 280, flexShrink: 0, background: 'white', borderLeft: '1px solid #eee', display: 'flex', flexDirection: 'column', height: 'calc(100vh - 58px)' }}>
            <div style={{ padding: '12px 14px 10px', borderBottom: '1px solid #f0f0f0' }}>
              <div style={{ fontSize: 12, fontWeight: 700, color: '#1a1a1a' }}>Activity</div>
              <div style={{ fontSize: 10, color: '#aaa' }}>{selectedProp.address}</div>
            </div>
            <div style={{ flex: 1, overflowY: 'auto', padding: '14px 12px 10px' }}>
              {!selectedNotes.length && (
                <div style={{ textAlign: 'center', padding: '30px 0', color: '#ccc', fontSize: 12 }}>No activity yet.<br />Post the first note below!</div>
              )}
              {selectedNotes.map(n => (
                <NoteItem
                  key={n.id}
                  n={n}
                  noteReactions={reactions[n.id] || []}
                  profiles={profiles}
                  currentUser={currentProfile}
                  onToggleReaction={toggleReaction}
                  onEditNote={editNote}
                  onDeleteNote={deleteNote}
                />
              ))}
            </div>
            <div style={{ padding: '10px 12px', borderTop: '1px solid #f0f0f0' }}>
              <MentionTextarea
                value={newNote}
                onChange={e => setNewNote(e.target.value)}
                profiles={profiles}
                placeholder="Add a note... type @ to mention someone"
                style={{ width: '100%', padding: '8px 10px', borderRadius: 8, border: '1px solid #e0e0e0', fontSize: 12, resize: 'none', height: 60, fontFamily: 'system-ui', outline: 'none', boxSizing: 'border-box' }}
              />
              <button onClick={() => postNote(selectedProp.id)}
                style={{ marginTop: 6, width: '100%', padding: '7px 0', borderRadius: 8, border: 'none', background: '#1a2744', color: 'white', cursor: 'pointer', fontSize: 12, fontWeight: 600 }}>
                Post
              </button>
            </div>
          </div>
        )}

        {/* Checklist Panel */}
        {selectedProp && (
          <div style={{ width: 300, flexShrink: 0, background: 'white', borderLeft: '1px solid #eee', display: 'flex', flexDirection: 'column', height: 'calc(100vh - 58px)', overflow: 'hidden' }}>
            <div style={{ padding: 14, borderBottom: '1px solid #f0f0f0' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div>
                  <div style={{ fontSize: 15, fontWeight: 700, marginBottom: 2 }}>{selectedProp.address}</div>
                  {selectedProp.price && <div style={{ fontSize: 11, color: '#1a2744', fontWeight: 500, marginBottom: 5 }}>{selectedProp.price}</div>}
                  <span style={{ fontSize: 9, fontWeight: 700, padding: '2px 8px', borderRadius: 20, background: SC[selectedProp.status].bg, color: SC[selectedProp.status].tx, textTransform: 'uppercase', letterSpacing: '0.06em' }}>{SLABELS[selectedProp.status]}</span>
                </div>
                <div style={{ display: 'flex', gap: 6 }}>
                  {isAdmin && <button onClick={() => { setEditProp(selectedProp); setShowEdit(true); }} style={{ background: 'none', border: '1px solid #ddd', borderRadius: 6, padding: '3px 8px', cursor: 'pointer', fontSize: 12, color: '#666' }}>✎ Edit</button>}
                  <button onClick={() => setSelected(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 16, color: '#aaa' }}>✕</button>
                </div>
              </div>
              <div style={{ display: 'flex', gap: 5, marginTop: 9 }}>
                {STATUSES.indexOf(selectedProp.status) > 0 && (
                  <button onClick={() => moveStatus(selectedProp, -1)} style={{ flex: 1, padding: '6px 0', borderRadius: 7, border: '1px solid #ddd', background: 'white', cursor: 'pointer', fontSize: 11, fontWeight: 500 }}>← Back</button>
                )}
                {STATUSES.indexOf(selectedProp.status) < 4 && (
                  <button onClick={() => moveStatus(selectedProp, 1)} style={{ flex: 1, padding: '6px 0', borderRadius: 7, border: 'none', background: '#1a2744', color: 'white', cursor: 'pointer', fontSize: 11, fontWeight: 500 }}>Next Stage →</button>
                )}
              </div>
            </div>
            <div style={{ display: 'flex', borderBottom: '1px solid #f0f0f0', padding: '0 14px' }}>
              {['Checklist', 'Team'].map((t, i) => (
                <div key={i} onClick={() => setTab(i)}
                  style={{ padding: '8px 10px', fontSize: 12, fontWeight: 500, cursor: 'pointer', color: tab === i ? '#1a2744' : '#aaa', borderBottom: tab === i ? '2px solid #1a2744' : '2px solid transparent', marginBottom: -1 }}>{t}</div>
              ))}
            </div>
            <div style={{ padding: 12, flex: 1, overflowY: 'auto' }}>
              {tab === 0 && (
                <div>
                  <div style={{ fontSize: 10, fontWeight: 700, color: '#aaa', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 7 }}>{SLABELS[selectedProp.status]} checklist</div>
                  {selectedChecks.map(check => {
                    const overdue = isOverdue(check.due_date) && !check.is_done;
                    const soon = isDueSoon(check.due_date) && !check.is_done;
                    return (
                      <div key={check.id} style={{
                        padding: '7px 9px', background: overdue ? '#fff5f5' : '#fafafa',
                        borderRadius: 7, marginBottom: 5, border: overdue ? '1px solid #ffcdd2' : soon ? '1px solid #ffe0b2' : '1px solid #f0f0f0',
                      }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
                          <input type="checkbox" checked={check.is_done} onChange={() => toggleCheck(check)}
                            style={{ width: 14, height: 14, accentColor: '#1a2744', cursor: 'pointer', flexShrink: 0 }} />
                          <span style={{ flex: 1, fontSize: 12, color: check.is_done ? '#bbb' : overdue ? '#c62828' : '#333', textDecoration: check.is_done ? 'line-through' : 'none', lineHeight: 1.3 }}>
                            {check.label}
                          </span>
                        </div>
                        <div style={{ marginTop: 5, display: 'flex', alignItems: 'center', gap: 6, paddingLeft: 21 }}>
                          <input type="date" value={check.due_date || ''} onChange={e => updateDueDate(check, e.target.value)}
                            style={{ fontSize: 11, border: '1px solid #eee', borderRadius: 5, padding: '3px 6px', color: overdue ? '#c62828' : soon ? '#e65100' : check.due_date ? '#1a2744' : '#aaa', background: overdue ? '#fff5f5' : 'white', flex: 1 }}
                          />
                          {check.due_date && !check.is_done && (
                            <span style={{ fontSize: 10, color: overdue ? '#c62828' : soon ? '#e65100' : '#aaa', fontWeight: overdue || soon ? 600 : 400 }}>
                              {overdue ? '⚠ Overdue' : soon ? '⏰ Soon' : formatDate(check.due_date)}
                            </span>
                          )}
                        </div>
                      </div>
                    );
                  })}
                  {isAdmin && (
                    <div style={{ marginTop: 10 }}>
                      <div style={{ fontSize: 10, fontWeight: 700, color: '#aaa', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 6 }}>Add checklist item</div>
                      <div style={{ display: 'flex', gap: 5 }}>
                        <input value={newCheckLabel} onChange={e => setNewCheckLabel(e.target.value)} placeholder="New item..."
                          style={{ flex: 1, padding: '6px 8px', borderRadius: 7, border: '1px solid #e0e0e0', fontSize: 12, outline: 'none' }} />
                        <button onClick={() => { addCheck(selectedProp.id, selectedProp.status, newCheckLabel); setNewCheckLabel(''); }}
                          style={{ background: '#1a2744', color: 'white', border: 'none', borderRadius: 7, padding: '6px 9px', fontSize: 11, cursor: 'pointer' }}>Add</button>
                      </div>
                    </div>
                  )}
                </div>
              )}
              {tab === 1 && (
                <div>
                  <div style={{ fontSize: 10, fontWeight: 700, color: '#aaa', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 10 }}>Team</div>
                  {profiles.map(u => (
                    <div key={u.id} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 10px', background: '#fafafa', borderRadius: 8, marginBottom: 6, border: '1px solid #f0f0f0' }}>
                      <div style={{ width: 28, height: 28, borderRadius: '50%', background: '#1a2744', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10, fontWeight: 700, flexShrink: 0 }}>{u.initials}</div>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontSize: 12, fontWeight: 600 }}>{u.name}</div>
                        <div style={{ fontSize: 10, color: '#aaa' }}>{u.company}</div>
                      </div>
                      <span style={{ fontSize: 10, fontWeight: 700, padding: '2px 7px', borderRadius: 20, background: u.role === 'admin' ? '#1a2744' : '#e3f2fd', color: u.role === 'admin' ? 'white' : '#1a3a5c' }}>
                        {u.role === 'admin' ? 'Admin' : 'Member'}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default App;
