import { createContext, useContext } from "react";
import type { Profile } from "./profiles";
import { SKYLINE_PROFILE } from "./profiles";

export const ProfileContext = createContext<Profile>(SKYLINE_PROFILE);
export const useProfile = () => useContext(ProfileContext);
