"use client";
import { createContext, useContext, useState } from "react";

type CityContextType = {
  city: string;
  setCity: (city: string) => void;
};

const CityContext = createContext<CityContextType>({
  city: "Pune",
  setCity: () => {},
});

export function CityProvider({ children }: { children: React.ReactNode }) {
  const [city, setCity] = useState("Pune");
  return (
    <CityContext.Provider value={{ city, setCity }}>
      {children}
    </CityContext.Provider>
  );
}

export function useCity() {
  return useContext(CityContext);
}