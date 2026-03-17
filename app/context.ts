import { unstable_createContext } from "react-router";
import type { User } from "~/types";

export const userContext = unstable_createContext<User | null>(null);
