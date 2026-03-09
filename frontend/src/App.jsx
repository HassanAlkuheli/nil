import { BrowserRouter, Routes, Route } from "react-router";
import { WagmiProvider } from "wagmi";
import { QueryClientProvider } from "@tanstack/react-query";
import { wagmiConfig, queryClient } from "./config/wagmi";
import Navbar from "./components/layout/Navbar";
import Footer from "./components/layout/Footer";
import Home from "./pages/Home";
import Vault from "./pages/Vault";
import Dashboard from "./pages/Dashboard";
import BackgroundScene from "./components/ui/BackgroundScene";

export default function App() {
  return (
    <WagmiProvider config={wagmiConfig}>
      <QueryClientProvider client={queryClient}>
        <BrowserRouter>
          <div className="flex flex-col min-h-screen bg-nil-black text-nil-white relative z-0">
            <BackgroundScene />
            <Navbar />
            <main className="flex-1 relative z-10">
              <Routes>
                <Route path="/" element={<Home />} />
                <Route path="/vault" element={<Vault />} />
                <Route path="/dashboard" element={<Dashboard />} />
              </Routes>
            </main>
            <Footer />
          </div>
        </BrowserRouter>
      </QueryClientProvider>
    </WagmiProvider>
  );
}
