// src/context/AppContext.js
import { createContext, useContext, useState } from "react";

export const AppContext = createContext();

export const AppProvider = ({ children }) => {
  const [baseUrl, setBaseUrl] = useState("https://localhost::8448/");

  return (
    <AppContext.Provider value={{ baseUrl, setBaseUrl }}>
      {children}
    </AppContext.Provider>
  );
};

export const useAppContext = () => useContext(AppContext);
