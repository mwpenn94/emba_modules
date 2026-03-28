import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/NotFound";
import { Route, Switch } from "wouter";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";
import { MasteryProvider } from "./contexts/MasteryContext";
import AchievementToast from "./components/AchievementToast";
import Home from "./pages/Home";
import DisciplinePage from "./pages/DisciplinePage";
import FormulasPage from "./pages/FormulasPage";
import QuizPage from "./pages/QuizPage";
import ConnectionsPage from "./pages/ConnectionsPage";
import CasesPage from "./pages/CasesPage";
import SearchPage from "./pages/SearchPage";
import ExamSimulator from "./pages/ExamSimulator";
import FormulaLab from "./pages/FormulaLab";
import CaseSimulator from "./pages/CaseSimulator";
import ConnectionMap from "./pages/ConnectionMap";
import FSToolkit from "./pages/FSToolkit";
import StudySession from "./pages/StudySession";
import Achievements from "./pages/Achievements";

function Router() {
  return (
    <Switch>
      <Route path="/" component={Home} />
      <Route path="/discipline/:slug" component={DisciplinePage} />
      <Route path="/study" component={StudySession} />
      <Route path="/study/:slug" component={StudySession} />
      <Route path="/achievements" component={Achievements} />
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
