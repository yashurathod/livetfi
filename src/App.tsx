import { BrowserRouter, Routes, Route } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import Index from "./pages/Index";

const queryClient = new QueryClient();

const base = (import.meta.env.BASE_URL ?? "/").replace(/\/$/, "") || undefined;

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter basename={base}>
        <Routes>
          <Route path="/" element={<Index />} />
          <Route path="*" element={<Index />} />
        </Routes>
      </BrowserRouter>
    </QueryClientProvider>
  );
}
