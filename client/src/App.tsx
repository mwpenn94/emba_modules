import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Route, Switch } from "wouter";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";
import { MasteryProvider } from "./contexts/MasteryContext";
import AchievementToast from "./components/AchievementToast";
import { lazy, Suspense } from "react";

/* ── Lazy-loaded pages for code-splitting ── */
const Home = lazy(() => import("./pages/Home"));
const DisciplinePage = lazy(() => import("./pages/DisciplinePage"));
const FormulasPage = lazy(() => import("./pages/FormulasPage"));
const QuizPage = lazy(() => import("./pages/QuizPage"));
const ConnectionsPage = lazy(() => import("./pages/ConnectionsPage"));
const CasesPage = lazy(() => import("./pages/CasesPage"));
const SearchPage = lazy(() => import("./pages/SearchPage"));
const ExamSimulator = lazy(() => import("./pages/ExamSimulator"));
const FormulaLab = lazy(() => import("./pages/FormulaLab"));
const CaseSimulator = lazy(() => import("./pages/CaseSimulator"));
const ConnectionMap = lazy(() => import("./pages/ConnectionMap"));
const FSToolkit = lazy(() => import("./pages/FSToolkit"));
const StudySession = lazy(() => import("./pages/StudySession"));
const Achievements = lazy(() => import("./pages/Achievements"));
const ProgressExport = lazy(() => import("./pages/ProgressExport"));
const DisciplineDeepDive = lazy(() => import("./pages/DisciplineDeepDive"));
const NotFound = lazy(() => import("./pages/NotFound"));

/* ── Loading fallback ── */
function PageLoader() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="flex flex-col items-center gap-3">
        <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
        <p className="text-xs text-muted-foreground font-mono tracking-wider">Loading module...</p>
      </div>
    </div>
  );
}

function Router() {
  return (
    <Suspense fallback={<PageLoader />}>
      <Switch>
        <Route path="/" component={Home} />
        <Route path="/discipline/:slug" component={DisciplinePage} />
        <Route path="/study" component={StudySession} />
        <Route path="/study/:slug" component={StudySession} />
        <Route path="/achievements" component={Achievements} />
        <Route path="/progress" component={ProgressExport} />
        <Route path="/learn/:slug" component={DisciplineDeepDive} />
        <Route path="/formulas" component={FormulasPage} />
        <Route path="/quiz" component={QuizPage} />
        <Route path="/connections" component={ConnectionsPage} />
        <Route path="/cases" component={CasesPage} />
        <Route path="/search" component={SearchPage} />
        <Route path="/exam-simulator" component={ExamSimulator} />
        <Route path="/formula-lab" component={FormulaLab} />
        <Route path="/case-simulator" component={CaseSimulator} />
        <Route path="/connection-map" component={ConnectionMap} />
        <Route path="/fs-toolkit" component={FSToolkit} />
        <Route path="/404" component={NotFound} />
        <Route component={NotFound} />
      </Switch>
    </Suspense>
  );
}

function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider defaultTheme="dark">
        <MasteryProvider>
          <TooltipProvider>
            <a href="#main-content" className="skip-to-content">
              Skip to content
            </a>
            <Toaster />
            <AchievementToast />
            <main id="main-content" role="main">
              <Router />
            </main>
          </TooltipProvider>
        </MasteryProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;
