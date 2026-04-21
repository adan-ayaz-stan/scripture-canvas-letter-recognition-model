import { ThemeProvider } from "@/components/theme-provider";
import Landing from "./screens/Landing";

function App() {
  return (
    <ThemeProvider defaultTheme="dark" storageKey="vite-ui-theme">
      <Landing />
    </ThemeProvider>
  );
}

export default App;
