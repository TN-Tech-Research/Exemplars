import { useEffect, useMemo, useRef, useState } from 'react'
import { ParticleBackground } from './components/ParticleBackground'
import type { PosterRecord } from './types'
import rcisLogoUrl from './assets/RCIS.png'

const COLLEGE_META = {
  ENG: {
    name: 'College of Engineering',
    accent: '#61c7ff',
  },
  AHE: {
    name: 'College of Agriculture and Human Ecology',
    accent: '#ff9f6e',
  },
  ASC: {
    name: 'College of Arts and Sciences',
    accent: '#ff7bba',
  },
  NUR: {
    name: 'School of Nursing',
    accent: '#7ef0c2',
  },
  CEI: {
    name: 'College of Emerging and Integrative Studies',
    accent: '#ffd166',
  },
  EDU: {
    name: 'College of Education and Human Sciences',
    accent: '#c6a6ff',
  },
} satisfies Record<string, { name: string; accent: string }>

type CollegeCode = keyof typeof COLLEGE_META

function getCollegeCode(projectNumber: string): CollegeCode | null {
  const code = projectNumber.split('-')[0]?.trim().toUpperCase()
  return code in COLLEGE_META ? (code as CollegeCode) : null
}

function groupByCollege(records: PosterRecord[]) {
  return Object.entries(COLLEGE_META)
    .map(([code, meta]) => ({
      code: code as CollegeCode,
      meta,
      records: records
        .filter((record) => getCollegeCode(record.project_number) === code)
        .sort((a, b) => a.project_number.localeCompare(b.project_number)),
    }))
    .filter((group) => group.records.length > 0)
}

