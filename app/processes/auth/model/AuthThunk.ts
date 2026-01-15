import { createAsyncThunk } from "@reduxjs/toolkit";
import { AuthService } from "../lib/api/AuthService";
import { ILoginForm, IRegisterForm } from "../type/auth.type";

import { getApiErrorMessage } from "../lib/utils/api-error.util";
import { UserDto } from "@/api";


export const loginThunk = createAsyncThunk<
    UserDto,
    ILoginForm>(
        'auth/login',
        async (form, { rejectWithValue }) => {
            try {
                const authService = new AuthService();
                const response = await authService.login(form.email, form.password);

                // localStorage.setItem(AUTH_ACCESS_TOKEN_NAME_PUBLIC, response.tokens.accessToken);

                return response.user;

            } catch (error) {
                return rejectWithValue(getApiErrorMessage(error));
            }
        });




export const registerThunk =
    createAsyncThunk<
        UserDto,
        IRegisterForm>('auth/registerClient', async (form, { rejectWithValue }) => {
            const authService = new AuthService();
            try {
                const response = await authService.registration(form);
                // localStorage.setItem(AUTH_ACCESS_TOKEN_NAME_PUBLIC, response.tokens.accessToken);

                return response.user;
            } catch (error: any) {

                return rejectWithValue(getApiErrorMessage(error));
            }
        });


export const logoutThunk = createAsyncThunk<
    boolean,
    void
>('auth/logout', async (_, { rejectWithValue }) => {
    try {
        const authService = new AuthService();
        await authService.logout();
        // localStorage.removeItem(AUTH_ACCESS_TOKEN_NAME_PUBLIC);
        window.location.href = '/auth/login';
        return true;
    } catch (error) {
        window.location.href = '/auth/login';
        return rejectWithValue(getApiErrorMessage(error));
    }
});


export const checkAuthThunk = createAsyncThunk<
    UserDto,
    void
>('auth/checkAuth', async (_, { rejectWithValue }) => {
    try {

        const authService = new AuthService();
        const response = await authService.refreshToken();

        return response.user;
    } catch (error) {

        return rejectWithValue(getApiErrorMessage(error));
    }
});
