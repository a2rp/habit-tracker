import { useEffect, useRef, useState } from "react";
import {
    FiCheck,
    FiChevronLeft,
    FiChevronRight,
    FiPlus,
    FiTrash2,
    FiZap,
} from "react-icons/fi";
import styles from "./styles.module.css";

const STORAGE_KEY = "habit-tracker-data";
const MAX_HABIT_NAME_LENGTH = 60;

const getToday = () => {
    const date = new Date();
    date.setHours(12, 0, 0, 0);
    return date;
};

const dateId = (date) =>
    [
        date.getFullYear(),
        String(date.getMonth() + 1).padStart(2, "0"),
        String(date.getDate()).padStart(2, "0"),
    ].join("-");

const isValidDateId = (value) => {
    if (typeof value !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(value)) {
        return false;
    }

    const [year, month, day] = value.split("-").map(Number);
    return dateId(new Date(year, month - 1, day, 12)) === value;
};

const createSeedHabits = () => {
    const today = dateId(getToday());

    return [
        { id: "h1", name: "Read a few pages", icon: "R", dates: [today] },
        { id: "h2", name: "Take a morning walk", icon: "W", dates: [] },
        { id: "h3", name: "Stretch for five minutes", icon: "S", dates: [today] },
        { id: "h4", name: "Write one good thing", icon: "J", dates: [] },
    ];
};

const normalizeHabits = (value) => {
    if (!Array.isArray(value)) return null;

    const usedIds = new Set();

    return value.flatMap((item, index) => {
        if (!item || typeof item !== "object" || Array.isArray(item)) return [];

        const name = typeof item.name === "string"
            ? Array.from(item.name.trim()).slice(0, MAX_HABIT_NAME_LENGTH).join("")
            : "";
        if (!name) return [];

        const baseId = typeof item.id === "string" && item.id.trim()
            ? item.id.trim()
            : `habit-${index + 1}`;
        let id = baseId;
        let duplicate = 1;
        while (usedIds.has(id)) {
            duplicate += 1;
            id = `${baseId}-${duplicate}`;
        }
        usedIds.add(id);

        const dates = Array.isArray(item.dates)
            ? [...new Set(item.dates.filter(isValidDateId))]
            : [];
        const icon = typeof item.icon === "string" && item.icon.trim()
            ? Array.from(item.icon.trim()).slice(0, 2).join("")
            : Array.from(name)[0].toUpperCase();

        return [{ id, name, icon, dates }];
    });
};

const loadHabits = () => {
    try {
        const saved = localStorage.getItem(STORAGE_KEY);
        if (saved === null) return createSeedHabits();

        return normalizeHabits(JSON.parse(saved)) ?? createSeedHabits();
    } catch {
        return createSeedHabits();
    }
};

