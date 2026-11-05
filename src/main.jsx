import React, { useEffect, useMemo, useState } from "react";
import { createRoot } from "react-dom/client";
import {
    onAuthStateChanged,
    signInWithEmailAndPassword,
    createUserWithEmailAndPassword,
    GoogleAuthProvider,
    signInWithPopup,
    signOut,
} from "firebase/auth";
import {
    doc,
    getDoc,
    setDoc,
    serverTimestamp,
} from "firebase/firestore";
import { auth, db } from "./firebase.js";
import {
    BookOpen,
    LayoutDashboard,
    Library,
    Heart,
    Tags,
    BarChart3,
    Settings,
    Search,
    Bell,
    Plus,
    ChevronRight,
    Moon,
    Sun,
    Menu,
    X,
    MoreHorizontal,
    BookMarked,
    Clock3,
    Leaf,
    ArrowUpRight,
    SlidersHorizontal,
    ArrowLeft,
    Quote,
    Star,
    Pencil,
    Trash2,
    Download,
    Check,
    CalendarDays,
} from "lucide-react";
import "./styles.css";

const seed = [
    {
        id: 1,
        title: "The Midnight Library",
        author: "Matt Haig",
        genre: "Fiction",
        status: "Currently reading",
        progress: 68,
        pages: 304,
        cover: "https://covers.openlibrary.org/b/isbn/9780525559474-L.jpg",
        rating: 4.5,
        started: "2026-10-18",
        completed: "",
        review: "A thoughtful story about choices, possibility, and the lives we imagine.",
        quotes: ["The only way to learn is to live."],
        notes: "Read a few pages before bed.",
    },
    {
        id: 2,
        title: "Atomic Habits",
        author: "James Clear",
        genre: "Self-help",
        status: "Completed",
        progress: 100,
        pages: 320,
        cover: "https://covers.openlibrary.org/b/isbn/9780735211292-L.jpg",
        rating: 5,
        started: "2026-09-02",
        completed: "2026-09-21",
        review: "Practical and actionable. A book worth revisiting.",
        quotes: [
            "You do not rise to the level of your goals. You fall to the level of your systems.",
        ],
        notes: "Try habit stacking.",
    },
    {
        id: 3,
        title: "The Song of Achilles",
        author: "Madeline Miller",
        genre: "Fantasy",
        status: "Completed",
        progress: 100,
        pages: 416,
        cover: "https://covers.openlibrary.org/b/isbn/9780062060624-L.jpg",
        rating: 4.5,
        started: "2026-08-10",
        completed: "2026-08-29",
        review: "Beautifully written and emotionally memorable.",
        quotes: ["He is half of my soul, as the poets say."],
        notes: "",
    },
    {
        id: 4,
        title: "Ikigai",
        author: "Héctor García & Francesc Miralles",
        genre: "Philosophy",
        status: "Want to read",
        progress: 0,
        pages: 208,
        cover: "https://covers.openlibrary.org/b/isbn/9780143130727-L.jpg",
        rating: 0,
        started: "",
        completed: "",
        review: "",
        quotes: [],
        notes: "",
    },
    {
        id: 5,
        title: "Before the Coffee Gets Cold",
        author: "Toshikazu Kawaguchi",
        genre: "Fiction",
        status: "Want to read",
        progress: 0,
        pages: 224,
        cover: "https://covers.openlibrary.org/b/isbn/9781335430991-L.jpg",
        rating: 0,
        started: "",
        completed: "",
        review: "",
        quotes: [],
        notes: "",
    },
];

const nav = [
    ["Overview", LayoutDashboard],
    ["My library", Library],
    ["Currently reading", BookOpen],
    ["Want to read", Clock3],
    ["Completed", BookMarked],
    ["Favourites", Heart],
    ["Categories", Tags],
    ["Reading journal", Quote],
    ["Statistics", BarChart3],
];

const blank = {
    title: "",
    author: "",
    genre: "Fiction",
    status: "Want to read",
    pages: "",
    progress: 0,
    cover: "",
    rating: 0,
    started: "",
    completed: "",
    review: "",
    notes: "",
    quotes: [],
};

