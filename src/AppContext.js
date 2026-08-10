// src/context/AppContext.js
import { createContext, useContext, useState } from "react";

export const AppContext = createContext();

export const AppProvider = ({ children }) => {
  const [baseUrl, setBaseUrl] = useState("https://chatwebapp1-0-1.onrender.comm/");

  return (
    <AppContext.Provider value={{ baseUrl, setBaseUrl }}>
      {children}
    </AppContext.Provider>
  );
};

export const useAppContext = () => useContext(AppContext);
