import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { User } from './userSlice';

const currentUserSlice = createSlice({
  name: 'currentUser',
  initialState: null as User | null,
  reducers: {
    setCurrentUser: (_, action: PayloadAction<User | null>) => {
      return action.payload;
    },
  },
});

export const { setCurrentUser } = currentUserSlice.actions;
export default currentUserSlice.reducer;