function LibraryApp({ user, onLogout }) {
    const [books, setBooks] = useState(seed);
    const [active, setActive] = useState("Overview");
    const [dark, setDark] = useState(false);

    const [query, setQuery] = useState("");
    const [sort, setSort] = useState("Recently added");
    const [genre, setGenre] = useState("All genres");

    const [favs, setFavs] = useState([2, 3]);
    const [selected, setSelected] = useState(null);
    const [modal, setModal] = useState(false);

    const [editing, setEditing] = useState(null);
    const [mobile, setMobile] = useState(false);
    const [draft, setDraft] = useState(blank);

    const [quoteDraft, setQuoteDraft] = useState("");
    const [cloudReady, setCloudReady] = useState(false);

    useEffect(() => {
        let alive = true;

        (async () => {
            try {
                const ref = doc(
                    db,
                    "users",
                    user.uid,
                    "private",
                    "library"
                );

                const snap = await getDoc(ref);

                if (!alive) return;

                if (snap.exists()) {
                    const data = snap.data();

                    setBooks(
                        Array.isArray(data.books) ? data.books : []
                    );

                    setFavs(
                        Array.isArray(data.favs) ? data.favs : []
                    );
                } else {
                    setBooks([]);
                    setFavs([]);

                    await setDoc(ref, {
                        books: [],
                        favs: [],
                        updatedAt: serverTimestamp(),
                    });
                }
            } catch (error) {
                console.error("Could not load your library:", error);

                alert(
                    "Your library could not be loaded from Firebase. " +
                    "Check your connection and Firestore rules, then refresh."
                );
            } finally {
                if (alive) {
                    setCloudReady(true);
                }
            }
        })();

        return () => {
            alive = false;
        };
    }, [user.uid]);

    useEffect(() => {
        if (!cloudReady) return;

        const timer = setTimeout(() => {
            setDoc(
                doc(db, "users", user.uid, "private", "library"),
                {
                    books,
                    favs,
                    updatedAt: serverTimestamp(),
                }
            ).catch((error) => {
                console.error("Library sync failed:", error);

                alert(
                    "Cloud save failed. Your latest changes may not be synced. " +
                    "Check your connection."
                );
            });
        }, 500);

        return () => clearTimeout(timer);
    }, [books, favs, cloudReady, user.uid]);

    const completed = books.filter(
        (book) => book.status === "Completed"
    ).length;

    const genres = [
        ...new Set(books.map((book) => book.genre)),
    ].sort();

    const favouriteGenre =
        genres
            .map((item) => [
                item,
                books.filter((book) => book.genre === item).length,
            ])
            .sort((a, b) => b[1] - a[1])[0]?.[0] || "—";

    const visible = useMemo(() => {
        let list = books.filter((book) =>
            `${book.title} ${book.author} ${book.genre}`
                .toLowerCase()
                .includes(query.toLowerCase())
        );

        if (
            [
                "Currently reading",
                "Want to read",
                "Completed",
            ].includes(active)
        ) {
            list = list.filter(
                (book) => book.status === active
            );
        }

        if (active === "Favourites") {
            list = list.filter(
                (book) => favs.includes(book.id)
            );
        }

        if (active === "Categories" && genre !== "All genres") {
            list = list.filter(
                (book) => book.genre === genre
            );
        }

        if (active === "Reading journal") {
            list = list.filter(
                (book) =>
                    book.review ||
                    book.notes ||
                    book.quotes.length
            );
        }

        if (sort === "Title A–Z") {
            list.sort((a, b) =>
                a.title.localeCompare(b.title)
            );
        }

        if (sort === "Author A–Z") {
            list.sort((a, b) =>
                a.author.localeCompare(b.author)
            );
        }

        if (sort === "Highest rated") {
            list.sort((a, b) => b.rating - a.rating);
        }

        if (sort === "Completion date") {
            list.sort((a, b) =>
                (b.completed || "").localeCompare(
                    a.completed || ""
                )
            );
        }

        return list;
    }, [books, query, active, favs, sort, genre]);

    const go = (label) => {
        setActive(label);
        setSelected(null);
        setMobile(false);
    };

    const saveBook = (event) => {
        event.preventDefault();

        const item = {
            ...draft,
            id: editing?.id || Date.now(),
            pages: Number(draft.pages) || 0,
            progress: Number(draft.progress) || 0,
            quotes: draft.quotes || [],
        };

        setBooks((old) =>
            editing
                ? old.map((book) =>
                    book.id === editing.id ? item : book
                )
                : [item, ...old]
        );

        setModal(false);
        setEditing(null);
        setSelected(item);
        setDraft(blank);
    };

    const editBook = (book) => {
        setDraft({ ...book });
        setEditing(book);
        setModal(true);
    };

    const toggleFav = (id) => {
        setFavs((old) =>
            old.includes(id)
                ? old.filter((item) => item !== id)
                : [...old, id]
        );
    };

    const updateProgress = (book, value) => {
        const progress = Math.max(
            0,
            Math.min(100, Number(value) || 0)
        );

        const updated = {
            ...book,
            progress,
            status:
                progress === 100
                    ? "Completed"
                    : progress > 0
                        ? "Currently reading"
                        : book.status === "Completed"
                            ? "Want to read"
                            : book.status,
        };

        setBooks((old) =>
            old.map((item) =>
                item.id === book.id ? updated : item
            )
        );

        setSelected(updated);
    };

    const exportCSV = () => {
        const rows = [
            [
                "Title",
                "Author",
                "Genre",
                "Status",
                "Progress",
                "Pages",
                "Rating",
                "Started",
                "Completed",
            ],
            ...books.map((book) => [
                book.title,
                book.author,
                book.genre,
                book.status,
                book.progress,
                book.pages,
                book.rating,
                book.started,
                book.completed,
            ]),
        ];

        const csv = rows
            .map((row) =>
                row
                    .map(
                        (value) =>
                            `"${String(value ?? "").replaceAll('"', '""')}"`
                    )
                    .join(",")
            )
            .join("\n");

        const a = document.createElement("a");

        a.href = URL.createObjectURL(
            new Blob([csv], { type: "text/csv" })
        );

        a.download = "leaf-and-letter-reading-history.csv";
        a.click();

        URL.revokeObjectURL(a.href);
    };

    const addQuote = () => {
        if (!quoteDraft.trim() || !selected) return;

        const updated = {
            ...selected,
            quotes: [
                ...selected.quotes,
                quoteDraft.trim(),
            ],
        };

        setBooks((old) =>
            old.map((book) =>
                book.id === updated.id ? updated : book
            )
        );

        setSelected(updated);
        setQuoteDraft("");
    };

    const removeBook = (id) => {
        setBooks((old) =>
            old.filter((book) => book.id !== id)
        );

        setFavs((old) =>
            old.filter((item) => item !== id)
        );

        setSelected(null);
    };

    return (
        <div className={`app-shell ${dark ? "dark" : ""}`}>
            <aside className={`sidebar ${mobile ? "open" : ""}`}>
                <div className="brand">
                    <img
                        src="/logo-v2.png"
                        alt="Leaf & Letter"
                        className="brand-logo"
                    />

                    <div className="brand-copy">
                        <span className="brand-name">
                            Leaf <i>&</i> Letter
                        </span>

                        <span className="brand-caption">
                            YOUR PERSONAL READING ROOM
                        </span>
                    </div>

                    <button
                        className="mobile-close icon-button"
                        onClick={() => setMobile(false)}
                        aria-label="Close navigation"
                    >
                        <X size={18} />
                    </button>
                </div>

                <div className="nav-label">YOUR LIBRARY</div>

                <nav className="main-nav">
                    {nav.map(([label, Icon]) => (
                        <button
                            key={label}
                            className={`nav-item ${
                                active === label && !selected
                                    ? "selected"
                                    : ""
                            }`}
                            onClick={() => go(label)}
                        >
                            <Icon size={18} />

                            <span>{label}</span>

                            {label === "Favourites" && (
                                <span className="nav-count">
                                    {favs.length}
                                </span>
                            )}
                        </button>
                    ))}
                </nav>

                <div className="sidebar-bottom">
                    <div className="quote-card">
                        <span className="quote-mark">“</span>

                        <p>
                            A room without books is like a body
                            without a soul.
                        </p>

                        <span className="quote-author">
                            — CICERO
                        </span>
                    </div>

                    <button
                        className="nav-item"
                        onClick={() => go("Settings")}
                    >
                        <Settings size={18} />
                        <span>Settings</span>
                    </button>

                    <div className="profile">
                        <div className="avatar">J</div>

                        <div className="profile-copy">
                            <strong>Your reading room</strong>
                            <span>Personal library</span>
                        </div>

                        <MoreHorizontal size={18} />
                    </div>
                </div>
            </aside>

            {mobile && (
                <button
                    className="scrim"
                    onClick={() => setMobile(false)}
                />
            )}

            <main className="main-content">
                <header className="topbar">
                    <button
                        className="icon-button mobile-menu-button"
                        onClick={() => setMobile(true)}
                    >
                        <Menu size={20} />
                    </button>

                    <div className="breadcrumb">
                        Your space <span>/</span>{" "}
                        <strong>
                            {selected ? selected.title : active}
                        </strong>
                    </div>

                    <div className="top-actions">
                        <label className="search-box">
                            <Search size={17} />

                            <input
                                value={query}
                                onChange={(event) =>
                                    setQuery(event.target.value)
                                }
                                placeholder="Search books, authors..."
                            />
                        </label>

                        <button
                            className="icon-button theme-toggle"
                            onClick={() => setDark(!dark)}
                            aria-label="Toggle theme"
                        >
                            {dark ? (
                                <Sun size={18} />
                            ) : (
                                <Moon size={18} />
                            )}
                        </button>

                        <button
                            className="account-chip"
                            onClick={onLogout}
                            title="Sign out"
                        >
                            {user.displayName ||
                                user.email ||
                                "Account"}{" "}
                            · Sign out
                        </button>
                    </div>
                </header>

                <div className="page-wrap">
                    {selected ? (
                        <BookDetail
                            book={
                                books.find(
                                    (book) =>
                                        book.id === selected.id
                                ) || selected
                            }
                            favourite={favs.includes(selected.id)}
                            onBack={() => setSelected(null)}
                            onEdit={() =>
                                editBook(
                                    books.find(
                                        (book) =>
                                            book.id === selected.id
                                    ) || selected
                                )
                            }
                            onFavourite={() =>
                                toggleFav(selected.id)
                            }
                            onProgress={(value) =>
                                updateProgress(selected, value)
                            }
                            onDelete={() =>
                                removeBook(selected.id)
                            }
                            quoteDraft={quoteDraft}
                            setQuoteDraft={setQuoteDraft}
                            addQuote={addQuote}
                        />
                    ) : (
                        <>
                            <section className="welcome-row">
                                <div>
                                    <div className="eyebrow">
                                        <span />
                                        YOUR QUIET CORNER OF THE WORLD
                                    </div>

                                    <h1>
                                        {active === "Overview" ? (
                                            <>
                                                A little time for{" "}
                                                <em>yourself.</em>
                                            </>
                                        ) : (
                                            active
                                        )}
                                    </h1>

                                    <p className="welcome-sub">
                                        {active === "Overview"
                                            ? "A good book is waiting. Pick up where your imagination left off."
                                            : "A thoughtful place for every story in your collection."}
                                    </p>
                                </div>

                                <button
                                    className="primary-button"
                                    onClick={() => {
                                        setDraft(blank);
                                        setEditing(null);
                                        setModal(true);
                                    }}
                                >
                                    <Plus size={17} />
                                    Add a book
                                </button>
                            </section>

                            {active === "Overview" && (
                                <>
                                    <section className="stats-grid">
                                        <Stat
                                            icon={<BookMarked />}
                                            label="Books read"
                                            value={String(completed).padStart(2, "0")}
                                            note="Completed stories"
                                        />

                                        <Stat
                                            icon={<Heart />}
                                            label="Favourite genre"
                                            value={favouriteGenre}
                                            note="Your biggest shelf"
                                        />

                                        <Stat
                                            icon={<BookOpen />}
                                            label="In progress"
                                            value={String(
                                                books.filter(
                                                    (book) =>
                                                        book.status === "Currently reading"
                                                ).length
                                            ).padStart(2, "0")}
                                            note="Keep turning pages"
                                        />
                                    </section>

                                    <section className="continue-card">
                                        <div className="continue-copy">
                                            <span className="section-kicker">
                                                PICK UP WHERE YOU LEFT OFF
                                            </span>

                                            <h2>
                                                Your next chapter
                                                <br />
                                                is just a page away.
                                            </h2>

                                            <p>
                                                Small reading moments add up
                                                to something wonderful.
                                            </p>

                                            <button
                                                className="text-button"
                                                onClick={() =>
                                                    go("Currently reading")
                                                }
                                            >
                                                Continue reading
                                                <ArrowUpRight size={16} />
                                            </button>
                                        </div>

                                        {books
                                            .filter(
                                                (book) =>
                                                    book.status === "Currently reading"
                                            )
                                            .slice(0, 1)
                                            .map((book) => (
                                                <button
                                                    className="continue-book"
                                                    key={book.id}
                                                    onClick={() =>
                                                        setSelected(book)
                                                    }
                                                >
                                                    <div className="cover-wrap">
                                                        <Cover book={book} />
                                                    </div>

                                                    <div className="continue-meta">
                                                        <strong>
                                                            {book.title}
                                                        </strong>

                                                        <span>
                                                            {book.author}
                                                        </span>

                                                        <div className="progress-line">
                                                            <i
                                                                style={{
                                                                    width: `${book.progress}%`,
                                                                }}
                                                            />
                                                        </div>

                                                        <small>
                                                            {book.progress}%
                                                            completed
                                                        </small>
                                                    </div>
                                                </button>
                                            ))}

                                        <div className="botanical botanical-one">
                                            ✳
                                        </div>

                                        <div className="botanical botanical-two">
                                            ❧
                                        </div>
                                    </section>

                                    <div className="section-heading">
                                        <div>
                                            <span className="section-kicker">
                                                CURATED BY YOU
                                            </span>

                                            <h2>Your bookshelf</h2>
                                        </div>

                                        <button
                                            className="subtle-link"
                                            onClick={() => go("My library")}
                                        >
                                            View all
                                            <ChevronRight size={16} />
                                        </button>
                                    </div>

                                    <BookGrid
                                        books={books.slice(0, 4)}
                                        favs={favs}
                                        toggleFav={toggleFav}
                                        select={setSelected}
                                    />
                                </>
                            )}

                            {active !== "Overview" && (
                                <section className="listing-block">
                                    <div className="section-heading">
                                        <div>
                                            <span className="section-kicker">
                                                A COLLECTION OF STORIES
                                            </span>

                                            <h2>
                                                {active === "My library"
                                                    ? "All your books"
                                                    : active}
                                            </h2>
                                        </div>

                                        <div className="list-controls">
                                            {active === "Categories" && (
                                                <select
                                                    value={genre}
                                                    onChange={(event) =>
                                                        setGenre(event.target.value)
                                                    }
                                                >
                                                    <option>All genres</option>

                                                    {genres.map((item) => (
                                                        <option key={item}>
                                                            {item}
                                                        </option>
                                                    ))}
                                                </select>
                                            )}

                                            <select
                                                value={sort}
                                                onChange={(event) =>
                                                    setSort(event.target.value)
                                                }
                                            >
                                                <option>Recently added</option>
                                                <option>Title A–Z</option>
                                                <option>Author A–Z</option>
                                                <option>Highest rated</option>
                                                <option>Completion date</option>
                                            </select>
                                        </div>
                                    </div>

                                    {active === "Statistics" && (
                                        <>
                                            <div className="stats-grid">
                                                <Stat
                                                    icon={<BookMarked />}
                                                    label="Books read"
                                                    value={completed}
                                                    note="All-time total"
                                                />

                                                <Stat
                                                    icon={<Heart />}
                                                    label="Favourite genre"
                                                    value={favouriteGenre}
                                                    note="Most represented genre"
                                                />

                                                <Stat
                                                    icon={<Library />}
                                                    label="In your library"
                                                    value={books.length}
                                                    note="Every story counts"
                                                />
                                            </div>

                                            <div className="settings-panel">
                                                <h3>Your reading collection</h3>

                                                <p>
                                                    {completed} completed ·{" "}
                                                    {
                                                        books.filter(
                                                            (book) =>
                                                                book.status === "Currently reading"
                                                        ).length
                                                    }{" "}
                                                    in progress ·{" "}
                                                    {
                                                        books.filter(
                                                            (book) =>
                                                                book.status === "Want to read"
                                                        ).length
                                                    }{" "}
                                                    on your wishlist.
                                                </p>

                                                <button
                                                    className="secondary-button"
                                                    onClick={exportCSV}
                                                >
                                                    <Download size={15} />
                                                    Export reading history (CSV)
                                                </button>
                                            </div>
                                        </>
                                    )}

                                    {active === "Settings" && (
                                        <div className="settings-panel">
                                            <h3>Appearance</h3>

                                            <p>
                                                Choose the reading-room
                                                atmosphere that feels right.
                                            </p>

                                            <button
                                                className="secondary-button"
                                                onClick={() =>
                                                    setDark(!dark)
                                                }
                                            >
                                                {dark ? (
                                                    <Sun size={16} />
                                                ) : (
                                                    <Moon size={16} />
                                                )}
                                                Switch to{" "}
                                                {dark ? "light" : "dark"} mode
                                            </button>

                                            <h3>Data</h3>

                                            <p>
                                                Export your current reading
                                                list as a spreadsheet-compatible
                                                CSV file.
                                            </p>

                                            <button
                                                className="secondary-button"
                                                onClick={exportCSV}
                                            >
                                                <Download size={15} />
                                                Export reading history
                                            </button>
                                        </div>
                                    )}

                                    {visible.length ? (
                                        <BookGrid
                                            books={visible}
                                            favs={favs}
                                            toggleFav={toggleFav}
                                            select={setSelected}
                                        />
                                    ) : (
                                        ![
                                            "Statistics",
                                            "Settings",
                                        ].includes(active) && (
                                            <div className="empty-state">
                                                <BookOpen size={28} />

                                                <h3>No books found</h3>

                                                <p>
                                                    Try another search or add
                                                    a new story to your shelf.
                                                </p>

                                                <button
                                                    className="primary-button"
                                                    onClick={() =>
                                                        setModal(true)
                                                    }
                                                >
                                                    <Plus size={16} />
                                                    Add a book
                                                </button>
                                            </div>
                                        )
                                    )}
                                </section>
                            )}
                        </>
                    )}

                    <footer className="footer">
                        <span>LEAF & LETTER</span>

                        <span>
                            Made for the love of reading <i>✳</i>
                        </span>
                    </footer>
                </div>
            </main>

            {modal && (
                <div
                    className="modal-backdrop"
                    onClick={() => setModal(false)}
                >
                    <form
                        className="add-modal"
                        onSubmit={saveBook}
                        onClick={(event) => event.stopPropagation()}
                    >
                        <button
                            type="button"
                            className="modal-close icon-button"
                            onClick={() => setModal(false)}
                        >
                            <X size={18} />
                        </button>

                        <span className="section-kicker">
                            {editing
                                ? "REFINE YOUR BOOK DETAILS"
                                : "A NEW STORY BEGINS"}
                        </span>

                        <h2>
                            {editing
                                ? "Edit book"
                                : "Add to your library"}
                        </h2>

                        <p className="modal-intro">
                            Give this story a place on your shelf.
                        </p>

                        <label>
                            Book title

                            <input
                                required
                                value={draft.title}
                                onChange={(event) =>
                                    setDraft({
                                        ...draft,
                                        title: event.target.value,
                                    })
                                }
                                placeholder="e.g. The Secret Garden"
                            />
                        </label>

                        <label>
                            Author

                            <input
                                required
                                value={draft.author}
                                onChange={(event) =>
                                    setDraft({
                                        ...draft,
                                        author: event.target.value,
                                    })
                                }
                                placeholder="e.g. Frances Hodgson Burnett"
                            />
                        </label>

                        <div className="form-row">
                            <label>
                                Genre

                                <select
                                    value={draft.genre}
                                    onChange={(event) =>
                                        setDraft({
                                            ...draft,
                                            genre: event.target.value,
                                        })
                                    }
                                >
                                    {[
                                        "Fiction",
                                        "Fantasy",
                                        "Romance",
                                        "Mystery",
                                        "Self-help",
                                        "Biography",
                                        "Philosophy",
                                        "Science",
                                        "History",
                                        "Other",
                                    ].map((item) => (
                                        <option key={item}>
                                            {item}
                                        </option>
                                    ))}
                                </select>
                            </label>

                            <label>
                                Status

                                <select
                                    value={draft.status}
                                    onChange={(event) =>
                                        setDraft({
                                            ...draft,
                                            status: event.target.value,
                                        })
                                    }
                                >
                                    {[
                                        "Want to read",
                                        "Currently reading",
                                        "Completed",
                                        "Abandoned",
                                    ].map((item) => (
                                        <option key={item}>
                                            {item}
                                        </option>
                                    ))}
                                </select>
                            </label>
                        </div>

                        <div className="form-row">
                            <label>
                                Total pages

                                <input
                                    type="number"
                                    min="0"
                                    value={draft.pages}
                                    onChange={(event) =>
                                        setDraft({
                                            ...draft,
                                            pages: event.target.value,
                                        })
                                    }
                                    placeholder="e.g. 320"
                                />
                            </label>

                            <label>
                                Current page (%)

                                <input
                                    type="number"
                                    min="0"
                                    max="100"
                                    value={draft.progress}
                                    onChange={(event) =>
                                        setDraft({
                                            ...draft,
                                            progress: event.target.value,
                                        })
                                    }
                                />
                            </label>
                        </div>

                        <label>
                            Book cover URL

                            <input
                                value={draft.cover}
                                onChange={(event) =>
                                    setDraft({
                                        ...draft,
                                        cover: event.target.value,
                                    })
                                }
                                placeholder="https://..."
                            />
                        </label>

                        <button
                            className="primary-button submit-button"
                            type="submit"
                        >
                            <Check size={16} />
                            Save book
                        </button>
                    </form>
                </div>
            )}
        </div>
    );
}

