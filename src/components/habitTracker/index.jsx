import { useEffect, useRef, useState } from "react";
import { FiCheck, FiChevronLeft, FiChevronRight, FiZap, FiPlus, FiTrash2 } from "react-icons/fi";
import styles from "./styles.module.css";
const key = "habit-tracker-data";
const dateId = (date) => [date.getFullYear(), String(date.getMonth() + 1).padStart(2, "0"), String(date.getDate()).padStart(2, "0")].join("-");
const base = new Date(); base.setHours(12, 0, 0, 0);
const seed = [{ id: "h1", name: "Read a few pages", icon: "R", color: "plum", dates: [dateId(base)] }, { id: "h2", name: "Take a morning walk", icon: "W", color: "mint", dates: [] }, { id: "h3", name: "Stretch for five minutes", icon: "S", color: "gold", dates: [dateId(base)] }, { id: "h4", name: "Write one good thing", icon: "J", color: "blue", dates: [] }];
const load = () => { try { const items = JSON.parse(localStorage.getItem(key)); return Array.isArray(items) ? items : seed; } catch { return seed; } };
const HabitTracker = () => {
    const [habits, setHabits] = useState(load);
    const [offset, setOffset] = useState(0);
    const [newName, setNewName] = useState("");
    const [removing, setRemoving] = useState(null);
    const cancelRef = useRef(null);
    useEffect(() => localStorage.setItem(key, JSON.stringify(habits)), [habits]);
    useEffect(() => {
        if (!removing) return undefined;
        cancelRef.current?.focus();
        const onKey = (event) => { if (event.key === "Escape") setRemoving(null); };
        window.addEventListener("keydown", onKey);
        return () => window.removeEventListener("keydown", onKey);
    }, [removing]);
    const monday = new Date(base); monday.setDate(base.getDate() - ((base.getDay() + 6) % 7) + offset * 7);
    const days = Array.from({ length: 7 }, (_, index) => { const date = new Date(monday); date.setDate(monday.getDate() + index); return date; });
    const todayKey = dateId(base);
    const weekHits = habits.reduce((sum, habit) => sum + habit.dates.filter((day) => days.some((date) => dateId(date) === day)).length, 0);
    const goal = habits.length * 7;
    const streak = (habit) => { let count = 0; const cursor = new Date(base); while (habit.dates.includes(dateId(cursor))) { count += 1; cursor.setDate(cursor.getDate() - 1); if (count > 365) break; } return count; };
    const toggle = (habitId, date) => setHabits((items) => items.map((habit) => { if (habit.id !== habitId) return habit; const id = dateId(date); return { ...habit, dates: habit.dates.includes(id) ? habit.dates.filter((saved) => saved !== id) : [...habit.dates, id] }; }));
    const add = (event) => { event.preventDefault(); const name = newName.trim(); if (!name) return; setHabits((items) => [...items, { id: crypto.randomUUID(), name, icon: name.slice(0, 1).toUpperCase(), color: "blue", dates: [] }]); setNewName(""); };
    const weekLabel = days[0].toLocaleDateString("en", { month: "short", day: "numeric" }) + " - " + days[6].toLocaleDateString("en", { month: "short", day: "numeric" });
    return <section className={styles.habitPage}>
        <div className={styles.heading}><div><p className={styles.label}>A small promise, kept often</p><h1>Routines take root.</h1><p>Track the things that help your days feel like yours.</p></div><form onSubmit={add}><input value={newName} onChange={(event) => setNewName(event.target.value)} placeholder="Name a habit" aria-label="New habit name" required /><button aria-label="Add habit"><FiPlus /> Add habit</button></form></div>
        <div className={styles.weekBar} id="week"><div><FiZap /><span><small>This week</small><strong>{weekHits} check-ins</strong></span></div><div className={styles.weekProgress}><span>{goal ? Math.round(weekHits / goal * 100) : 0}% of weekly check-ins</span><i><b style={{ width: (goal ? Math.min(100, weekHits / goal * 100) : 0) + "%" }} /></i></div><div className={styles.weekChange}><button onClick={() => setOffset(offset - 1)} aria-label="Previous week"><FiChevronLeft /></button><strong>{weekLabel}</strong><button onClick={() => setOffset(offset + 1)} aria-label="Next week"><FiChevronRight /></button></div></div>
        <div className={styles.tracker} id="insights"><div className={styles.headerRow}><div>Habit</div>{days.map((day) => <div className={dateId(day) === todayKey ? styles.today : ""} key={dateId(day)}><small>{day.toLocaleDateString("en", { weekday: "short" })}</small><strong>{day.getDate()}</strong></div>)}<div>Streak</div></div>
            {habits.map((habit, index) => <div className={styles.habitRow} key={habit.id}><div className={styles.habitName}><span className={[styles.habitIcon, styles["tone" + (index % 4)]].join(" ")}>{habit.icon}</span><strong>{habit.name}</strong><button onClick={() => setRemoving(habit)} aria-label={"Remove " + habit.name}><FiTrash2 /></button></div>{days.map((day) => { const checked = habit.dates.includes(dateId(day)); return <div className={styles.cell} key={dateId(day)}><button className={checked ? styles.checked : ""} onClick={() => toggle(habit.id, day)} aria-label={(checked ? "Uncheck " : "Check ") + habit.name + " for " + dateId(day)} aria-pressed={checked}><FiCheck /></button></div>; })}<div className={styles.streak}><FiZap />{streak(habit)}<small>d</small></div></div>)}
            {!habits.length && <p className={styles.empty}>Add a habit to begin your weekly rhythm.</p>}
        </div>
        <p className={styles.privacy}>Your check-ins stay on this device. A missed day is just a chance to begin again.</p>
        {removing && <div className={styles.modal}><section role="dialog" aria-modal="true" aria-labelledby="remove-title" aria-describedby="remove-copy"><FiTrash2 /><h2 id="remove-title">Remove this habit?</h2><p id="remove-copy"><strong>{removing.name}</strong> and its check-in history will be removed.</p><div><button ref={cancelRef} onClick={() => setRemoving(null)}>Keep habit</button><button onClick={() => { setHabits((items) => items.filter((item) => item.id !== removing.id)); setRemoving(null); }}>Remove habit</button></div></section></div>}
    </section>;
};
export default HabitTracker;
