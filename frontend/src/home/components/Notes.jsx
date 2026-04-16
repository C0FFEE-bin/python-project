import { useState, useCallback } from 'react';
import './Notes.css';

const INITIAL_NOTES = [
  {
    id: 1,
    title: 'Całki nieoznaczone',
    subject: 'mat',
    tag: 'Matematyka',
    tagClass: 'rn-tag-mat',
    date: 'dziś',
    type: 'text',
    body:
      'Metody całkowania:\n• Całkowanie przez podstawienie\n• Całkowanie przez części: ∫u dv = uv - ∫v du\n• Całkowanie funkcji wymiernych\n\nWzory podstawowe:\n∫xⁿ dx = xⁿ⁺¹/(n+1) + C\n∫eˣ dx = eˣ + C\n∫sin(x) dx = -cos(x) + C',
  },
  {
    id: 2,
    title: 'Ruch jednostajny',
    subject: 'fiz',
    tag: 'Fizyka',
    tagClass: 'rn-tag-fiz',
    date: 'wczoraj',
    type: 'text',
    body:
      'Wzór: s = v·t\n\nPrędkość jest stała.\nWykres s(t) – linia prosta.\nWykres v(t) – pozioma linia.\n\nZadanie domowe: zad. 3.4, 3.7 z podręcznika.',
  },
  {
    id: 3,
    title: 'Zadania do oddania',
    subject: 'ang',
    tag: 'Angielski',
    tagClass: 'rn-tag-ang',
    date: '2 dni temu',
    type: 'checklist',
    body: '',
    checks: [
      { text: 'Esej – My dream job (300 słów)', done: true },
      { text: 'Ćwiczenia str. 47–49', done: false },
      { text: 'Nauka słówek – rozdział 6', done: false },
      { text: 'Prezentacja na środę', done: true },
    ],
  },
  {
    id: 4,
    title: 'Prawa ruchu Newtona',
    subject: 'fiz',
    tag: 'Fizyka',
    tagClass: 'rn-tag-fiz',
    date: '3 dni temu',
    type: 'text',
    body:
      'I zasada: ciało pozostaje w spoczynku lub porusza się ruchem prostoliniowym jednostajnym, jeśli nie działa na nie siła wypadkowa.\n\nII zasada: F = m·a\n\nIII zasada: akcja = reakcja',
  },
];

const SUBJECT_MAP = {
  mat: { label: 'Matematyka', tagClass: 'rn-tag-mat' },
  fiz: { label: 'Fizyka', tagClass: 'rn-tag-fiz' },
  ang: { label: 'Angielski', tagClass: 'rn-tag-ang' },
};

function Logo() {
  return (
    <div className="rn-logo">
      RENT NERD <span>A</span>
    </div>
  );
}

function ViewToggle({ currentView, onSetView }) {
  return (
    <div className="rn-view-toggle">
      {['notatki', 'zadania'].map((v) => (
        <button
          key={v}
          className={`rn-view-btn ${currentView === v ? 'active' : ''}`}
          onClick={() => onSetView(v)}
        >
          {v.charAt(0).toUpperCase() + v.slice(1)}
        </button>
      ))}
    </div>
  );
}

function Tabs({ currentTab, onSetTab }) {
  const tabs = [
    { key: 'all', label: 'Wszystkie' },
    { key: 'mat', label: 'Matematyka' },
    { key: 'fiz', label: 'Fizyka' },
    { key: 'ang', label: 'Angielski' },
  ];
  return (
    <div className="rn-tabs">
      {tabs.map((t) => (
        <button
          key={t.key}
          className={`rn-tab ${currentTab === t.key ? 'active' : ''}`}
          onClick={() => onSetTab(t.key)}
        >
          {t.label}
        </button>
      ))}
    </div>
  );
}

function NoteItem({ note, isActive, onSelect }) {
  return (
    <div
      className={`rn-note-item ${isActive ? 'active' : ''}`}
      onClick={() => onSelect(note.id)}
    >
      <div className="rn-note-title">{note.title}</div>
      <div className="rn-note-meta">
        <span className={`rn-tag ${note.tagClass}`}>{note.tag}</span>
        <span>{note.date}</span>
      </div>
    </div>
  );
}

function TextEditor({ note, onUpdateNote }) {
  const wordCount = note.body.trim().split(/\s+/).filter(Boolean).length;

  return (
    <>
      <div className="rn-toolbar">
        {['B', 'I', 'U', '|', 'H1', 'H2', '|', '• Lista', '1. Num.', '|', '📎'].map(
          (label, i) => (
            <button
              key={i}
              className={`rn-fmt-btn ${label === '|' ? 'sep' : ''}`}
            >
              {label === 'B' ? <b>B</b> : label === 'I' ? <i>I</i> : label === 'U' ? <u>U</u> : label}
            </button>
          )
        )}
      </div>

      <textarea
        className="rn-note-body"
        placeholder="Zacznij pisać notatki z zajęć..."
        value={note.body}
        onChange={(e) => onUpdateNote({ body: e.target.value })}
      />

      <div className="rn-bottom-bar">
        <span className="rn-word-count">{wordCount} słów</span>
        <SaveButton onSave={() => {}} />
      </div>
    </>
  );
}

