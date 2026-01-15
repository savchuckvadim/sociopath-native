import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import { IAuthState } from "../type/auth.type";
import { checkAuthThunk, loginThunk, logoutThunk, registerThunk } from "./AuthThunk";
import { UserDto } from "@/api";


const initialState: IAuthState = {
    isAuthenticated: false,
    isLoading: false,
    error: null as string | null,
    currentUser: null as UserDto | null,
};

export const authSlice = createSlice({
    name: 'auth',
    initialState,
    reducers: {
        setIsAuthenticated: (state: IAuthState, action: PayloadAction<boolean>) => {
            state.isAuthenticated = action.payload;
        },
        clearError: (state: IAuthState) => {
            state.error = null;
        },
    },
    extraReducers: (builder) => {
        builder.addCase(loginThunk.fulfilled, (state: IAuthState, action: PayloadAction<UserDto>) => {
            state.isAuthenticated = true;
            state.currentUser = action.payload;
            state.isLoading = false;
            if (action.payload) {
                window.location.href = '/network/profile';
            } else {
                window.location.href = '/auth/confirm';
            }
        });
        builder.addCase(loginThunk.rejected, (state: IAuthState, action) => {
            state.error = (action.payload as string) || action.error?.message || 'Login failed';
            state.isLoading = false;
        });
        builder.addCase(loginThunk.pending, (state: IAuthState) => {
            state.isLoading = true;
            state.error = null;
        });
        builder.addCase(checkAuthThunk.fulfilled, (state: IAuthState, action: PayloadAction<UserDto>) => {
            state.isAuthenticated = true;
            state.currentUser = action.payload;

        });


        builder.addCase(registerThunk.fulfilled, (state: IAuthState, action) => {
            state.isAuthenticated = true;
            state.currentUser = action.payload;
            state.isLoading = false;

            window.location.href = '/auth/confirm';
        });
        builder.addCase(registerThunk.rejected, (state: IAuthState, action) => {
            state.error = (action.payload as string) || action.error?.message || 'Registration failed';
            state.isLoading = false;
        });
        builder.addCase(registerThunk.pending, (state: IAuthState) => {
            state.isLoading = true;
            state.error = null;
        });
        builder.addCase(logoutThunk.fulfilled, (state: IAuthState) => {
            state.isAuthenticated = false;
            state.currentUser = null;
            state.isLoading = false;

            window.location.href = '/auth/login';
        });
        builder.addCase(logoutThunk.rejected, (state: IAuthState, action) => {
            state.error = (action.payload as string) || action.error?.message || 'Logout failed';
            state.isLoading = false;
        });
    },
});

export const authReducer = authSlice.reducer;
export const authActions = authSlice.actions;
