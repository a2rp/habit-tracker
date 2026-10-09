import { useEffect, useState } from "react";
import HabitTracker from "./components/habitTracker/index.jsx";
import BackToTop from "./components/backToTop/index.jsx";
import SiteFooter from "./components/siteFooter/index.jsx";
import SiteHeader from "./components/siteHeader/index.jsx";
import styles from "./App.module.css";
const App = () => {
 const [showBackToTop, setShowBackToTop] = useState(false);
 useEffect(() => { const update = () => setShowBackToTop(window.scrollY > 50); window.addEventListener("scroll", update, { passive: true }); update(); return () => window.removeEventListener("scroll", update); }, []);
 return <div className={styles.appShell} id="top"><SiteHeader title="Habit Tracker" mark="H" repoUrl="https://github.com/a2rp/habit-tracker" navItems={[["Week","#week"],["Insights","#insights"]]} /><main className={styles.pageContent}><HabitTracker /></main><SiteFooter repoUrl="https://github.com/a2rp/habit-tracker" /><BackToTop visible={showBackToTop} /></div>;
};
export default App;