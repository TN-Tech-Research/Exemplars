import { useEffect, useMemo, useRef, useState } from 'react'
import { ParticleBackground } from './components/ParticleBackground'
import type { PosterRecord } from './types'
import rcisLogoUrl from './assets/RCIS.png'
import ribbonUrl from './assets/ribbon.png'

const COLLEGE_META = {
  ENG: {
    name: 'College of Engineering',
    accent: '#84c6dc',
  },
  AHE: {
    name: 'College of Agriculture and Human Ecology',
    accent: '#a3df9a',
  },
  ASC: {
    name: 'College of Arts and Sciences',
    accent: '#8c97de',
  },
  NUR: {
    name: 'School of Nursing',
    accent: '#ca96de',
  },
  CEI: {
    name: 'College of Emerging and Integrative Studies',
    accent: '#88d7b3',
  },
  EDU: {
    name: 'College of Education and Human Sciences',
    accent: '#df9aca',
  },
} satisfies Record<string, { name: string; accent: string }>

type CollegeCode = keyof typeof COLLEGE_META

const WINNER_PROJECTS = new Set([
  'ASC126',
  'ASC127',
  'ASC81',
  'ASC91',
  'NUR254',
  'ENG240',
  'ENG239',
  'ENG230',
  'ENG224',
  'ENG215',
  'ENG186',
  'ENG184',
  'ENG182',
])

function normalizeProjectNumber(projectNumber: string) {
  return projectNumber.replace(/[^A-Za-z0-9]/g, '').toUpperCase()
}

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
  const prefetchedRef = useRef<Set<string>>(new Set())

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
  const winnerCount = useMemo(
    () => records.filter((record) => WINNER_PROJECTS.has(normalizeProjectNumber(record.project_number))).length,
    [records],
  )

  function openPoster(record: PosterRecord, trigger: HTMLButtonElement) {
    lastTriggerRef.current = trigger
    setSelectedRecord(record)
    setIsAbstractOpen(false)
  }

  function preloadPoster(record: PosterRecord) {
    const path = `${import.meta.env.BASE_URL}${record.display_path || record.image_path}`
    if (prefetchedRef.current.has(path)) {
      return
    }
    prefetchedRef.current.add(path)
    const image = new Image()
    image.decoding = 'async'
    image.src = path
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
          <div className="header-summary" aria-hidden="true">
            <span>{records.length} Posters</span>
            <span className="header-divider" />
            <span className="winner-summary">
              <img src={ribbonUrl} alt="" className="winner-summary-icon" />
              <span>{winnerCount} Winners</span>
            </span>
          </div>
        </header>

        <section className="gallery-board" aria-label="Poster groups by college">
          <div className="board-frame" />
          <div className="college-groups">
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
                {group.records.map((record) => {
                  const isWinner = WINNER_PROJECTS.has(normalizeProjectNumber(record.project_number))
                  return (
                  <button
                    key={record.project_number}
                    type="button"
                    className={`poster-card${isWinner ? ' is-winner' : ''}`}
                    onClick={(event) => openPoster(record, event.currentTarget)}
                    onMouseEnter={() => preloadPoster(record)}
                    onFocus={() => preloadPoster(record)}
                    aria-label={`Open ${isWinner ? 'award-winning ' : ''}poster ${record.project_number}: ${record.project_title}. Abstract: ${record.abstract}`}
                  >
                    {isWinner ? (
                      <img src={ribbonUrl} alt="" className="poster-ribbon" aria-hidden="true" />
                    ) : null}
                    <div className="poster-copy">
                      <p className="project-number">{record.project_number}</p>
                      <h3>{record.project_title}</h3>
                    </div>
                  </button>
                  )
                })}
              </div>
            </section>
          ))}
          </div>
        </section>
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
            <div className="modal-image-wrap">
              <img
                src={`${import.meta.env.BASE_URL}${selectedRecord.display_path || selectedRecord.image_path}`}
                alt={selectedRecord.abstract}
                className="modal-poster-image"
                decoding="async"
              />
            </div>

            <aside className="modal-sidebar">
              <div className="modal-sidebar-top">
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

              {isAbstractOpen ? (
                <div id="poster-modal-abstract" className="abstract-card" aria-live="polite">
                <p className="footer-label">Abstract</p>
                <p>{selectedRecord.abstract}</p>
                </div>
              ) : null}
            </aside>
          </div>
        </div>
      ) : null}
    </div>
  )
}
