import { createContext, useContext } from "react";
import { ExtendedUser } from "../types/User";

export const UserContext = createContext<ExtendedUser | null>(null);
export const useUser = () => useContext(UserContext);
