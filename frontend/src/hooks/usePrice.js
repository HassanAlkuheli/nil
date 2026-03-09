import { useState, useEffect, useRef } from "react";

export function usePrice() {
  const [ethPrice, setEthPrice] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const lastKnownPrice = useRef(0);

  useEffect(() => {
    const fetchPrice = async () => {
      try {
        const res = await fetch(
          "https://api.coingecko.com/api/v3/simple/price?ids=ethereum&vs_currencies=usd"
        );
        const data = await res.json();
        const price = data?.ethereum?.usd || lastKnownPrice.current;
        lastKnownPrice.current = price;
        setEthPrice(price);
        setError(null);
      } catch (err) {
        setError(err.message);
        // Keep last known price
        if (lastKnownPrice.current > 0) {
          setEthPrice(lastKnownPrice.current);
        }
      } finally {
        setLoading(false);
      }
    };

    fetchPrice();
    const interval = setInterval(fetchPrice, 60000);
    return () => clearInterval(interval);
  }, []);

  return { ethPrice, loading, error };
}