function Stat({ icon, label, value, note }) {
    return (
        <div className="stat-card">
            <div className="stat-icon">
                {React.cloneElement(icon, { size: 18 })}
            </div>

            <div className="stat-label">{label}</div>
            <div className="stat-value">{value}</div>

            <div className="stat-note">
                <span />
                {note}
            </div>
        </div>
    );
}

function Cover({ book }) {
    return (
        <div className={`book-cover ${book.color || "sage"}`}>
            {book.cover ? (
                <img
                    src={book.cover}
                    alt={`Cover of ${book.title}`}
                    onError={(event) => {
                        event.currentTarget.style.display = "none";
                    }}
                />
            ) : (
                <div className="cover-fallback">
                    <Leaf size={22} />
                    <span>{book.title}</span>
                    <small>{book.author}</small>
                </div>
            )}
        </div>
    );
}

function BookGrid({ books, favs, toggleFav, select }) {
    return (
        <div className="book-grid">
            {books.map((book) => (
                <article className="book-card" key={book.id}>
                    <button
                        className="book-card-cover"
                        onClick={() => select(book)}
                    >
                        <Cover book={book} />
                    </button>

                    <button
                        className={`favourite-button ${
                            favs.includes(book.id)
                                ? "is-favourite"
                                : ""
                        }`}
                        onClick={() => toggleFav(book.id)}
                        aria-label="Toggle favourite"
                    >
                        <Heart
                            size={16}
                            fill={
                                favs.includes(book.id)
                                    ? "currentColor"
                                    : "none"
                            }
                        />
                    </button>

                    <div
                        className="book-card-info"
                        onClick={() => select(book)}
                    >
                        <div className="book-genre">
                            {book.genre}
                        </div>

                        <h3>{book.title}</h3>
                        <p>{book.author}</p>

                        <div className="book-card-bottom">
                            <span
                                className={`status-dot ${
                                    book.status === "Completed"
                                        ? "done"
                                        : ""
                                }`}
                            >
                                {book.status}
                            </span>

                            <span className="rating">
                                {book.rating
                                    ? `★ ${book.rating}`
                                    : "—"}
                            </span>
                        </div>
                    </div>
                </article>
            ))}
        </div>
    );
}