function ChecklistEditor({ note, onUpdateNote }) {
  const checks = note.checks || [];
  const doneCount = checks.filter((c) => c.done).length;

  const toggleCheck = (index) => {
    const updated = checks.map((c, i) =>
      i === index ? { ...c, done: !c.done } : c
    );
    onUpdateNote({ checks: updated });
  };

  const addCheck = () => {
    const text = window.prompt('Nowe zadanie:');
    if (text) {
      onUpdateNote({ checks: [...checks, { text, done: false }] });
    }
  };

  return (
    <>
      <div className="rn-checklist">
        {checks.map((check, i) => (
          <div key={i} className="rn-check-row">
            <input
              type="checkbox"
              checked={check.done}
              onChange={() => toggleCheck(i)}
            />
            <span className={check.done ? 'done' : ''}>{check.text}</span>
          </div>
        ))}
      </div>

      <button className="rn-check-add" onClick={addCheck}>
        + Dodaj zadanie
      </button>

      <div className="rn-flex-spacer" />

      <div className="rn-bottom-bar">
        <span className="rn-word-count">
          {doneCount}/{checks.length} ukończone
        </span>
        <SaveButton onSave={() => {}} />
      </div>
    </>
  );
}

function SaveButton({ onSave }) {
  const [saved, setSaved] = useState(false);

  const handleSave = () => {
    onSave();
    setSaved(true);
    setTimeout(() => setSaved(false), 1500);
  };

  return (
    <button
      className={`rn-save-btn ${saved ? 'saved' : ''}`}
      onClick={handleSave}
    >
      {saved ? 'Zapisano ✓' : 'Zapisz'}
    </button>
  );
}

function Editor({ note, onUpdateNote, onDeleteNote }) {
  return (
    <div className="rn-editor">
      <div className="rn-editor-top">
        <select
          className="rn-subject-select"
          value={note.subject}
          onChange={(e) => {
            const s = e.target.value;
            onUpdateNote({
              subject: s,
              tag: SUBJECT_MAP[s].label,
              tagClass: SUBJECT_MAP[s].tagClass,
            });
          }}
        >
          {Object.entries(SUBJECT_MAP).map(([key, { label }]) => (
            <option key={key} value={key}>
              {label}
            </option>
          ))}
        </select>

        <div className="rn-editor-actions">
          <button className="rn-icon-btn" title="Gwiazdka">☆</button>
          <button className="rn-icon-btn" title="Udostępnij">⬆</button>
          <button
            className="rn-icon-btn"
            title="Usuń"
            onClick={() => onDeleteNote(note.id)}
          >
            ✕
          </button>
        </div>
      </div>

      <input
        className="rn-title-input"
        value={note.title}
        placeholder="Tytuł notatki..."
        onChange={(e) => onUpdateNote({ title: e.target.value })}
      />

      <div className="rn-divider" />

      {note.type === 'text' ? (
        <TextEditor note={note} onUpdateNote={onUpdateNote} />
      ) : (
        <ChecklistEditor note={note} onUpdateNote={onUpdateNote} />
      )}
    </div>
  );
}

/* ── Main Notes component ──────────────────── */

export default function Notes() {
  const [notes, setNotes] = useState(INITIAL_NOTES);
  const [activeId, setActiveId] = useState(1);
  const [currentView, setCurrentView] = useState('notatki');
  const [currentTab, setCurrentTab] = useState('all');

  const activeNote = notes.find((n) => n.id === activeId);

  const filteredNotes =
    currentTab === 'all' ? notes : notes.filter((n) => n.subject === currentTab);

  const updateNote = useCallback(
    (changes) => {
      setNotes((prev) =>
        prev.map((n) => (n.id === activeId ? { ...n, ...changes } : n))
      );
    },
    [activeId]
  );

  const deleteNote = useCallback(
    (id) => {
      setNotes((prev) => {
        if (prev.length <= 1) return prev;
        const filtered = prev.filter((n) => n.id !== id);
        setActiveId(filtered[0].id);
        return filtered;
      });
    },
    []
  );

  const addNote = () => {
    const id = Date.now();
    const newNote = {
      id,
      title: 'Nowa notatka',
      subject: 'mat',
      tag: 'Matematyka',
      tagClass: 'rn-tag-mat',
      date: 'teraz',
      type: 'text',
      body: '',
    };
    setNotes((prev) => [newNote, ...prev]);
    setActiveId(id);
  };

  const handleSetView = (v) => {
    setCurrentView(v);
    if (v === 'zadania') {
      const checklist = notes.find((n) => n.type === 'checklist');
      if (checklist) setActiveId(checklist.id);
    }
  };

  return (
    <div className="rn-app">
      <div className="rn-header">
        <Logo />
        <div className="rn-spacer" />
        <ViewToggle currentView={currentView} onSetView={handleSetView} />
      </div>

      <Tabs currentTab={currentTab} onSetTab={setCurrentTab} />

      <div className="rn-main">
        <div className="rn-sidebar">
          {filteredNotes.map((note) => (
            <NoteItem
              key={note.id}
              note={note}
              isActive={note.id === activeId}
              onSelect={setActiveId}
            />
          ))}
          <button className="rn-add-btn" onClick={addNote}>
            + Nowa notatka
          </button>
        </div>

        {activeNote && (
          <Editor
            note={activeNote}
            onUpdateNote={updateNote}
            onDeleteNote={deleteNote}
          />
        )}
      </div>
    </div>
  );
}
