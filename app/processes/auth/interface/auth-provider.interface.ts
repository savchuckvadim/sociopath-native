import { IUser } from "@/entities";
import { Dispatch, SetStateAction } from "react";

export type TypeUserState = IUser | null;
export interface IAuthContext {
    user: TypeUserState;
    setUser: Dispatch<SetStateAction<TypeUserState>>;


}
