// 'use client';
// import { loginThunk, registerThunk, logoutThunk } from '../../model/AuthThunk';

import { useContext } from "react";
import { AuthContext } from "../../providers/AuthProvider";

// import { useAppDispatch, useAppSelector } from '@/modules/app';
// import { ILoginForm, IRegisterForm } from '../../type/auth.type';
// import { authActions } from '../../model/AuthSlice';
// // import { useEffect } from 'react';
// // import { useRouter } from 'next/navigation';

// export const useAuth = () => {
//     const dispatch = useAppDispatch();
//     const auth = useAppSelector((state) => state.auth);

//     const login = (form: ILoginForm) => dispatch(loginThunk(form));
//     const register = (form: IRegisterForm) => dispatch(registerThunk(form));

//     const logout = () => dispatch(logoutThunk());
//     const clearError = () => dispatch(authActions.clearError());
//     // const router = useRouter();
//     // if(auth.currentUser && !auth.currentUser.isAcivated){
//     //     // router.push('/auth/confirm');
//     //     window.location.href = '/auth/confirm';
//     // }
//     // useEffect(() => {
//     //     if (auth.isAuthenticated && auth.currentUser) {
//     //         router.replace('/network');
//     //     }
//     // }, [auth.isAuthenticated, auth.currentUser]);



//     return {
//         ...auth,
//         login,
//         register,
//         logoutThunk,
//         logout,
//         clearError,
//     };
// };


export const useAuth = () => {
    const { user, setUser } = useContext(AuthContext);
    return { user, setUser };
}