function BookDetail({
    book,
    favourite,
    onBack,
    onEdit,
    onFavourite,
    onProgress,
    onDelete,
    quoteDraft,
    setQuoteDraft,
    addQuote,
}) {
    return (
        <section className="detail-page">
            <button className="back-link" onClick={onBack}>
                <ArrowLeft size={16} />
                Back to library
            </button>

            <div className="detail-hero">
                <div className="detail-cover">
                    <Cover book={book} />
                </div>

                <div className="detail-summary">
                    <span className="section-kicker">
                        {book.genre.toUpperCase()} ·{" "}
                        {book.status.toUpperCase()}
                    </span>

                    <h1>{book.title}</h1>

                    <p className="detail-author">
                        by {book.author}
                    </p>

                    <div className="detail-actions">
                        <button
                            className="primary-button"
                            onClick={onEdit}
                        >
                            <Pencil size={15} />
                            Edit details
                        </button>

                        <button
                            className={`secondary-button ${
                                favourite ? "fav-active" : ""
                            }`}
                            onClick={onFavourite}
                        >
                            <Heart
                                size={15}
                                fill={
                                    favourite
                                        ? "currentColor"
                                        : "none"
                                }
                            />

                            {favourite
                                ? "Favourite"
                                : "Add favourite"}
                        </button>

                        <button
                            className="icon-button delete-button"
                            onClick={onDelete}
                            title="Delete book"
                        >
                            <Trash2 size={17} />
                        </button>
                    </div>

                    <div className="detail-rating">
                        {book.rating
                            ? `★ ${book.rating} / 5`
                            : "Not rated yet"}
                    </div>
                </div>
            </div>

            <div className="detail-columns">
                <div className="detail-main">
                    <section className="detail-panel">
                        <div className="panel-title">
                            <h2>Reading progress</h2>
                            <span>{book.progress}%</span>
                        </div>

                        <div className="large-progress">
                            <i
                                style={{
                                    width: `${book.progress}%`,
                                }}
                            />
                        </div>

                        <input
                            className="progress-input"
                            aria-label="Reading progress percentage"
                            type="range"
                            min="0"
                            max="100"
                            value={book.progress}
                            onChange={(event) =>
                                onProgress(event.target.value)
                            }
                        />

                        <div className="progress-caption">
                            <span>
                                {book.pages
                                    ? Math.round(
                                        (book.pages * book.progress) / 100
                                    )
                                    : "—"}{" "}
                                pages read
                            </span>

                            <span>
                                {book.pages || "—"} total pages
                            </span>
                        </div>

                        <div className="detail-dates">
                            <span>
                                <CalendarDays size={14} />
                                Started: {book.started || "Not set"}
                            </span>

                            <span>
                                <Check size={14} />
                                Finished: {book.completed || "Not set"}
                            </span>
                        </div>
                    </section>

                    <section className="detail-panel">
                        <h2>Your review</h2>

                        <p className="journal-copy">
                            {book.review ||
                                "You haven't written a review for this book yet."}
                        </p>

                        <button
                            className="text-button"
                            onClick={onEdit}
                        >
                            <Pencil size={14} />
                            {book.review
                                ? "Edit review"
                                : "Write a review"}
                        </button>
                    </section>

                    <section className="detail-panel">
                        <h2>Favourite quotes</h2>

                        {book.quotes.length ? (
                            book.quotes.map((quote, index) => (
                                <blockquote key={index}>
                                    “{quote}”
                                </blockquote>
                            ))
                        ) : (
                            <p className="journal-copy">
                                Save the lines you want to remember.
                            </p>
                        )}

                        <div className="quote-entry">
                            <input
                                value={quoteDraft}
                                onChange={(event) =>
                                    setQuoteDraft(event.target.value)
                                }
                                placeholder="Add a memorable line..."
                            />

                            <button
                                className="secondary-button"
                                onClick={addQuote}
                            >
                                Save quote
                            </button>
                        </div>
                    </section>
                </div>

                <aside className="detail-side">
                    <section className="detail-panel">
                        <h2>Book details</h2>

                        <Info label="Genre" value={book.genre} />
                        <Info
                            label="Pages"
                            value={book.pages || "Not set"}
                        />
                        <Info
                            label="Status"
                            value={book.status}
                        />
                        <Info
                            label="Rating"
                            value={
                                book.rating
                                    ? `${book.rating} / 5`
                                    : "Not rated"
                            }
                        />
                    </section>

                    <section className="detail-panel">
                        <h2>Personal notes</h2>

                        <p className="journal-copy">
                            {book.notes || "No personal notes yet."}
                        </p>

                        <button
                            className="text-button"
                            onClick={onEdit}
                        >
                            <Pencil size={14} />
                            Edit notes
                        </button>
                    </section>
                </aside>
            </div>
        </section>
    );
}

