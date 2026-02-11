import { useContext } from "react";
import { AuthContext } from "../../providers/AuthProvider";


export const useAuth = () => {
    const { user, setUser } = useContext(AuthContext);
    return { user, setUser };
}