export default function App() {
  const [records, setRecords] = useState<PosterRecord[]>([])
  const [selectedRecord, setSelectedRecord] = useState<PosterRecord | null>(null)
  const [isAbstractOpen, setIsAbstractOpen] = useState(false)
  const lastTriggerRef = useRef<HTMLButtonElement | null>(null)
  const closeButtonRef = useRef<HTMLButtonElement | null>(null)
  const modalRef = useRef<HTMLDivElement | null>(null)

  useEffect(() => {
    let active = true
    fetch(`${import.meta.env.BASE_URL}posters/catalog.json`)
      .then((response) => response.json() as Promise<PosterRecord[]>)
      .then((data) => {
        if (active) {
          setRecords(data)
        }
      })
      .catch((error) => {
        console.error('Failed to load poster catalog', error)
      })
    return () => {
      active = false
    }
  }, [])

  useEffect(() => {
    if (!selectedRecord) {
      document.body.style.overflow = ''
      lastTriggerRef.current?.focus()
      return
    }

    document.body.style.overflow = 'hidden'
    closeButtonRef.current?.focus()

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setSelectedRecord(null)
        setIsAbstractOpen(false)
        return
      }

      if (event.key === 'Tab' && modalRef.current) {
        const focusable = modalRef.current.querySelectorAll<HTMLElement>(
          'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])',
        )
        const first = focusable[0]
        const last = focusable[focusable.length - 1]
        if (!first || !last) {
          return
        }
        if (event.shiftKey && document.activeElement === first) {
          event.preventDefault()
          last.focus()
        } else if (!event.shiftKey && document.activeElement === last) {
          event.preventDefault()
          first.focus()
        }
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => {
      document.body.style.overflow = ''
      window.removeEventListener('keydown', handleKeyDown)
    }
  }, [selectedRecord])

  const groupedRecords = useMemo(() => groupByCollege(records), [records])

  function openPoster(record: PosterRecord, trigger: HTMLButtonElement) {
    lastTriggerRef.current = trigger
    setSelectedRecord(record)
    setIsAbstractOpen(false)
  }

  function closePoster() {
    setSelectedRecord(null)
    setIsAbstractOpen(false)
  }

  return (
    <div className="app-shell">
      <ParticleBackground />
      <div className="ambient ambient-a" />
      <div className="ambient ambient-b" />
      <div className="ambient ambient-c" />

      <main className="page">
        <header className="site-header" aria-label="RCIS Exemplars">
          <a className="logo-link" href="/" aria-label="RCIS Exemplars home">
            <img src={rcisLogoUrl} alt="Research and Creative Inquiry Day" className="site-logo" />
          </a>
        </header>

        <section className="gallery-intro" aria-labelledby="gallery-title">
          <p className="eyebrow">RCIS 2026</p>
          <h1 id="gallery-title">Exemplar Poster Gallery</h1>
          <p className="intro-copy">
            Browse exemplar posters by college, open any poster at full-viewport size,
            and reveal the abstract on demand without losing the image context.
          </p>
        </section>

        <div className="college-groups" aria-label="Poster groups by college">
          {groupedRecords.map((group) => (
            <section
              key={group.code}
              className="college-section"
              aria-labelledby={`college-${group.code}`}
              style={{ ['--college-accent' as string]: group.meta.accent }}
            >
              <div className="college-header">
                <div>
                  <p className="section-kicker">{group.code}</p>
                  <h2 id={`college-${group.code}`}>{group.meta.name}</h2>
                </div>
                <p className="college-count">
                  {group.records.length} poster{group.records.length === 1 ? '' : 's'}
                </p>
              </div>

              <div className="poster-grid">
                {group.records.map((record) => (
                  <button
                    key={record.project_number}
                    type="button"
                    className="poster-card"
                    onClick={(event) => openPoster(record, event.currentTarget)}
                    aria-label={`Open poster ${record.project_number}: ${record.project_title}`}
                  >
                    <div className="poster-frame">
                      <img
                        src={`${import.meta.env.BASE_URL}${record.image_path}`}
                        alt={record.abstract}
                        loading="lazy"
                      />
                    </div>
                    <div className="poster-copy">
                      <p className="project-number">{record.project_number}</p>
                      <h3>{record.project_title}</h3>
                      <p className="authors">{record.project_authors_display}</p>
                    </div>
                  </button>
                ))}
              </div>
            </section>
          ))}
        </div>
      </main>

      {selectedRecord ? (
        <div className="modal-backdrop" onClick={closePoster}>
          <div
            ref={modalRef}
            className="poster-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="poster-modal-title"
            aria-describedby={isAbstractOpen ? 'poster-modal-abstract' : 'poster-modal-authors'}
            onClick={(event) => event.stopPropagation()}
          >
            <div className="modal-topbar">
              <div className="modal-heading">
                <p className="project-number">{selectedRecord.project_number}</p>
                <h2 id="poster-modal-title">{selectedRecord.project_title}</h2>
              </div>
              <button
                ref={closeButtonRef}
                type="button"
                className="modal-close"
                onClick={closePoster}
                aria-label="Close poster viewer"
              >
                Close
              </button>
            </div>

            <div className="modal-image-wrap">
              <img
                src={`${import.meta.env.BASE_URL}${selectedRecord.image_path}`}
                alt={selectedRecord.abstract}
                className="modal-poster-image"
              />
            </div>

            <footer className="modal-footer">
              <div className="modal-meta">
                <p className="footer-label">Project Authors</p>
                <p id="poster-modal-authors" className="modal-authors">
                  {selectedRecord.project_authors_display}
                </p>
              </div>

              <div className="modal-actions">
                <button
                  type="button"
                  className="modal-action"
                  onClick={() => setIsAbstractOpen((value) => !value)}
                  aria-expanded={isAbstractOpen}
                  aria-controls="poster-modal-abstract"
                >
                  {isAbstractOpen ? 'Hide abstract' : 'View abstract'}
                </button>
              </div>
            </footer>

            {isAbstractOpen ? (
              <aside id="poster-modal-abstract" className="abstract-card" aria-live="polite">
                <p className="footer-label">Abstract</p>
                <p>{selectedRecord.abstract}</p>
              </aside>
            ) : null}
          </div>
        </div>
      ) : null}
    </div>
  )
}