const HabitTracker = () => {
    const [habits, setHabits] = useState(loadHabits);
    const [offset, setOffset] = useState(0);
    const [newName, setNewName] = useState("");
    const [removing, setRemoving] = useState(null);
    const [storageError, setStorageError] = useState(false);
    const addInputRef = useRef(null);
    const cancelRef = useRef(null);
    const dialogRef = useRef(null);

    useEffect(() => {
        try {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(habits));
            queueMicrotask(() => setStorageError(false));
        } catch {
            queueMicrotask(() => setStorageError(true));
        }
    }, [habits]);

    useEffect(() => {
        if (!removing) return undefined;

        const previouslyFocused = document.activeElement;
        const addInput = addInputRef.current;
        cancelRef.current?.focus();

        const onKeyDown = (event) => {
            if (event.key === "Escape") {
                event.preventDefault();
                setRemoving(null);
                return;
            }

            if (event.key !== "Tab") return;

            const focusable = dialogRef.current?.querySelectorAll("button:not([disabled])");
            if (!focusable?.length) {
                event.preventDefault();
                dialogRef.current?.focus();
                return;
            }

            const first = focusable[0];
            const last = focusable[focusable.length - 1];
            if (event.shiftKey && document.activeElement === first) {
                event.preventDefault();
                last.focus();
            } else if (!event.shiftKey && document.activeElement === last) {
                event.preventDefault();
                first.focus();
            }
        };

        window.addEventListener("keydown", onKeyDown);
        return () => {
            window.removeEventListener("keydown", onKeyDown);

            if (previouslyFocused instanceof HTMLElement && previouslyFocused.isConnected) {
                previouslyFocused.focus();
            } else {
                addInput?.focus();
            }
        };
    }, [removing]);

    const today = getToday();
    const todayKey = dateId(today);
    const monday = new Date(today);
    monday.setDate(today.getDate() - ((today.getDay() + 6) % 7) + offset * 7);

    const days = Array.from({ length: 7 }, (_, index) => {
        const date = new Date(monday);
        date.setDate(monday.getDate() + index);
        return date;
    });

    const weekHits = habits.reduce(
        (sum, habit) => sum + habit.dates.filter((day) => days.some((date) => dateId(date) === day)).length,
        0,
    );
    const goal = habits.length * 7;
    const progress = goal ? Math.min(100, (weekHits / goal) * 100) : 0;

    const streak = (habit) => {
        let count = 0;
        const cursor = new Date(today);

        while (habit.dates.includes(dateId(cursor))) {
            count += 1;
            cursor.setDate(cursor.getDate() - 1);
        }

        return count;
    };

    const toggle = (habitId, date) => {
        const id = dateId(date);
        if (id > todayKey) return;

        setHabits((items) => items.map((habit) => {
            if (habit.id !== habitId) return habit;

            return {
                ...habit,
                dates: habit.dates.includes(id)
                    ? habit.dates.filter((saved) => saved !== id)
                    : [...habit.dates, id],
            };
        }));
    };

    const add = (event) => {
        event.preventDefault();
        const name = Array.from(newName.trim()).slice(0, MAX_HABIT_NAME_LENGTH).join("");
        if (!name) return;

        setHabits((items) => [
            ...items,
            { id: crypto.randomUUID(), name, icon: Array.from(name)[0].toUpperCase(), dates: [] },
        ]);
        setNewName("");
        addInputRef.current?.focus();
    };

    const weekLabel = `${days[0].toLocaleDateString("en", { month: "short", day: "numeric" })} - ${days[6].toLocaleDateString("en", { month: "short", day: "numeric" })}`;

    return (
        <section className={styles.habitPage}>
            <div className={styles.heading}>
                <div>
                    <p className={styles.label}>A small promise, kept often</p>
                    <h1>Routines take root.</h1>
                    <p>Track the things that help your days feel like yours.</p>
                </div>
                <form onSubmit={add}>
                    <input
                        ref={addInputRef}
                        value={newName}
                        onChange={(event) => setNewName(event.target.value)}
                        placeholder="Name a habit"
                        aria-label="New habit name"
                        maxLength={MAX_HABIT_NAME_LENGTH}
                        required
                    />
                    <button type="submit"><FiPlus aria-hidden="true" /> Add habit</button>
                </form>
            </div>

            <div className={styles.weekBar} id="week">
                <div>
                    <FiZap aria-hidden="true" />
                    <span><small>Selected week</small><strong>{weekHits} check-ins</strong></span>
                </div>
                <div className={styles.weekProgress}>
                    <span>{Math.round(progress)}% of weekly check-ins</span>
                    <i
                        role="progressbar"
                        aria-label="Weekly check-ins"
                        aria-valuemin={0}
                        aria-valuemax={Math.max(goal, 1)}
                        aria-valuenow={weekHits}
                        aria-valuetext={`${weekHits} of ${goal} weekly check-ins`}
                    >
                        <b style={{ width: `${progress}%` }} />
                    </i>
                </div>
                <div className={styles.weekChange}>
                    <button type="button" onClick={() => setOffset((current) => current - 1)} aria-label="Previous week"><FiChevronLeft /></button>
                    <strong>{weekLabel}</strong>
                    <button type="button" onClick={() => setOffset((current) => current + 1)} aria-label="Next week"><FiChevronRight /></button>
                </div>
            </div>

            <div className={styles.tracker} id="insights">
                <div className={styles.headerRow}>
                    <div>Habit</div>
                    {days.map((day) => (
                        <div className={dateId(day) === todayKey ? styles.today : ""} key={dateId(day)}>
                            <small>{day.toLocaleDateString("en", { weekday: "short" })}</small>
                            <strong>{day.getDate()}</strong>
                        </div>
                    ))}
                    <div>Streak</div>
                </div>

                {habits.map((habit, index) => (
                    <div className={styles.habitRow} key={habit.id}>
                        <div className={styles.habitName}>
                            <span className={[styles.habitIcon, styles[`tone${index % 4}`]].join(" ")} aria-hidden="true">{habit.icon}</span>
                            <strong>{habit.name}</strong>
                            <button type="button" onClick={() => setRemoving(habit)} aria-label={`Remove ${habit.name}`}>
                                <FiTrash2 aria-hidden="true" />
                            </button>
                        </div>
                        {days.map((day) => {
                            const id = dateId(day);
                            const checked = habit.dates.includes(id);
                            const isFuture = id > todayKey;

                            return (
                                <div className={styles.cell} key={id}>
                                    <button
                                        type="button"
                                        className={checked ? styles.checked : ""}
                                        onClick={() => toggle(habit.id, day)}
                                        aria-label={`${checked ? "Uncheck" : "Check"} ${habit.name} for ${id}`}
                                        aria-pressed={checked}
                                        disabled={isFuture}
                                    >
                                        <FiCheck aria-hidden="true" />
                                    </button>
                                </div>
                            );
                        })}
                        <div className={styles.streak}><FiZap aria-hidden="true" />{streak(habit)}<small>d</small></div>
                    </div>
                ))}

                {!habits.length && <p className={styles.empty} role="status">Add a habit to begin your weekly rhythm.</p>}
            </div>

            <p className={styles.privacy} role="status" aria-live="polite">
                {storageError
                    ? "Changes could not be saved in this browser. Check its storage settings."
                    : "Your check-ins stay on this device. A missed day is just a chance to begin again."}
            </p>

            {removing && (
                <div className={styles.modal}>
                    <section
                        ref={dialogRef}
                        role="dialog"
                        aria-modal="true"
                        aria-labelledby="remove-title"
                        aria-describedby="remove-copy"
                        tabIndex={-1}
                    >
                        <FiTrash2 aria-hidden="true" />
                        <h2 id="remove-title">Remove this habit?</h2>
                        <p id="remove-copy"><strong>{removing.name}</strong> and its check-in history will be removed.</p>
                        <div>
                            <button type="button" ref={cancelRef} onClick={() => setRemoving(null)}>Keep habit</button>
                            <button
                                type="button"
                                onClick={() => {
                                    setHabits((items) => items.filter((item) => item.id !== removing.id));
                                    setRemoving(null);
                                }}
                            >
                                Remove habit
                            </button>
                        </div>
                    </section>
                </div>
            )}
        </section>
    );
};

export default HabitTracker;