function Info({ label, value }) {
    return (
        <div className="info-row">
            <span>{label}</span>
            <strong>{value}</strong>
        </div>
    );
}

function AuthScreen() {
    const [mode, setMode] = useState("signin");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");

    const [busy, setBusy] = useState(false);
    const [error, setError] = useState("");

    const submit = async (event) => {
        event.preventDefault();

        setBusy(true);
        setError("");

        try {
            if (mode === "signup") {
                await createUserWithEmailAndPassword(
                    auth,
                    email.trim(),
                    password
                );
            } else {
                await signInWithEmailAndPassword(
                    auth,
                    email.trim(),
                    password
                );
            }
        } catch (err) {
            setError(authMessage(err.code));
        } finally {
            setBusy(false);
        }
    };

    const google = async () => {
        setBusy(true);
        setError("");

        try {
            await signInWithPopup(
                auth,
                new GoogleAuthProvider()
            );
        } catch (err) {
            setError(authMessage(err.code));
        } finally {
            setBusy(false);
        }
    };

    return (
        <main className="auth-screen">
            <form className="auth-card" onSubmit={submit}>
                <div className="brand-mark auth-mark">
                    <img
                        src="/logo-v2.png"
                        alt="Leaf & Letter"
                        className="brand-logo"
                    />
                </div>

                <span className="section-kicker">
                    YOUR PERSONAL READING ROOM
                </span>

                <h1>
                    Leaf <em>&</em> Letter
                </h1>

                <p>
                    {mode === "signup"
                        ? "Create your private reading library."
                        : "Welcome back to your reading room."}
                </p>

                <label>
                    Email address

                    <input
                        type="email"
                        autoComplete="email"
                        required
                        value={email}
                        onChange={(event) =>
                            setEmail(event.target.value)
                        }
                        placeholder="you@example.com"
                    />
                </label>

                <label>
                    Password

                    <input
                        type="password"
                        minLength="6"
                        autoComplete={
                            mode === "signup"
                                ? "new-password"
                                : "current-password"
                        }
                        required
                        value={password}
                        onChange={(event) =>
                            setPassword(event.target.value)
                        }
                        placeholder="At least 6 characters"
                    />
                </label>

                {error && (
                    <div className="auth-error">
                        {error}
                    </div>
                )}

                <button
                    className="primary-button auth-submit"
                    disabled={busy}
                >
                    {busy
                        ? "Please wait…"
                        : mode === "signup"
                            ? "Create account"
                            : "Sign in"}
                </button>

                <div className="auth-divider">OR</div>

                <button
                    type="button"
                    className="secondary-button auth-google"
                    disabled={busy}
                    onClick={google}
                >
                    Continue with Google
                </button>

                <p className="auth-switch">
                    {mode === "signup"
                        ? "Already have an account?"
                        : "New to Leaf & Letter?"}{" "}

                    <button
                        type="button"
                        onClick={() => {
                            setMode(
                                mode === "signup"
                                    ? "signin"
                                    : "signup"
                            );

                            setError("");
                        }}
                    >
                        {mode === "signup"
                            ? "Sign in"
                            : "Create account"}
                    </button>
                </p>
            </form>
        </main>
    );
}

function authMessage(code) {
    const messages = {
        "auth/email-already-in-use":
            "An account already exists for this email.",

        "auth/invalid-email":
            "Enter a valid email address.",

        "auth/weak-password":
            "Use a password with at least 6 characters.",

        "auth/invalid-credential":
            "Email or password is incorrect.",

        "auth/popup-closed-by-user":
            "Google sign-in was cancelled.",

        "auth/unauthorized-domain":
            "Add this website domain to Firebase Authentication's authorized domains.",
    };

    return (
        messages[code] ||
        "Authentication failed. Please try again."
    );
}

function App() {
    const [user, setUser] = useState(null);
    const [checking, setChecking] = useState(true);

    useEffect(
        () =>
            onAuthStateChanged(auth, (current) => {
                setUser(current);
                setChecking(false);
            }),
        []
    );

    if (checking) {
        return (
            <div className="auth-loading">
                Opening your reading room…
            </div>
        );
    }

    return user ? (
        <LibraryApp
            user={user}
            onLogout={() => signOut(auth)}
        />
    ) : (
        <AuthScreen />
    );
}

createRoot(
    document.getElementById("root")
).render(<App />);